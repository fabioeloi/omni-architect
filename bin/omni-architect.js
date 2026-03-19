#!/usr/bin/env node

const { parseArgs } = require('node:util');
const { run, resumeFigma } = require('../index');

function parseList(value) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizeArgs(tokens) {
  const options = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (value === undefined) {
      continue;
    }

    if (key === 'diagram_types') {
      options[key] = parseList(value);
      continue;
    }

    if (key === 'validation_threshold') {
      options[key] = Number(value);
      continue;
    }

    options[key] = value;
  }

  return options;
}

function formatResult(result) {
  return JSON.stringify(
    {
      status: result.status,
      output_dir: result.output_dir,
      validation_status: result.validation_report?.status,
      validation_score: result.validation_report?.overall_score,
      output_paths: result.output_paths,
      figma_assets: result.figma_assets?.length || 0
    },
    null,
    2
  );
}

async function main() {
  const [, , command = 'run', ...rest] = process.argv;
  const { values } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      prd_source: { type: 'string' },
      project_name: { type: 'string' },
      figma_file_key: { type: 'string' },
      figma_access_token: { type: 'string' },
      diagram_types: { type: 'string' },
      design_system: { type: 'string' },
      validation_mode: { type: 'string' },
      validation_threshold: { type: 'string' },
      locale: { type: 'string' },
      config: { type: 'string' },
      output_dir: { type: 'string' },
      session_dir: { type: 'string' },
      figma_result: { type: 'string' }
    }
  });

  if (command === 'run') {
    const result = await run(normalizeArgs(values));
    console.log(formatResult(result));
    return;
  }

  if (command === 'resume') {
    const result = await resumeFigma(normalizeArgs(values));
    console.log(formatResult(result));
    return;
  }

  throw new Error(`Unknown command "${command}". Use "run" or "resume".`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
