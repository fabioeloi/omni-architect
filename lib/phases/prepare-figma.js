const path = require('node:path');
const { writeJson } = require('../utils');

function groupByPage(diagrams) {
  const pages = new Map();
  for (const diagram of diagrams.filter((item) => !item.skipped)) {
    if (!pages.has(diagram.page)) {
      pages.set(diagram.page, []);
    }
    pages.get(diagram.page).push({
      id: diagram.id,
      name: diagram.name,
      type: diagram.type,
      code: diagram.code,
      render_model: diagram.render_model,
      source_features: diagram.source_features,
      source_stories: diagram.source_stories
    });
  }

  return Array.from(pages.entries()).map(([name, diagramsOnPage]) => ({
    name,
    diagrams: diagramsOnPage
  }));
}

async function prepareFigmaPayload(config, parsedPrd, diagrams, validationReport) {
  const payload = {
    version: 1,
    session_id: path.basename(config.output_dir),
    project_name: config.project_name,
    figma_file_key: config.figma_file_key,
    design_system: config.design_system,
    locale: config.locale,
    namespace: `${config.project_name} - Omni Architect`,
    validation: {
      status: validationReport.status,
      overall_score: validationReport.overall_score
    },
    project: {
      name: parsedPrd.project,
      overview: parsedPrd.overview,
      personas: parsedPrd.personas,
      features: parsedPrd.features
    },
    pages: groupByPage(diagrams)
  };

  const payloadPath = path.join(config.output_dir, 'figma', 'figma-payload.json');
  await writeJson(payloadPath, payload);
  return {
    payload,
    payloadPath
  };
}

module.exports = {
  prepareFigmaPayload
};
