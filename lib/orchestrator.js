const fs = require('node:fs/promises');
const path = require('node:path');
const { normalizeOptionAliases, resolveConfig } = require('./config');
const { runHook } = require('./hooks');
const { createLogger } = require('./logging');
const { parsePrd } = require('./phases/parse-prd');
const { generateDiagrams } = require('./phases/generate-diagrams');
const { validateDiagrams } = require('./phases/validate-diagrams');
const { prepareFigmaPayload } = require('./phases/prepare-figma');
const {
  createPendingDelivery,
  finalizeDelivery,
  persistCoreArtifacts
} = require('./phases/deliver-assets');
const { ensureDir, writeJson } = require('./utils');

async function runPipeline(options = {}) {
  const normalizedOptions = normalizeOptionAliases(options);
  const config = await resolveConfig(normalizedOptions);
  await ensureDir(config.output_dir);
  const logger = createLogger(config);

  try {
    const parsePhase = logger.phaseStart('parse_prd');
    const parsedPrd = await parsePrd(config, logger);
    logger.phaseEnd(parsePhase, {
      project: parsedPrd.project,
      features: parsedPrd.features.length
    });

    const generatePhase = logger.phaseStart('generate_diagrams');
    const diagrams = await generateDiagrams(config, parsedPrd, logger);
    logger.phaseEnd(generatePhase, {
      diagrams: diagrams.map((diagram) => ({
        id: diagram.id,
        type: diagram.type,
        skipped: diagram.skipped || false
      }))
    });

    const validationPhase = logger.phaseStart('validate_diagrams');
    const validationReport = await validateDiagrams(config, parsedPrd, diagrams);
    logger.phaseEnd(validationPhase, validationReport);

    await persistCoreArtifacts(config, parsedPrd, validationReport);

    if (validationReport.status === 'approved') {
      await runHook(
        'on_validation_approved',
        config.hooks?.on_validation_approved,
        {
          output_dir: config.output_dir,
          project_name: config.project_name,
          status: validationReport.status
        },
        logger
      );
    }

    const figmaPhase = logger.phaseStart('prepare_figma');
    const { payload, payloadPath } = await prepareFigmaPayload(
      config,
      parsedPrd,
      diagrams,
      validationReport
    );
    logger.phaseEnd(figmaPhase, {
      payload_path: payloadPath,
      pages: payload.pages.length
    });

    const loggerResult = await logger.flush('awaiting_figma_import', config.output_dir);
    const delivery = await createPendingDelivery(
      config,
      parsedPrd,
      diagrams,
      validationReport,
      loggerResult
    );

    await writeJson(path.join(config.output_dir, 'session-state.json'), {
      config: {
        ...config,
        figma_access_token: '[REDACTED]'
      },
      parsed_prd: parsedPrd,
      diagrams,
      validation_report: validationReport,
      status: delivery.status
    });

    return {
      status: delivery.status,
      output_dir: config.output_dir,
      parsed_prd: parsedPrd,
      diagrams,
      validation_report: validationReport,
      figma_assets: delivery.figma_assets,
      output_paths: delivery.output_paths
    };
  } catch (error) {
    logger.warn('Pipeline failed.', { error: error.message });
    await runHook(
      'on_error',
      config.hooks?.on_error,
      {
        output_dir: config.output_dir,
        project_name: config.project_name,
        status: 'error'
      },
      logger
    );
    await logger.flush('error', config.output_dir);
    throw error;
  }
}

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function resumePipeline(options = {}) {
  const normalizedOptions = normalizeOptionAliases(options);
  const sessionDir = path.resolve(
    process.cwd(),
    normalizedOptions.session_dir ||
      normalizedOptions.sessionDir ||
      normalizedOptions.output_dir ||
      normalizedOptions.outputDir ||
      'output'
  );
  const sessionState = await loadJson(path.join(sessionDir, 'session-state.json'));
  const config = await resolveConfig({
    ...sessionState.config,
    ...normalizedOptions,
    output_dir: sessionDir
  });
  const figmaResultPath = path.resolve(
    process.cwd(),
    normalizedOptions.figma_result ||
      normalizedOptions.figmaResultPath ||
      ''
  );
  if (!normalizedOptions.figma_result && !normalizedOptions.figmaResultPath) {
    throw new Error('Missing figma_result for resume command.');
  }

  const figmaManifest = await loadJson(figmaResultPath);
  await writeJson(path.join(sessionDir, 'figma-import-result.json'), figmaManifest);

  const logger = createLogger(config);
  const loggerResult = await logger.flush('completed', sessionDir);
  const delivery = await finalizeDelivery(
    config,
    sessionState.parsed_prd,
    sessionState.diagrams,
    sessionState.validation_report,
    figmaManifest,
    loggerResult
  );

  await runHook(
    'on_figma_complete',
    config.hooks?.on_figma_complete,
    {
      output_dir: config.output_dir,
      project_name: config.project_name,
      status: 'completed'
    },
    logger
  );

  return {
    status: delivery.status,
    output_dir: config.output_dir,
    parsed_prd: sessionState.parsed_prd,
    diagrams: sessionState.diagrams,
    validation_report: sessionState.validation_report,
    figma_assets: delivery.figma_assets,
    output_paths: delivery.output_paths
  };
}

module.exports = {
  resumePipeline,
  runPipeline
};
