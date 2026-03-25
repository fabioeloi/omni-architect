const test = require('node:test');
const assert = require('node:assert/strict');
const FigmaAgentClient = require('../lib/figma-client');

// Mock fetch for testing
let mockFetchCalls = [];
let mockFetchResponse = null;

global.fetch = async (url, options) => {
  mockFetchCalls.push({ url, options });

  if (mockFetchResponse && mockFetchResponse.shouldFail) {
    if (mockFetchResponse.error) {
      throw mockFetchResponse.error;
    }
    return {
      ok: false,
      status: mockFetchResponse.status || 500,
      statusText: mockFetchResponse.statusText || 'Internal Server Error',
      headers: new Map(Object.entries(mockFetchResponse.headers || {})),
      json: async () => mockFetchResponse.body || { error: 'Request failed' }
    };
  }

  return {
    ok: true,
    status: 200,
    json: async () => mockFetchResponse || { success: true }
  };
};

test('FigmaAgentClient - constructor initializes with config', () => {
  const client = new FigmaAgentClient({
    serviceToken: 'fst-test-token',
    fileKey: 'abc123',
    timeout: 10000,
    maxRetries: 5
  });

  assert.equal(client.serviceToken, 'fst-test-token');
  assert.equal(client.fileKey, 'abc123');
  assert.equal(client.timeout, 10000);
  assert.equal(client.maxRetries, 5);
  assert.equal(client.baseUrl, 'https://api.figma.com/v1');
});

test('FigmaAgentClient - constructor uses defaults', () => {
  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123'
  });

  assert.equal(client.timeout, 30000);
  assert.equal(client.maxRetries, 3);
});

test('FigmaAgentClient - getFile makes correct API call', async () => {
  mockFetchCalls = [];
  mockFetchResponse = {
    document: {
      id: 'file123',
      name: 'Test File',
      children: []
    }
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test-token',
    fileKey: 'abc123'
  });

  const result = await client.getFile();

  assert.equal(mockFetchCalls.length, 1);
  assert.equal(mockFetchCalls[0].url, 'https://api.figma.com/v1/files/abc123');
  assert.equal(mockFetchCalls[0].options.method, 'GET');
  assert.equal(mockFetchCalls[0].options.headers['X-Figma-Token'], 'fst-test-token');
  assert.equal(result.document.id, 'file123');
});

test('FigmaAgentClient - createFrame builds correct request', async () => {
  mockFetchCalls = [];
  mockFetchResponse = {
    nodes: [{
      id: 'frame-123',
      name: 'Test Frame',
      type: 'FRAME'
    }]
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123'
  });

  const frame = await client.createFrame({
    parentId: 'page-123',
    name: 'My Frame',
    x: 100,
    y: 200,
    width: 400,
    height: 300,
    fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
    cornerRadius: 8,
    layoutMode: 'VERTICAL',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    itemSpacing: 12
  });

  assert.equal(mockFetchCalls.length, 1);
  assert.equal(mockFetchCalls[0].url, 'https://api.figma.com/v1/files/file123/nodes');
  assert.equal(mockFetchCalls[0].options.method, 'POST');

  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.equal(body.parent_id, 'page-123');
  assert.equal(body.nodes[0].type, 'FRAME');
  assert.equal(body.nodes[0].name, 'My Frame');
  assert.equal(body.nodes[0].layoutMode, 'VERTICAL');
  assert.equal(body.nodes[0].paddingTop, 16);
  assert.equal(frame.id, 'frame-123');
});

test('FigmaAgentClient - createConnector builds correct request', async () => {
  mockFetchCalls = [];
  mockFetchResponse = {
    id: 'connector-456',
    type: 'CONNECTOR'
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123'
  });

  const connector = await client.createConnector({
    parentId: 'page-123',
    startNodeId: 'node-1',
    endNodeId: 'node-2',
    label: 'connects to',
    connectorLineType: 'ELBOWED',
    endArrowType: 'ARROW_FILLED'
  });

  assert.equal(mockFetchCalls.length, 1);
  assert.equal(mockFetchCalls[0].url, 'https://api.figma.com/v1/files/file123/connectors');

  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.equal(body.parent_id, 'page-123');
  assert.equal(body.connector.connector_start.node_id, 'node-1');
  assert.equal(body.connector.connector_end.node_id, 'node-2');
  assert.equal(body.connector.connector_line_type, 'ELBOWED');
  assert.equal(body.connector.end_arrow_type, 'ARROW_FILLED');
  assert.equal(connector.id, 'connector-456');
});

test('FigmaAgentClient - rate limiting with 429 response', async () => {
  mockFetchCalls = [];
  let attemptCount = 0;

  // Override global fetch for this test
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    mockFetchCalls.push({ url, options });
    attemptCount++;

    if (attemptCount < 3) {
      return {
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '1']]),
        json: async () => ({ error: 'Rate limit exceeded' })
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    };
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123'
  });

  const result = await client.getFile();

  assert.equal(attemptCount, 3, 'Should retry on 429');
  assert.equal(mockFetchCalls.length, 3);
  assert.equal(result.success, true);

  global.fetch = originalFetch;
});

test('FigmaAgentClient - buildDeepLink creates correct URL', () => {
  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'abc123XYZ'
  });

  const url = client.buildDeepLink('123:456');
  assert.equal(url, 'https://www.figma.com/file/abc123XYZ/?node-id=123%3A456');
});

test('FigmaAgentClient - batch operations', async () => {
  mockFetchCalls = [];
  mockFetchResponse = {
    results: [
      { id: 'node-1', success: true },
      { id: 'node-2', success: true }
    ]
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123'
  });

  const operations = [
    { type: 'CREATE_FRAME', properties: { name: 'Frame 1' } },
    { type: 'CREATE_TEXT', properties: { characters: 'Hello' } }
  ];

  const result = await client.applyBatch(operations);

  assert.equal(mockFetchCalls.length, 1);
  assert.equal(mockFetchCalls[0].url, 'https://api.figma.com/v1/files/file123/batch');

  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.equal(body.operations.length, 2);
  assert.equal(result.results.length, 2);
});

test('FigmaAgentClient - createText with custom properties', async () => {
  mockFetchCalls = [];
  mockFetchResponse = {
    nodes: [{
      id: 'text-789',
      type: 'TEXT'
    }]
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123'
  });

  await client.createText({
    parentId: 'frame-123',
    characters: 'Hello World',
    x: 50,
    y: 50,
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: 700,
    fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
  });

  const body = JSON.parse(mockFetchCalls[0].options.body);
  assert.equal(body.nodes[0].type, 'TEXT');
  assert.equal(body.nodes[0].characters, 'Hello World');
  assert.equal(body.nodes[0].fontSize, 18);
  assert.equal(body.nodes[0].fontName.family, 'Inter');
  assert.equal(body.nodes[0].fontName.style, 'Bold');
});

test('FigmaAgentClient - error handling on failed request', async () => {
  mockFetchCalls = [];
  mockFetchResponse = {
    shouldFail: true,
    status: 403,
    statusText: 'Forbidden',
    body: { error: 'Access denied' }
  };

  const client = new FigmaAgentClient({
    serviceToken: 'fst-test',
    fileKey: 'file123',
    maxRetries: 1
  });

  await assert.rejects(
    async () => await client.getFile(),
    /Figma API error: 403/
  );
});
