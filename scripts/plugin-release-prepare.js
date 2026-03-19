const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

async function hashFile(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main() {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  const manifestPath = path.join(process.cwd(), 'figma-plugin', 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const required = ['name', 'id', 'api', 'main', 'ui'];
  const missing = required.filter((key) => !manifest[key]);

  if (missing.length) {
    throw new Error(`Plugin manifest missing required fields: ${missing.join(', ')}`);
  }

  const releaseDir = path.join(
    process.cwd(),
    'output',
    'plugin-release',
    packageJson.version
  );
  const pluginDir = path.join(releaseDir, 'figma-plugin');
  await fs.mkdir(pluginDir, { recursive: true });

  for (const file of ['manifest.json', 'code.js', 'ui.html']) {
    await fs.copyFile(
      path.join(process.cwd(), 'figma-plugin', file),
      path.join(pluginDir, file)
    );
  }

  const checksums = {};
  for (const file of ['manifest.json', 'code.js', 'ui.html']) {
    checksums[file] = await hashFile(path.join(pluginDir, file));
  }

  await fs.writeFile(
    path.join(releaseDir, 'checksums.json'),
    `${JSON.stringify(checksums, null, 2)}\n`,
    'utf8'
  );

  const checklist = [
    `# Plugin Publish Checklist v${packageJson.version}`,
    '',
    '## Pré-requisitos',
    '- Plugin publicado ou instalável no workspace Figma de teste',
    '- Figma Desktop disponível para o fluxo oficial de publish/review',
    '- Manifest com id estável e arquivos sincronizados do diretório figma-plugin/',
    '',
    '## Artefatos preparados',
    '- figma-plugin/manifest.json',
    '- figma-plugin/code.js',
    '- figma-plugin/ui.html',
    '- checksums.json',
    '',
    '## Passos manuais validados',
    '1. Abrir o Figma Desktop com a conta proprietária do plugin.',
    '2. Revisar versão e manifest do bundle preparado.',
    '3. Publicar/atualizar o plugin ou garantir a instalação no workspace de teste.',
    '4. Confirmar que o nome do plugin corresponde ao valor usado em FIGMA_E2E_PLUGIN_NAME.',
    '5. Executar npm run e2e:figma em ambiente local autenticado.'
  ].join('\n');

  await fs.writeFile(path.join(releaseDir, 'PUBLISH-CHECKLIST.md'), `${checklist}\n`, 'utf8');
  console.log(`Plugin release preparado em ${releaseDir}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
