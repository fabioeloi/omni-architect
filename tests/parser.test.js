const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { parsePrd } = require('../lib/phases/parse-prd');

function createLogger() {
  return {
    warn() {}
  };
}

test('parsePrd extracts core ecommerce structures', async () => {
  const parsed = await parsePrd(
    {
      prd_source: path.join(process.cwd(), 'examples', 'prd-ecommerce.md')
    },
    createLogger()
  );

  assert.equal(parsed.project, 'E-Commerce Platform v2');
  assert.equal(parsed.features.length, 3);
  assert.deepEqual(
    parsed.features.find((feature) => feature.id === 'F003').dependencies,
    ['F001', 'F002']
  );
  assert.equal(parsed.entities.length, 7);
  assert.equal(parsed.flows[0].steps.length, 6);
  assert.ok(parsed.completeness_score >= 0.8);
});
