const { runPipeline, resumePipeline } = require('./lib/orchestrator');

async function run(options = {}) {
  return runPipeline(options);
}

async function resumeFigma(options = {}) {
  return resumePipeline(options);
}

module.exports = {
  run,
  resumeFigma
};
