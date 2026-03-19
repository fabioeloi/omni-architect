const path = require('node:path');

module.exports = {
  testDir: path.join(__dirname, 'tests', 'e2e'),
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join('output', 'playwright', 'report'), open: 'never' }]
  ],
  outputDir: path.join('output', 'playwright', 'test-results'),
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 960 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    acceptDownloads: true
  }
};
