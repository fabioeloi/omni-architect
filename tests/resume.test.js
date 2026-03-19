const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { run, resumeFigma } = require('../index');

async function createTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'omni-architect-resume-'));
}

test('resumeFigma finalizes the package with figma assets', async () => {
  const outputDir = await createTempDir();
  await run({
    prd_source: path.join(process.cwd(), 'examples', 'prd-ecommerce.md'),
    project_name: 'E-Commerce Platform',
    figma_file_key: 'abc123XYZ',
    figma_access_token: 'test-token',
    validation_mode: 'auto',
    diagram_types: [
      'flowchart',
      'sequence',
      'erDiagram',
      'stateDiagram',
      'C4Context',
      'journey'
    ],
    output_dir: outputDir
  });

  const result = await resumeFigma({
    session_dir: outputDir,
    figma_result: path.join(
      process.cwd(),
      'tests',
      'fixtures',
      'figma-import-result.json'
    ),
    prd_source: path.join(process.cwd(), 'examples', 'prd-ecommerce.md'),
    project_name: 'E-Commerce Platform',
    figma_file_key: 'abc123XYZ',
    figma_access_token: 'test-token'
  });

  assert.equal(result.status, 'completed');
  assert.equal(result.figma_assets.length, 1);
  await Promise.all([
    fs.access(path.join(outputDir, 'figma-assets.json')),
    fs.access(path.join(outputDir, 'HANDOFF.md'))
  ]);
});
