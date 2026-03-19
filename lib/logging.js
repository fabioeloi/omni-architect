const path = require('node:path');
const { redactSecrets, writeJson } = require('./utils');

function createLogger(config) {
  const startedAt = new Date().toISOString();
  const phases = [];
  const warnings = [];
  const hookResults = [];
  const secretValues = [config.figma_access_token];

  function phaseStart(name, details = {}) {
    const phase = {
      name,
      started_at: new Date().toISOString(),
      details: redactSecrets(details, secretValues)
    };
    phases.push(phase);
    return phase;
  }

  function phaseEnd(phase, result = {}) {
    phase.ended_at = new Date().toISOString();
    phase.duration_ms =
      new Date(phase.ended_at).getTime() - new Date(phase.started_at).getTime();
    phase.result = redactSecrets(result, secretValues);
  }

  function warn(message, details = {}) {
    warnings.push({
      message,
      details: redactSecrets(details, secretValues),
      timestamp: new Date().toISOString()
    });
  }

  function recordHook(result) {
    hookResults.push(redactSecrets(result, secretValues));
  }

  async function flush(status, outputDir) {
    const log = redactSecrets(
      {
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        status,
        config: {
          ...config,
          figma_access_token: '[REDACTED]'
        },
        phases,
        warnings,
        hooks: hookResults
      },
      secretValues
    );

    const logPath = path.join(outputDir, 'orchestration-log.json');
    await writeJson(logPath, log);
    return { log, logPath };
  }

  return {
    phaseEnd,
    phaseStart,
    flush,
    recordHook,
    warn
  };
}

module.exports = {
  createLogger
};
