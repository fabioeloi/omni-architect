const path = require('node:path');
const { slugify } = require('../utils');

async function loadPrdContent(prdSource) {
  try {
    const resolvedPath = path.resolve(process.cwd(), prdSource);
    const fs = require('node:fs/promises');
    const content = await fs.readFile(resolvedPath, 'utf8');
    return { content, source: resolvedPath, source_type: 'file' };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (/^https?:\/\//i.test(prdSource)) {
    const response = await fetch(prdSource);
    if (!response.ok) {
      throw new Error(`Failed to fetch PRD from ${prdSource}: ${response.status}`);
    }

    return {
      content: await response.text(),
      source: prdSource,
      source_type: 'url'
    };
  }

  return {
    content: prdSource,
    source: 'inline',
    source_type: 'inline'
  };
}

function getSection(markdown, heading) {
  const pattern = new RegExp(`##\\s+${heading}\\n\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  return markdown.match(pattern)?.[1]?.trim() || '';
}

function parseProject(markdown) {
  return markdown.match(/^#\s+PRD:\s+(.+)$/m)?.[1]?.trim() || 'Untitled Project';
}

function parsePersonas(section) {
  if (!section) {
    return [];
  }

  return section
    .split(/\n###\s+/)
    .filter(Boolean)
    .map((block) => {
      const normalized = block.startsWith('### ') ? block.slice(4) : block;
      const [titleLine, ...rest] = normalized.split('\n');
      const bullets = rest
        .filter((line) => line.trim().startsWith('- '))
        .map((line) => line.replace(/^- /, '').trim());
      const age = Number((bullets[0] || '').match(/(\d+)/)?.[1] || 0) || undefined;

      return {
        id: slugify(titleLine),
        name: titleLine.trim(),
        age,
        bullets,
        context: bullets.slice(1).join(', ')
      };
    });
}

function parseFeatureBlock(block, storyCounter, flowCounter) {
  const lines = block.split('\n');
  const title = lines[0].trim();
  const [, featureId, featureName] =
    title.match(/^(F\d+):\s+(.+)$/) || [];

  const metadataLine = lines.find((line) => /\*\*Prioridade\*\*/i.test(line)) || '';
  const dependenciesLine =
    lines.find((line) => /\*\*Dependências\*\*/i.test(line)) || '';
  const priority =
    metadataLine.match(/\*\*Prioridade\*\*:\s*([A-Za-zÀ-ÿ]+)/i)?.[1] || 'Média';
  const complexity =
    metadataLine.match(/\*\*Complexidade\*\*:\s*([A-Za-zÀ-ÿ]+)/i)?.[1] || 'Média';
  const dependencies = (dependenciesLine.match(/F\d+/g) || []).filter(Boolean);

  const storiesSection = block.match(/####\s+User Stories([\s\S]*?)(?=\n####\s+|$)/i)?.[1] || '';
  const stories = storiesSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => {
      const text = line.replace(/^- /, '').trim();
      const [persona, action, outcome] =
        text.match(/Como\s+\*\*(.+?)\*\*,\s+quero\s+\*\*(.+?)\*\*,\s+para\s+\*\*(.+?)\*\*/i)?.slice(1) ||
        [];
      storyCounter.count += 1;
      return {
        id: `US${String(storyCounter.count).padStart(3, '0')}`,
        text,
        persona,
        action,
        outcome
      };
    });

  const acceptanceSection =
    block.match(/####\s+Critérios de Aceite([\s\S]*?)(?=\n####\s+|$)/i)?.[1] || '';
  const acceptanceCriteria = acceptanceSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- [ ]'))
    .map((line) => line.replace(/^- \[ \]\s*/, '').trim());

  const flowSection = block.match(/####\s+Fluxo([\s\S]*?)(?=\n####\s+|$)/i)?.[1] || '';
  const flowSteps = flowSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, '').trim());

  const flows = flowSteps.length
    ? [
        {
          id: `FL${String(++flowCounter.count).padStart(3, '0')}`,
          name: `${featureName} Flow`,
          feature: featureId,
          steps: flowSteps
        }
      ]
    : [];

  return {
    id: featureId,
    name: featureName,
    priority: priority.toLowerCase(),
    complexity: complexity.toLowerCase(),
    dependencies,
    stories,
    story_ids: stories.map((story) => story.id),
    acceptance_criteria: acceptanceCriteria,
    flows
  };
}

function inferRelationships(entities) {
  const entityMap = new Map(entities.map((entity) => [entity.name.toLowerCase(), entity]));
  const relationships = [];

  for (const entity of entities) {
    for (const attribute of entity.attributes) {
      if (!attribute.endsWith('_id')) {
        continue;
      }

      const targetName = attribute.replace(/_id$/, '');
      const matching = Array.from(entityMap.keys()).find((key) => key === targetName.toLowerCase());
      if (!matching) {
        continue;
      }

      relationships.push({
        source: entity.name,
        target: entityMap.get(matching).name,
        type: entity.name === entityMap.get(matching).name ? 'self' : 'many-to-one',
        attribute
      });
    }
  }

  return relationships;
}

function parseEntities(section) {
  const rows = section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\|/.test(line))
    .slice(2);

  const entities = rows.map((row) => {
    const [, name, attributes] = row.split('|').map((cell) => cell.trim());
    return {
      name,
      attributes: attributes.split(',').map((item) => item.trim()),
      relationships: []
    };
  });

  const inferred = inferRelationships(entities);
  for (const entity of entities) {
    entity.relationships = inferred
      .filter((relationship) => relationship.source === entity.name)
      .map(({ source, ...relationship }) => relationship);
  }

  return entities;
}

function parseNonFunctionalRequirements(section) {
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => {
      const [name, requirement] = line.replace(/^- /, '').split(':');
      return {
        name: name.trim(),
        requirement: (requirement || '').trim()
      };
    });
}

function computeCompleteness(parsed) {
  const dimensions = [
    parsed.project ? 1 : 0,
    parsed.overview ? 1 : 0,
    parsed.personas.length ? 1 : 0,
    parsed.features.length >= 3 ? 1 : parsed.features.length / 3,
    parsed.user_stories.length >= 5 ? 1 : parsed.user_stories.length / 5,
    parsed.entities.length >= 4 ? 1 : parsed.entities.length / 4,
    parsed.flows.length ? 1 : 0,
    parsed.non_functional_requirements.length >= 3
      ? 1
      : parsed.non_functional_requirements.length / 3
  ];

  const score = dimensions.reduce((sum, value) => sum + value, 0) / dimensions.length;
  return Number(score.toFixed(2));
}

function extractExternalSystems(markdown) {
  const systems = [];

  if (/correios api/i.test(markdown)) {
    systems.push({ name: 'Correios API', type: 'shipping' });
  }
  if (/google\/apple/i.test(markdown) || /google/i.test(markdown)) {
    systems.push({ name: 'Google OAuth', type: 'identity' });
  }
  if (/apple/i.test(markdown)) {
    systems.push({ name: 'Apple OAuth', type: 'identity' });
  }
  if (/email/i.test(markdown)) {
    systems.push({ name: 'Email Service', type: 'notification' });
  }

  return systems;
}

async function parsePrd(config, logger) {
  const loaded = await loadPrdContent(config.prd_source);
  const markdown = loaded.content;
  const storyCounter = { count: 0 };
  const flowCounter = { count: 0 };
  const overview = getSection(markdown, 'Visão Geral');
  const personas = parsePersonas(getSection(markdown, 'Personas'));
  const featuresSection = getSection(markdown, 'Features');
  const featureBlocks = featuresSection
    .split(/\n###\s+/)
    .filter(Boolean)
    .map((block) => (block.startsWith('### ') ? block.slice(4) : block));
  const features = featureBlocks.map((block) =>
    parseFeatureBlock(block, storyCounter, flowCounter)
  );

  const parsed = {
    project: parseProject(markdown),
    overview,
    source: loaded.source,
    source_type: loaded.source_type,
    personas,
    features: features.map((feature) => ({
      id: feature.id,
      name: feature.name,
      priority: feature.priority,
      complexity: feature.complexity,
      stories: feature.story_ids,
      dependencies: feature.dependencies
    })),
    feature_details: features,
    user_stories: features.flatMap((feature) =>
      feature.stories.map((story) => ({
        ...story,
        feature_id: feature.id,
        feature_name: feature.name
      }))
    ),
    flows: features.flatMap((feature) => feature.flows),
    entities: parseEntities(getSection(markdown, 'Entidades')),
    non_functional_requirements: parseNonFunctionalRequirements(
      getSection(markdown, 'Requisitos Não-Funcionais')
    ),
    external_systems: extractExternalSystems(markdown)
  };

  parsed.completeness_score = computeCompleteness(parsed);
  parsed.warnings = [];

  if (parsed.completeness_score < 0.6) {
    const message = 'PRD completeness score below 0.6. Continuing with partial data.';
    parsed.warnings.push(message);
    logger.warn(message, { completeness_score: parsed.completeness_score });
  }

  return parsed;
}

module.exports = {
  loadPrdContent,
  parsePrd
};
