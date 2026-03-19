const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { startHarnessServer } = require('../../lib/browser/harness-server');

const execFileAsync = promisify(execFile);

const OUTPUT_DIR = path.join(process.cwd(), 'output', 'example');
const ARTIFACTS_DIR = path.join(process.cwd(), 'output', 'playwright', 'local-flow');

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function runExamplePipeline() {
  await execFileAsync('node', [path.join(process.cwd(), 'examples', 'run-example.js')], {
    cwd: process.cwd()
  });
}

async function runResume(figmaResultPath) {
  await execFileAsync(
    'node',
    [
      path.join(process.cwd(), 'bin', 'omni-architect.js'),
      'resume',
      '--session_dir',
      OUTPUT_DIR,
      '--figma_result',
      figmaResultPath,
      '--prd_source',
      path.join(process.cwd(), 'examples', 'prd-ecommerce.md'),
      '--project_name',
      'E-Commerce Platform',
      '--figma_file_key',
      'abc123XYZ',
      '--figma_access_token',
      'example-token'
    ],
    { cwd: process.cwd() }
  );
}

async function createHarness(outputDir = OUTPUT_DIR) {
  return startHarnessServer({ outputDir });
}

async function writeManifestForResume(manifest, targetDir = ARTIFACTS_DIR) {
  await ensureDir(targetDir);
  const manifestPath = path.join(targetDir, 'figma-import-result.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

module.exports = {
  ARTIFACTS_DIR,
  OUTPUT_DIR,
  createHarness,
  ensureDir,
  runExamplePipeline,
  runResume,
  writeManifestForResume
};
