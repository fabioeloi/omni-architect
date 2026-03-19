const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  ARTIFACTS_DIR,
  OUTPUT_DIR,
  createHarness,
  ensureDir,
  runExamplePipeline,
  runResume,
  writeManifestForResume
} = require('./support');

test.describe('local plugin flow', () => {
  let harness;

  test.beforeAll(async () => {
    await runExamplePipeline();
    harness = await createHarness();
    await ensureDir(ARTIFACTS_DIR);
  });

  test.afterAll(async () => {
    await harness?.close();
  });

  test('importa payload no wrapper do plugin e fecha o resume', async ({ page }) => {
    await page.goto(`${harness.url}/plugin-wrapper`);
    await page.waitForFunction(() => window.__wrapperState?.frameReady === true, null, {
      timeout: 30000
    });
    await page.getByRole('button', { name: 'Carregar payload do exemplo' }).click();
    await page.waitForFunction(() => window.__wrapperState?.payloadLoaded === true, null, {
      timeout: 30000
    });

    const pluginFrame = page.frameLocator('#pluginFrame');
    await pluginFrame.locator('#importButton').click();
    await page.waitForFunction(() => window.__wrapperState?.importComplete === true, null, {
      timeout: 30000
    });
    await expect(page.locator('#manifestOutput')).toContainText('"assets"');

    const manifest = await page.evaluate(() => window.__lastManifest);
    expect(manifest.assets.length).toBeGreaterThan(0);
    const manifestPath = await writeManifestForResume(manifest);
    await runResume(manifestPath);

    await expect.poll(async () => {
      const raw = await fs.readFile(path.join(OUTPUT_DIR, 'figma-assets.json'), 'utf8');
      return JSON.parse(raw).length;
    }).toBeGreaterThan(0);

    await page.goto(`${harness.url}/summary`);
    await page.waitForFunction(() => window.__summaryReady === true, null, {
      timeout: 30000
    });
    await expect(page.locator('body')).toContainText('Figma Assets');
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'summary-after-resume.png'),
      fullPage: true
    });
  });
});
