const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { createFakeFigma } = require('./helpers/fake-figma');

async function loadPlugin(figmaApi) {
  const code = await fs.readFile(
    path.join(process.cwd(), 'figma-plugin', 'code.js'),
    'utf8'
  );
  const sandbox = {
    console,
    figma: figmaApi,
    __html__: '<html></html>',
    globalThis: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.globalThis.__OMNI_ARCHITECT_PLUGIN__;
}

test('plugin imports payload and keeps reruns managed', async () => {
  const figmaApi = createFakeFigma();
  const plugin = await loadPlugin(figmaApi);
  const payload = JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), 'output', 'example', 'figma', 'figma-payload.json'),
      'utf8'
    ).catch(() =>
      fs.readFile(
        path.join(process.cwd(), 'tests', 'fixtures', 'sample-figma-payload.json'),
        'utf8'
      )
    )
  );

  const first = await plugin.applyPayload(figmaApi, payload);
  const second = await plugin.applyPayload(figmaApi, payload);

  assert.ok(first.assets.length > 0);
  assert.equal(first.assets.length, second.assets.length);
  const pages = figmaApi.root.children.filter((node) => node.type === 'PAGE');
  assert.ok(
    pages.some((page) => page.name.includes('User Flows')),
    'expected managed pages to be created'
  );
});
