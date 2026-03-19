const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { withBrowserContext } = require('../lib/browser/context');

async function main() {
  const storagePath =
    process.env.FIGMA_E2E_STORAGE_STATE ||
    path.join(process.cwd(), 'playwright', '.auth', 'figma-user.json');
  const targetUrl =
    process.env.FIGMA_E2E_FILE_URL || 'https://www.figma.com/files/';

  await fs.mkdir(path.dirname(storagePath), { recursive: true });

  await withBrowserContext({ name: 'figma-bootstrap', headed: true }, async ({ context }) => {
    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    console.log(`Browser aberto em ${targetUrl}`);
    console.log('Faça login no Figma e garanta acesso ao arquivo/workspace de teste.');

    const rl = readline.createInterface({ input: stdin, output: stdout });
    await rl.question('Pressione Enter quando a sessão estiver autenticada para salvar o storage state. ');
    rl.close();

    await context.storageState({ path: storagePath });
    console.log(`Storage state salvo em ${storagePath}`);
  });
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
