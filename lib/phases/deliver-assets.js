const path = require('node:path');
const { redactSecrets, writeJson, writeText } = require('../utils');

function buildHandoff(config, parsedPrd, diagrams, validationReport, figmaAssets) {
  const featureList = parsedPrd.features.map((feature) => `- ${feature.id}: ${feature.name}`).join('\n');
  const diagramList = diagrams
    .filter((diagram) => !diagram.skipped)
    .map((diagram) => `- ${diagram.type}: ${diagram.name}`)
    .join('\n');
  const assetList = figmaAssets.length
    ? figmaAssets.map((asset) => `- ${asset.page}: ${asset.name} (${asset.node_id})`).join('\n')
    : '- Figma import pendente';

  return [
    `# Handoff - ${config.project_name}`,
    '',
    `## Status`,
    `- Validation: ${validationReport.status} (${validationReport.overall_score})`,
    `- Figma assets: ${figmaAssets.length}`,
    '',
    '## Features',
    featureList,
    '',
    '## Diagrams',
    diagramList,
    '',
    '## Figma Assets',
    assetList
  ].join('\n');
}

async function createPendingDelivery(
  config,
  parsedPrd,
  diagrams,
  validationReport,
  loggerResult
) {
  const session = {
    project_name: config.project_name,
    output_dir: config.output_dir,
    parsed_prd_path: path.join(config.output_dir, 'parsed-prd.json'),
    validation_report_path: path.join(config.output_dir, 'validation-report.json'),
    figma_payload_path: path.join(config.output_dir, 'figma', 'figma-payload.json'),
    status: 'awaiting_figma_import'
  };

  await writeJson(path.join(config.output_dir, 'session.json'), session);
  const handoff = buildHandoff(config, parsedPrd, diagrams, validationReport, []);
  await writeText(path.join(config.output_dir, 'HANDOFF.md'), `${handoff}\n`);

  return {
    status: 'awaiting_figma_import',
    figma_assets: [],
    output_paths: {
      parsed_prd: session.parsed_prd_path,
      validation_report: session.validation_report_path,
      figma_payload: session.figma_payload_path,
      orchestration_log: loggerResult.logPath,
      handoff: path.join(config.output_dir, 'HANDOFF.md'),
      session: path.join(config.output_dir, 'session.json')
    }
  };
}

async function finalizeDelivery(
  config,
  parsedPrd,
  diagrams,
  validationReport,
  figmaManifest,
  loggerResult
) {
  const figmaAssets = figmaManifest.assets || [];
  await writeJson(path.join(config.output_dir, 'figma-assets.json'), figmaAssets);
  await writeText(
    path.join(config.output_dir, 'HANDOFF.md'),
    `${buildHandoff(config, parsedPrd, diagrams, validationReport, figmaAssets)}\n`
  );

  return {
    status: 'completed',
    figma_assets: figmaAssets,
    output_paths: {
      parsed_prd: path.join(config.output_dir, 'parsed-prd.json'),
      validation_report: path.join(config.output_dir, 'validation-report.json'),
      figma_payload: path.join(config.output_dir, 'figma', 'figma-payload.json'),
      figma_assets: path.join(config.output_dir, 'figma-assets.json'),
      orchestration_log: loggerResult.logPath,
      handoff: path.join(config.output_dir, 'HANDOFF.md'),
      figma_result: path.join(config.output_dir, 'figma-import-result.json')
    }
  };
}

async function persistCoreArtifacts(config, parsedPrd, validationReport) {
  await writeJson(
    path.join(config.output_dir, 'parsed-prd.json'),
    redactSecrets(parsedPrd, [config.figma_access_token])
  );
  await writeJson(
    path.join(config.output_dir, 'validation-report.json'),
    validationReport
  );
}

module.exports = {
  createPendingDelivery,
  finalizeDelivery,
  persistCoreArtifacts
};
