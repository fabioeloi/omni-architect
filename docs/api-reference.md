# API e CLI

## CLI

### `run`

```bash
npx omni-architect run \
  --prd_source ./examples/prd-ecommerce.md \
  --project_name "E-Commerce Platform" \
  --figma_file_key EXAMPLE_FILE_KEY \
  --figma_access_token EXAMPLE_TOKEN \
  --validation_mode auto \
  --output_dir ./output/example
```

Saída principal:

- `parsed-prd.json`
- `diagrams/*.mmd`
- `validation-report.json`
- `figma/figma-payload.json`
- `orchestration-log.json`
- `session.json`
- `session-state.json`

Status esperado:

```json
{
  "status": "awaiting_figma_import"
}
```

### `resume`

```bash
npx omni-architect resume \
  --session_dir ./output/example \
  --figma_result ./figma-import-result.json \
  --prd_source ./examples/prd-ecommerce.md \
  --project_name "E-Commerce Platform" \
  --figma_file_key EXAMPLE_FILE_KEY \
  --figma_access_token EXAMPLE_TOKEN
```

Saída principal:

- `figma-import-result.json`
- `figma-assets.json`
- `HANDOFF.md`

Status esperado:

```json
{
  "status": "completed"
}
```

## API JavaScript

```js
const { run, resumeFigma } = require('omni-architect');

const pending = await run({
  prd_source: './examples/prd-ecommerce.md',
  project_name: 'E-Commerce Platform',
  figma_file_key: 'EXAMPLE_FILE_KEY',
  figma_access_token: 'EXAMPLE_TOKEN',
  validation_mode: 'auto',
  output_dir: './output/example'
});

const completed = await resumeFigma({
  session_dir: './output/example',
  figma_result: './output/playwright/local-flow/figma-import-result.json',
  prd_source: './examples/prd-ecommerce.md',
  project_name: 'E-Commerce Platform',
  figma_file_key: 'EXAMPLE_FILE_KEY',
  figma_access_token: 'EXAMPLE_TOKEN'
});
```

## Contrato do plugin

### Entrada

`figma-payload.json`

### Saída

Manifesto JSON com:

- `imported_at`
- `project_name`
- `figma_file_key`
- `assets[]`

Cada asset contém:

- `node_id`
- `name`
- `type`
- `page`
- `figma_url`
