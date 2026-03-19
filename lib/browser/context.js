const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

function resolveArtifactsDir(name) {
  return path.join(process.cwd(), 'output', 'playwright', name);
}

async function ensureBrowserArtifacts(name) {
  const artifactsDir = resolveArtifactsDir(name);
  await fs.mkdir(path.join(artifactsDir, 'downloads'), { recursive: true });
  return artifactsDir;
}

async function createBrowserSession(options = {}) {
  const name = options.name || 'default';
  const artifactsDir = await ensureBrowserArtifacts(name);
  const launchTimeout =
    options.launchTimeout ||
    Number(process.env.OMNI_ARCHITECT_BROWSER_TIMEOUT_MS) ||
    20000;
  const browser = await chromium.launch({
    headless: options.headed ? false : true,
    channel: options.channel || process.env.OMNI_ARCHITECT_BROWSER_CHANNEL,
    executablePath:
      options.executablePath || process.env.OMNI_ARCHITECT_BROWSER_EXECUTABLE_PATH,
    timeout: launchTimeout
  });
  const context = await browser.newContext({
    storageState: options.storageState,
    acceptDownloads: true,
    viewport: { width: 1440, height: 960 }
  });

  await context.tracing.start({
    screenshots: true,
    snapshots: true
  });

  async function close() {
    await context
      .tracing
      .stop({ path: path.join(artifactsDir, 'trace.zip') })
      .catch(() => {});
    await context.close();
    await browser.close();
  }

  return {
    browser,
    context,
    artifactsDir,
    close
  };
}

async function withBrowserContext(options, callback) {
  const session = await createBrowserSession(options);
  try {
    return await callback(session);
  } finally {
    await session.close();
  }
}

async function savePageScreenshot(page, artifactsDir, filename) {
  const target = path.join(artifactsDir, filename);
  await page.screenshot({
    path: target,
    fullPage: true
  });
  return target;
}

module.exports = {
  createBrowserSession,
  ensureBrowserArtifacts,
  resolveArtifactsDir,
  savePageScreenshot,
  withBrowserContext
};
