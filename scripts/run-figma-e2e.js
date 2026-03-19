const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { withBrowserContext } = require('../lib/browser/context');
const { runExamplePipeline } = require('../tests/e2e/support');

const required = [
  'FIGMA_E2E_FILE_URL',
  'FIGMA_E2E_PLUGIN_NAME',
  'FIGMA_E2E_STORAGE_STATE'
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(
    `Missing required env vars for real Figma smoke: ${missing.join(', ')}`
  );
  process.exit(1);
}

async function main() {
  await runExamplePipeline();
  const payload = await fs.readFile(
    path.join(process.cwd(), 'output', 'example', 'figma', 'figma-payload.json'),
    'utf8'
  );

  await withBrowserContext(
    {
      name: 'figma-real',
      storageState: process.env.FIGMA_E2E_STORAGE_STATE
    },
    async ({ context, artifactsDir }) => {
      const page = await context.newPage();
      await page.goto(process.env.FIGMA_E2E_FILE_URL, {
        waitUntil: 'domcontentloaded'
      });
      await page.screenshot({
        path: path.join(artifactsDir, 'figma-real-open.png'),
        fullPage: true
      });

      const shortcut = process.platform === 'darwin' ? 'Meta+/' : 'Control+/';
      await page.keyboard.press(shortcut);
      const searchInput = page.getByRole('textbox').first();
      await searchInput.fill(process.env.FIGMA_E2E_PLUGIN_NAME);
      await page.getByText(process.env.FIGMA_E2E_PLUGIN_NAME, { exact: false }).first().click();

      await page.getByText('Omni Architect Importer').waitFor({ timeout: 30000 });
      await page.locator('#payload').fill(payload);
      await page.locator('#importButton').click();
      await page.locator('#output').waitFor({ timeout: 30000 });
      const pluginOutput = await page.locator('#output').textContent();
      assert.match(pluginOutput || '', /"assets"/, 'Plugin não retornou assets no Figma real');

      await page.screenshot({
        path: path.join(artifactsDir, 'figma-real-plugin.png'),
        fullPage: true
      });

      console.log(
        JSON.stringify(
          {
            status: 'ok',
            artifacts_dir: artifactsDir,
            figma_file_url: process.env.FIGMA_E2E_FILE_URL
          },
          null,
          2
        )
      );
    }
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
