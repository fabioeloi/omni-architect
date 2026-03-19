const fs = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');
const { DEFAULTS } = require('./defaults');

function collectEnv() {
  return {
    prd_source: process.env.OMNI_ARCHITECT_PRD_SOURCE,
    project_name: process.env.OMNI_ARCHITECT_PROJECT_NAME,
    figma_file_key: process.env.FIGMA_FILE_KEY,
    figma_access_token:
      process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN,
    design_system: process.env.OMNI_ARCHITECT_DESIGN_SYSTEM,
    locale: process.env.OMNI_ARCHITECT_LOCALE,
    validation_mode: process.env.OMNI_ARCHITECT_VALIDATION_MODE,
    validation_threshold: process.env.OMNI_ARCHITECT_VALIDATION_THRESHOLD
      ? Number(process.env.OMNI_ARCHITECT_VALIDATION_THRESHOLD)
      : undefined,
    output_dir: process.env.OMNI_ARCHITECT_OUTPUT_DIR
  };
}

async function loadConfigFile(configPath) {
  const candidates = configPath
    ? [configPath]
    : [
        path.join(process.cwd(), '.omni-architect.yml'),
        path.join(process.cwd(), '.omni-architect.yaml')
      ];

  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      return {
        path: candidate,
        value: YAML.parse(raw) || {}
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }

      throw error;
    }
  }

  return {
    path: null,
    value: {}
  };
}

function normalizeOptionAliases(options = {}) {
  const normalized = { ...options };
  const aliases = {
    prd_source: options.prd_source ?? options.prdSource,
    project_name: options.project_name ?? options.projectName,
    figma_file_key: options.figma_file_key ?? options.figmaFileKey,
    figma_access_token:
      options.figma_access_token ?? options.figmaAccessToken,
    diagram_types: options.diagram_types ?? options.diagramTypes,
    design_system: options.design_system ?? options.designSystem,
    validation_mode: options.validation_mode ?? options.validationMode,
    validation_threshold:
      options.validation_threshold ?? options.validationThreshold,
    output_dir: options.output_dir ?? options.outputDir
  };

  for (const [key, value] of Object.entries(aliases)) {
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function normalizeDiagramTypes(value) {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return undefined;
}

function sanitizeConfig(config) {
  const threshold =
    config.validation_threshold === undefined || config.validation_threshold === null
      ? DEFAULTS.validation_threshold
      : Number(config.validation_threshold);

  return {
    ...config,
    validation_threshold: threshold,
    diagram_types: normalizeDiagramTypes(config.diagram_types) || DEFAULTS.diagram_types
  };
}

function validateConfig(config) {
  const requiredFields = [
    'prd_source',
    'project_name',
    'figma_file_key',
    'figma_access_token'
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required config field: ${field}`);
    }
  }

  if (!['interactive', 'batch', 'auto'].includes(config.validation_mode)) {
    throw new Error(
      `validation_mode must be one of interactive, batch or auto. Received "${config.validation_mode}".`
    );
  }

  if (
    Number.isNaN(config.validation_threshold) ||
    config.validation_threshold < 0 ||
    config.validation_threshold > 1
  ) {
    throw new Error('validation_threshold must be a number between 0 and 1.');
  }

  return config;
}

async function resolveConfig(options = {}) {
  const normalizedOptions = normalizeOptionAliases(options);
  const configFile = await loadConfigFile(normalizedOptions.config);
  const config = validateConfig(
    sanitizeConfig({
      ...DEFAULTS,
      ...configFile.value,
      ...collectEnv(),
      ...normalizedOptions
    })
  );

  return {
    ...config,
    config_file: configFile.path,
    output_dir: path.resolve(process.cwd(), config.output_dir || DEFAULTS.output_dir)
  };
}

module.exports = {
  normalizeOptionAliases,
  resolveConfig
};
