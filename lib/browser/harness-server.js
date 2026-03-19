const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mmd': 'text/plain; charset=utf-8'
};

async function safeReadJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function collectSessionData(outputDir) {
  const diagramsDir = path.join(outputDir, 'diagrams');
  const diagramFiles = await fs.readdir(diagramsDir).catch(() => []);
  const diagrams = await Promise.all(
    diagramFiles
      .filter((file) => file.endsWith('.mmd'))
      .sort()
      .map(async (file) => ({
        id: file.replace(/\.mmd$/, ''),
        filename: file,
        code: await fs.readFile(path.join(diagramsDir, file), 'utf8')
      }))
  );

  const [parsedPrd, validationReport, figmaPayload, figmaAssets] = await Promise.all([
    safeReadJson(path.join(outputDir, 'parsed-prd.json')),
    safeReadJson(path.join(outputDir, 'validation-report.json')),
    safeReadJson(path.join(outputDir, 'figma', 'figma-payload.json')),
    safeReadJson(path.join(outputDir, 'figma-assets.json'))
  ]);

  return {
    outputDir,
    parsedPrd,
    validationReport,
    figmaPayload,
    figmaAssets,
    diagrams
  };
}

function send(res, status, body, contentType) {
  res.writeHead(status, { 'content-type': contentType });
  res.end(body);
}

async function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const body = await fs.readFile(filePath);
  send(res, 200, body, MIME_TYPES[ext] || 'application/octet-stream');
}

async function startHarnessServer(options = {}) {
  const outputDir = path.resolve(process.cwd(), options.outputDir || path.join('output', 'example'));
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const sessionData = await collectSessionData(outputDir);

      if (url.pathname === '/api/diagrams') {
        return send(res, 200, JSON.stringify(sessionData.diagrams), MIME_TYPES['.json']);
      }

      if (url.pathname === '/api/figma-payload') {
        return send(
          res,
          sessionData.figmaPayload ? 200 : 404,
          JSON.stringify(sessionData.figmaPayload || { error: 'figma payload not found' }),
          MIME_TYPES['.json']
        );
      }

      if (url.pathname === '/api/summary') {
        return send(
          res,
          200,
          JSON.stringify({
            project: sessionData.parsedPrd?.project,
            validation: sessionData.validationReport,
            diagrams: sessionData.diagrams.map((diagram) => diagram.id),
            figmaAssetsCount: Array.isArray(sessionData.figmaAssets)
              ? sessionData.figmaAssets.length
              : 0,
            outputDir: sessionData.outputDir
          }),
          MIME_TYPES['.json']
        );
      }

      if (url.pathname === '/' || url.pathname === '/index.html') {
        return serveFile(res, path.join(process.cwd(), 'harness', 'index.html'));
      }

      if (url.pathname === '/mermaid') {
        return serveFile(res, path.join(process.cwd(), 'harness', 'mermaid-preview.html'));
      }

      if (url.pathname === '/plugin-wrapper') {
        return serveFile(res, path.join(process.cwd(), 'harness', 'plugin-wrapper.html'));
      }

      if (url.pathname === '/summary') {
        return serveFile(res, path.join(process.cwd(), 'harness', 'session-summary.html'));
      }

      if (url.pathname === '/plugin-ui') {
        return serveFile(res, path.join(process.cwd(), 'figma-plugin', 'ui.html'));
      }

      if (url.pathname === '/plugin-code.js') {
        return serveFile(res, path.join(process.cwd(), 'figma-plugin', 'code.js'));
      }

      if (url.pathname.startsWith('/vendor/mermaid/')) {
        const relativePath = url.pathname.replace('/vendor/mermaid/', '');
        return serveFile(
          res,
          path.join(process.cwd(), 'node_modules', 'mermaid', 'dist', relativePath)
        );
      }

      return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    } catch (error) {
      return send(res, 500, error.stack || error.message, 'text/plain; charset=utf-8');
    }
  });

  await new Promise((resolve) => {
    server.listen(options.port || 0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}`;

  return {
    outputDir,
    url,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

module.exports = {
  startHarnessServer
};
