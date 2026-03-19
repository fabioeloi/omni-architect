const fs = require('node:fs/promises');
const path = require('node:path');

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function redactSecrets(input, secretValues = []) {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return secretValues.reduce((accumulator, secret) => {
      if (!secret) {
        return accumulator;
      }

      return accumulator.split(secret).join('[REDACTED]');
    }, input);
  }

  if (Array.isArray(input)) {
    return input.map((value) => redactSecrets(value, secretValues));
  }

  if (typeof input === 'object') {
    const clone = {};
    for (const [key, value] of Object.entries(input)) {
      const nextValue =
        /token|secret|password/i.test(key) && value
          ? '[REDACTED]'
          : redactSecrets(value, secretValues);
      clone[key] = nextValue;
    }

    return clone;
  }

  return input;
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeText(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, value, 'utf8');
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

module.exports = {
  ensureDir,
  redactSecrets,
  slugify,
  uniqueBy,
  writeJson,
  writeText
};
