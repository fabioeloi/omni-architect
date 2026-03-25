const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveConfig } = require('../lib/config');

test('config - accepts figma_service_token in REST API mode', async () => {
  const config = await resolveConfig({
    prd_source: './test.md',
    project_name: 'Test',
    figma_file_key: 'abc123',
    figma_service_token: 'fst-test-token',
    figma_integration_mode: 'rest_api',
    validation_mode: 'auto'
  });

  assert.equal(config.figma_service_token, 'fst-test-token');
  assert.equal(config.figma_integration_mode, 'rest_api');
});

test('config - accepts figma_access_token in plugin mode', async () => {
  const config = await resolveConfig({
    prd_source: './test.md',
    project_name: 'Test',
    figma_file_key: 'abc123',
    figma_access_token: 'fptk-test-token',
    figma_integration_mode: 'plugin',
    validation_mode: 'auto'
  });

  assert.equal(config.figma_access_token, 'fptk-test-token');
  assert.equal(config.figma_integration_mode, 'plugin');
});

test('config - auto mode defaults when both tokens present', async () => {
  const config = await resolveConfig({
    prd_source: './test.md',
    project_name: 'Test',
    figma_file_key: 'abc123',
    figma_service_token: 'fst-test',
    figma_access_token: 'fptk-test',
    validation_mode: 'auto'
  });

  assert.equal(config.figma_integration_mode, 'auto');
  assert.equal(config.figma_service_token, 'fst-test');
  assert.equal(config.figma_access_token, 'fptk-test');
});

test('config - throws error when rest_api mode without service token', async () => {
  await assert.rejects(
    async () =>
      await resolveConfig({
        prd_source: './test.md',
        project_name: 'Test',
        figma_file_key: 'abc123',
        figma_access_token: 'fptk-test',
        figma_integration_mode: 'rest_api'
      }),
    /figma_service_token is required when figma_integration_mode is "rest_api"/
  );
});

test('config - throws error when plugin mode without access token', async () => {
  await assert.rejects(
    async () =>
      await resolveConfig({
        prd_source: './test.md',
        project_name: 'Test',
        figma_file_key: 'abc123',
        figma_service_token: 'fst-test',
        figma_integration_mode: 'plugin'
      }),
    /figma_access_token is required when figma_integration_mode is "plugin"/
  );
});

test('config - throws error when auto mode without any token', async () => {
  await assert.rejects(
    async () =>
      await resolveConfig({
        prd_source: './test.md',
        project_name: 'Test',
        figma_file_key: 'abc123',
        figma_integration_mode: 'auto'
      }),
    /Either figma_service_token or figma_access_token is required/
  );
});

test('config - throws error with invalid integration mode', async () => {
  await assert.rejects(
    async () =>
      await resolveConfig({
        prd_source: './test.md',
        project_name: 'Test',
        figma_file_key: 'abc123',
        figma_access_token: 'fptk-test',
        figma_integration_mode: 'invalid_mode'
      }),
    /figma_integration_mode must be one of auto, rest_api or plugin/
  );
});

test('config - supports camelCase aliases for new fields', async () => {
  const config = await resolveConfig({
    prdSource: './test.md',
    projectName: 'Test',
    figmaFileKey: 'abc123',
    figmaServiceToken: 'fst-test',
    figmaIntegrationMode: 'rest_api',
    validationMode: 'auto'
  });

  assert.equal(config.figma_service_token, 'fst-test');
  assert.equal(config.figma_integration_mode, 'rest_api');
});

test('config - reads FIGMA_SERVICE_TOKEN from environment', async () => {
  process.env.FIGMA_SERVICE_TOKEN = 'fst-env-token';

  const config = await resolveConfig({
    prd_source: './test.md',
    project_name: 'Test',
    figma_file_key: 'abc123',
    figma_integration_mode: 'rest_api',
    validation_mode: 'auto'
  });

  assert.equal(config.figma_service_token, 'fst-env-token');

  delete process.env.FIGMA_SERVICE_TOKEN;
});

test('config - reads FIGMA_INTEGRATION_MODE from environment', async () => {
  process.env.FIGMA_INTEGRATION_MODE = 'plugin';
  process.env.FIGMA_ACCESS_TOKEN = 'fptk-test';

  const config = await resolveConfig({
    prd_source: './test.md',
    project_name: 'Test',
    figma_file_key: 'abc123',
    validation_mode: 'auto'
  });

  assert.equal(config.figma_integration_mode, 'plugin');

  delete process.env.FIGMA_INTEGRATION_MODE;
  delete process.env.FIGMA_ACCESS_TOKEN;
});

test('config - backwards compatible with figma_access_token only', async () => {
  const config = await resolveConfig({
    prd_source: './test.md',
    project_name: 'Test',
    figma_file_key: 'abc123',
    figma_access_token: 'fptk-test',
    validation_mode: 'auto'
  });

  // Should work in auto mode with just access token
  assert.equal(config.figma_access_token, 'fptk-test');
  assert.equal(config.figma_integration_mode, 'auto');
});
