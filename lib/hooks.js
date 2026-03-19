const { exec } = require('node:child_process');

function runHookCommand(command, env) {
  return new Promise((resolve) => {
    exec(command, { env: { ...process.env, ...env } }, (error, stdout, stderr) => {
      resolve({
        command,
        ok: !error,
        code: error ? error.code || 1 : 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

async function runHook(name, command, context, logger) {
  if (!command) {
    return null;
  }

  const result = await runHookCommand(command, {
    OMNI_ARCHITECT_EVENT: name,
    OMNI_ARCHITECT_STATUS: context.status || '',
    OMNI_ARCHITECT_OUTPUT_DIR: context.output_dir || '',
    OMNI_ARCHITECT_PROJECT_NAME: context.project_name || ''
  });

  logger.recordHook({
    event: name,
    ...result
  });

  if (!result.ok) {
    logger.warn(`Hook "${name}" failed.`, { command, stderr: result.stderr });
  }

  return result;
}

module.exports = {
  runHook
};
