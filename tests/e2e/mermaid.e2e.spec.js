const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  ARTIFACTS_DIR,
  createHarness,
  ensureDir,
  runExamplePipeline
} = require('./support');

test.describe('mermaid browser preview', () => {
  let harness;

  test.beforeAll(async () => {
    await runExamplePipeline();
    harness = await createHarness();
    await ensureDir(ARTIFACTS_DIR);
  });

  test.afterAll(async () => {
    await harness?.close();
  });

  test('renderiza todos os diagramas no browser', async ({ page }) => {
    await page.goto(`${harness.url}/mermaid`);
    await page.waitForFunction(() => window.__renderState?.complete === true, null, {
      timeout: 60000
    });
    await expect.poll(async () => {
      const state = await page.evaluate(() => window.__renderState);
      return `${state.rendered}:${state.failed}`;
    }).toBe('6:0');
    await expect(page.locator('.diagram-card')).toHaveCount(6);
    await expect(page.locator('svg')).toHaveCount(6);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'mermaid-preview.png'),
      fullPage: true
    });
  });
});
