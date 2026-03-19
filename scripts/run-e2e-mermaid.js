const { runMermaidBrowserE2E } = require('./browser-e2e');

runMermaidBrowserE2E()
  .then((report) => {
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
