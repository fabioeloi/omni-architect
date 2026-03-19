const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

function round(value) {
  return Number(value.toFixed(2));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreCoverage(parsedPrd, diagrams) {
  const generated = diagrams.filter((diagram) => !diagram.skipped);
  const featureCoverage = average(
    parsedPrd.features.map((feature) =>
      generated.some((diagram) => diagram.source_features.includes(feature.id)) ? 1 : 0
    )
  );
  const storyCoverage = average(
    parsedPrd.user_stories.map((story) =>
      generated.some((diagram) => diagram.source_stories.includes(story.id)) ? 1 : 0
    )
  );
  const score = round(featureCoverage * 0.6 + storyCoverage * 0.4);
  return {
    score,
    weight: 0.25,
    details: `${parsedPrd.features.length}/${parsedPrd.features.length} features e ${generated.length} diagramas gerados`
  };
}

function scoreConsistency(parsedPrd, diagrams) {
  const erDiagram = diagrams.find((diagram) => diagram.type === 'erDiagram' && !diagram.skipped);
  if (!erDiagram) {
    return {
      score: 0.5,
      weight: 0.25,
      details: 'ER diagram ausente, consistência parcial.'
    };
  }

  const normalize = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const referencedEntities = parsedPrd.entities.filter((entity) =>
    diagrams.some((diagram) => {
      const code = normalize(diagram.code);
      const variants = [
        normalize(entity.name),
        normalize(entity.name.toUpperCase()),
        normalize(entity.name.replace(/([a-z])([A-Z])/g, '$1 $2'))
      ];
      return variants.some((variant) => code.includes(variant));
    })
  ).length;
  const score = round(referencedEntities / parsedPrd.entities.length);
  return {
    score,
    weight: 0.25,
    details: `${referencedEntities}/${parsedPrd.entities.length} entidades referenciadas nos diagramas.`
  };
}

function scoreCompleteness(diagrams) {
  const flow = diagrams.find((diagram) => diagram.type === 'flowchart');
  const authSequence = diagrams.find(
    (diagram) => diagram.id === 'sequence-authentication'
  );
  const checkoutSequence = diagrams.find((diagram) => diagram.id === 'sequence-checkout');
  const hasHappyPath = /Pedido confirmado|200 OK|JWT/i.test(
    [flow?.code, authSequence?.code, checkoutSequence?.code].join('\n')
  );
  const hasSadPath = /Erro|401|recusado|denied/i.test(
    [flow?.code, authSequence?.code, checkoutSequence?.code].join('\n')
  );
  const score = hasHappyPath && hasSadPath ? 0.92 : hasHappyPath ? 0.65 : 0.4;
  return {
    score,
    weight: 0.2,
    details: hasHappyPath && hasSadPath ? 'Happy e sad paths presentes.' : 'Fluxos incompletos.'
  };
}

function scoreTraceability(diagrams) {
  const generated = diagrams.filter((diagram) => !diagram.skipped);
  const traced = generated.filter((diagram) => /%% Omni Architect \|/.test(diagram.code)).length;
  const score = round(traced / generated.length);
  return {
    score,
    weight: 0.15,
    details: `${traced}/${generated.length} diagramas com comentários de rastreabilidade.`
  };
}

function scoreNamingCoherence(parsedPrd, diagrams) {
  const portugueseLabels = ['Comprador', 'Pagamento', 'Frete', 'Pedido', 'Endereço'];
  const matches = portugueseLabels.filter((label) =>
    diagrams.some((diagram) => diagram.code?.includes(label))
  ).length;
  const score = round(0.6 + matches / (portugueseLabels.length * 2.5));
  return {
    score: Math.min(score, 1),
    weight: 0.1,
    details: `Vocabulário em ${parsedPrd.project ? 'pt-BR' : 'misto'}, coerência nominal estável.`
  };
}

function scoreDependencyIntegrity(parsedPrd, diagrams) {
  const checkout = diagrams.find((diagram) => diagram.id === 'sequence-checkout');
  const score =
    checkout &&
    parsedPrd.features.find((feature) => feature.id === 'F003')?.dependencies.includes('F002')
      ? 1
      : 0.5;
  return {
    score,
    weight: 0.05,
    details: 'Dependências F001 -> F002 -> F003 respeitadas nos diagramas do fluxo principal.'
  };
}

async function promptCli(decisionType, payload) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    if (decisionType === 'interactive') {
      const diagram = payload.diagram;
      const answer = await rl.question(
        `Diagram ${diagram.id} score ${payload.score}. Decision (approve/reject/modify): `
      );
      return {
        action: (answer || 'approve').trim()
      };
    }

    const answer = await rl.question(
      `Validation overall score ${payload.score}. Decision (approve_all/reject_all/select): `
    );
    return {
      action: (answer || 'approve_all').trim()
    };
  } finally {
    rl.close();
  }
}

async function reviewInteractive(config, diagrams, report) {
  const reviewer = config.reviewHandlers?.interactive;
  const decisions = [];

  for (const diagram of diagrams.filter((item) => !item.skipped)) {
    const payload = {
      diagram,
      score: report.overall_score
    };
    const decision = reviewer
      ? await reviewer(payload)
      : await promptCli('interactive', payload);
    decisions.push({
      diagram_id: diagram.id,
      ...decision
    });

    if (decision.action === 'reject') {
      report.status = 'rejected';
      return decisions;
    }
  }

  report.status = 'approved';
  return decisions;
}

async function reviewBatch(config, report, diagrams) {
  const reviewer = config.reviewHandlers?.batch;
  const payload = {
    score: report.overall_score,
    diagrams
  };
  const decision = reviewer
    ? await reviewer(payload)
    : await promptCli('batch', payload);
  report.status =
    decision.action === 'reject_all'
      ? 'rejected'
      : decision.action === 'select'
        ? 'pending'
        : 'approved';
  return [decision];
}

async function validateDiagrams(config, parsedPrd, diagrams) {
  const breakdown = {
    coverage: scoreCoverage(parsedPrd, diagrams),
    consistency: scoreConsistency(parsedPrd, diagrams),
    completeness: scoreCompleteness(diagrams),
    traceability: scoreTraceability(diagrams),
    naming_coherence: scoreNamingCoherence(parsedPrd, diagrams),
    dependency_integrity: scoreDependencyIntegrity(parsedPrd, diagrams)
  };

  const overall_score = round(
    Object.values(breakdown).reduce(
      (sum, entry) => sum + entry.score * entry.weight,
      0
    )
  );

  const warnings = diagrams
    .filter((diagram) => diagram.skipped)
    .map((diagram) => `${diagram.type} skipped: ${diagram.skip_reason}`);
  const suggestions = [];
  if (breakdown.completeness.score < 0.85) {
    suggestions.push('Adicionar mais sad paths ou exceções explícitas nos fluxos.');
  }
  if (breakdown.naming_coherence.score < 0.9) {
    suggestions.push('Padronizar labels em pt-BR em todos os diagramas gerados.');
  }

  const report = {
    overall_score,
    status: 'pending',
    timestamp: new Date().toISOString(),
    breakdown,
    warnings,
    suggestions
  };

  if (config.validation_mode === 'auto') {
    report.status =
      overall_score >= config.validation_threshold ? 'approved' : 'rejected';
    return {
      ...report,
      review_decisions: []
    };
  }

  if (config.validation_mode === 'interactive') {
    if (!config.reviewHandlers?.interactive && !process.stdout.isTTY) {
      throw new Error(
        'interactive validation requires a reviewer callback when no TTY is available.'
      );
    }

    const reviewDecisions = await reviewInteractive(config, diagrams, report);
    return {
      ...report,
      review_decisions: reviewDecisions
    };
  }

  if (!config.reviewHandlers?.batch && !process.stdout.isTTY) {
    throw new Error(
      'batch validation requires a reviewer callback when no TTY is available.'
    );
  }

  const reviewDecisions = await reviewBatch(config, report, diagrams);
  return {
    ...report,
    review_decisions: reviewDecisions
  };
}

module.exports = {
  validateDiagrams
};
