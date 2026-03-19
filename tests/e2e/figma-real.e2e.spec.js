const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { runExamplePipeline } = require('./support');

const FILE_URL = process.env.FIGMA_E2E_FILE_URL;
const PLUGIN_NAME = process.env.FIGMA_E2E_PLUGIN_NAME;
const STORAGE_STATE = process.env.FIGMA_E2E_STORAGE_STATE;

test.use({
  storageState: STORAGE_STATE
});

test.describe('figma web smoke', () => {
  test('abre o arquivo, dispara o plugin publicado e importa o payload', async ({ page }) => {
    await runExamplePipeline();
    const payload = await fs.readFile(
      path.join(process.cwd(), 'output', 'example', 'figma', 'figma-payload.json'),
      'utf8'
    );

    await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
    await page.screenshot({
      path: path.join(process.cwd(), 'output', 'playwright', 'figma-real-open.png'),
      fullPage: true
    });

    const shortcut = process.platform === 'darwin' ? 'Meta+/' : 'Control+/';
    await page.keyboard.press(shortcut);
    const searchInput = page.getByRole('textbox').first();
    await searchInput.fill(PLUGIN_NAME);
    await page.getByText(PLUGIN_NAME, { exact: false }).first().click();

    await expect(page.getByText('Omni Architect Importer')).toBeVisible({ timeout: 30000 });
    await page.locator('#payload').fill(payload);
    await page.locator('#importButton').click();
    await expect(page.locator('#output')).toContainText('"assets"', { timeout: 30000 });

    await page.screenshot({
      path: path.join(process.cwd(), 'output', 'playwright', 'figma-real-plugin.png'),
      fullPage: true
    });
  });
});
