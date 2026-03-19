const path = require('node:path');
const { startHarnessServer } = require('../lib/browser/harness-server');

async function main() {
  const outputDir = path.resolve(
    process.cwd(),
    process.env.OMNI_ARCHITECT_OUTPUT_DIR || path.join('output', 'example')
  );
  const port = process.env.OMNI_ARCHITECT_HARNESS_PORT
    ? Number(process.env.OMNI_ARCHITECT_HARNESS_PORT)
    : 4173;
  const harness = await startHarnessServer({ outputDir, port });

  console.log(`Harness disponível em ${harness.url}`);
  console.log(`Output monitorado: ${outputDir}`);
  console.log('Pressione Ctrl+C para encerrar.');

  process.on('SIGINT', async () => {
    await harness.close().catch(() => {});
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await harness.close().catch(() => {});
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
