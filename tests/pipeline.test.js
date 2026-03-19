const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { run } = require('../index');

async function createTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'omni-architect-'));
}

test('run creates pending delivery package with validated diagrams', async () => {
  const outputDir = await createTempDir();
  const result = await run({
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

  assert.equal(result.status, 'awaiting_figma_import');
  assert.equal(result.validation_report.status, 'approved');

  const diagramTypes = result.diagrams.map((diagram) => diagram.type);
  assert.ok(diagramTypes.includes('flowchart'));
  assert.ok(diagramTypes.includes('sequence'));
  assert.ok(diagramTypes.includes('erDiagram'));
  assert.ok(diagramTypes.includes('journey'));
  assert.ok(diagramTypes.includes('C4Context'));
  assert.ok(
    result.diagrams.find((diagram) => diagram.type === 'stateDiagram' && diagram.skipped)
  );

  await Promise.all([
    fs.access(path.join(outputDir, 'parsed-prd.json')),
    fs.access(path.join(outputDir, 'validation-report.json')),
    fs.access(path.join(outputDir, 'figma', 'figma-payload.json')),
    fs.access(path.join(outputDir, 'diagrams', 'flowchart-checkout.mmd'))
  ]);
});
