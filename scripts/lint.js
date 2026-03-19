const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

const TARGETS = [
  'bin',
  'lib',
  'scripts',
  'tests',
  'examples/run-example.js',
  'figma-plugin/code.js',
  'playwright.config.js',
  'index.js'
];

async function collectFiles(target) {
  const resolved = path.join(process.cwd(), target);
  const stat = await fs.stat(resolved);
  if (stat.isFile()) {
    return resolved.endsWith('.js') ? [resolved] : [];
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      collectFiles(path.join(target, entry.name)).catch(() => [])
    )
  );
  return nested.flat();
}

async function main() {
  const files = (
    await Promise.all(TARGETS.map((target) => collectFiles(target)))
  )
    .flat()
    .filter((file, index, array) => array.indexOf(file) === index);

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const sanitized = source.replace(/^#!.*\n/, '');
    new vm.Script(sanitized, { filename: file });
  }

  console.log(`Lint ok (${files.length} files checked).`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
