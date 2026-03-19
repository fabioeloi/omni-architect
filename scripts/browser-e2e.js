const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { withBrowserContext, savePageScreenshot } = require('../lib/browser/context');
const {
  OUTPUT_DIR,
  createHarness,
  ensureDir,
  runExamplePipeline,
  runResume,
  writeManifestForResume
} = require('../tests/e2e/support');

async function captureDiagramScreenshots(page, targetDir) {
  await ensureDir(targetDir);
  const cards = page.locator('.diagram-card');
  const count = await cards.count();

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const diagramId = (await card.getAttribute('data-diagram-id')) || `diagram-${index + 1}`;
    await card.screenshot({
      path: path.join(targetDir, `${diagramId}.png`)
    });
  }
}

async function validateMermaidPage(page, harnessUrl, artifactsDir, options = {}) {
  const targetDir = options.diagramScreenshotDir || path.join(artifactsDir, 'diagrams');
  await page.goto(`${harnessUrl}/mermaid`);
  await page.waitForFunction(() => window.__renderState?.complete === true, null, {
    timeout: options.timeout || 120000
  });

  const state = await page.evaluate(() => window.__renderState);
  assert.equal(state.failed, 0, `Mermaid render failures: ${JSON.stringify(state.errors)}`);
  assert.equal(state.rendered, state.total, 'Nem todos os diagramas foram renderizados');
  assert.equal(await page.locator('.diagram-card').count(), state.total);
  assert.equal(await page.locator('svg').count(), state.total);

  await savePageScreenshot(
    page,
    artifactsDir,
    options.screenshotName || 'mermaid-preview.png'
  );
  await captureDiagramScreenshots(page, targetDir);
  return state;
}

async function validatePluginWrapper(page, harnessUrl, artifactsDir, options = {}) {
  await page.goto(`${harnessUrl}/plugin-wrapper`);
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

  const manifest = await page.evaluate(() => window.__lastManifest);
  assert.ok(manifest, 'Manifesto do plugin não foi retornado');
  assert.ok(Array.isArray(manifest.assets), 'Manifesto do plugin não contém assets');
  assert.ok(manifest.assets.length > 0, 'Manifesto do plugin está vazio');

  await savePageScreenshot(
    page,
    artifactsDir,
    options.screenshotName || 'plugin-wrapper.png'
  );
  const manifestPath = await writeManifestForResume(
    manifest,
    options.manifestDir || artifactsDir
  );

  return {
    manifest,
    manifestPath
  };
}

async function validateSummaryPage(page, harnessUrl, artifactsDir, options = {}) {
  await page.goto(`${harnessUrl}/summary`);
  await page.waitForFunction(() => window.__summaryReady === true, null, {
    timeout: 30000
  });

  const summary = await page.evaluate(() => window.__summary);
  assert.ok(summary, 'Resumo da sessão não foi carregado');
  assert.ok(summary.figmaAssetsCount > 0, 'Resumo não encontrou assets do Figma');

  await savePageScreenshot(
    page,
    artifactsDir,
    options.screenshotName || 'summary-after-resume.png'
  );
  return summary;
}

async function runMermaidBrowserE2E(options = {}) {
  await runExamplePipeline();
  const sessionName = options.sessionName || 'local-flow';
  const harness = await createHarness(options.outputDir || OUTPUT_DIR);

  try {
    return await withBrowserContext({ name: sessionName }, async ({ context, artifactsDir }) => {
      const page = await context.newPage();
      const renderState = await validateMermaidPage(page, harness.url, artifactsDir, options);
      const report = {
        status: 'ok',
        session: sessionName,
        harness_url: harness.url,
        output_dir: options.outputDir || OUTPUT_DIR,
        artifacts_dir: artifactsDir,
        render_state: renderState
      };
      await fs.writeFile(
        path.join(artifactsDir, 'mermaid-e2e-report.json'),
        `${JSON.stringify(report, null, 2)}\n`,
        'utf8'
      );
      return report;
    });
  } finally {
    await harness.close();
  }
}

async function runLocalBrowserE2E(options = {}) {
  await runExamplePipeline();
  const sessionName = options.sessionName || 'local-flow';
  const outputDir = options.outputDir || OUTPUT_DIR;
  const harness = await createHarness(outputDir);

  try {
    return await withBrowserContext({ name: sessionName }, async ({ context, artifactsDir }) => {
      const page = await context.newPage();
      const renderState = await validateMermaidPage(page, harness.url, artifactsDir, {
        screenshotName: options.mermaidScreenshotName,
        diagramScreenshotDir: options.diagramScreenshotDir
      });
      const plugin = await validatePluginWrapper(page, harness.url, artifactsDir, {
        screenshotName: options.pluginScreenshotName,
        manifestDir: options.manifestDir || artifactsDir
      });
      await runResume(plugin.manifestPath);
      const summary = await validateSummaryPage(page, harness.url, artifactsDir, {
        screenshotName: options.summaryScreenshotName
      });

      const report = {
        status: 'ok',
        session: sessionName,
        harness_url: harness.url,
        output_dir: outputDir,
        artifacts_dir: artifactsDir,
        render_state: renderState,
        manifest_path: plugin.manifestPath,
        figma_assets_count: summary.figmaAssetsCount
      };

      await fs.writeFile(
        path.join(artifactsDir, 'local-e2e-report.json'),
        `${JSON.stringify(report, null, 2)}\n`,
        'utf8'
      );

      return report;
    });
  } finally {
    await harness.close();
  }
}

module.exports = {
  captureDiagramScreenshots,
  runLocalBrowserE2E,
  runMermaidBrowserE2E,
  validateMermaidPage,
  validatePluginWrapper,
  validateSummaryPage
};
