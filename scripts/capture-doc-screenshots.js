const path = require('node:path');
const fs = require('node:fs/promises');
const { runLocalBrowserE2E } = require('./browser-e2e');

async function main() {
  const docsAssetsDir = path.join(process.cwd(), 'docs', 'assets');
  await fs.mkdir(docsAssetsDir, { recursive: true });

  const report = await runLocalBrowserE2E({
    sessionName: 'docs-capture',
    mermaidScreenshotName: 'example-mermaid-preview.png',
    pluginScreenshotName: 'example-plugin-wrapper.png',
    summaryScreenshotName: 'example-summary.png',
    diagramScreenshotDir: path.join(docsAssetsDir, 'diagrams'),
    manifestDir: docsAssetsDir
  });

  for (const fileName of [
    'example-mermaid-preview.png',
    'example-plugin-wrapper.png',
    'example-summary.png'
  ]) {
    await fs.copyFile(
      path.join(report.artifacts_dir, fileName),
      path.join(docsAssetsDir, fileName)
    );
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
