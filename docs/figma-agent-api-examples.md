# Figma Agent API Integration Examples

This document provides examples of how to use the new Figma Agent API integration in Omni Architect.

## Configuration Examples

### Option 1: Using REST API (Recommended for Automation)

```yaml
# .omni-architect.yml
prd_source: "./examples/prd-ecommerce.md"
project_name: "E-Commerce Platform"

# Figma configuration with REST API
figma_file_key: "abc123XYZ"
figma_service_token: "${FIGMA_SERVICE_TOKEN}"  # Service account token
figma_integration_mode: "rest_api"  # Force REST API mode

design_system: "material-3"
locale: "pt-BR"
validation_mode: "auto"
validation_threshold: 0.85
output_dir: "./output/example"

diagram_types:
  - flowchart
  - sequence
  - erDiagram
  - stateDiagram
  - C4Context
  - journey
```

**Environment setup:**
```bash
export FIGMA_SERVICE_TOKEN="fst-your-service-token-here"
```

### Option 2: Using Plugin (Manual Import)

```yaml
# .omni-architect.yml
prd_source: "./examples/prd-ecommerce.md"
project_name: "E-Commerce Platform"

# Figma configuration with Plugin
figma_file_key: "abc123XYZ"
figma_access_token: "${FIGMA_ACCESS_TOKEN}"  # Personal access token
figma_integration_mode: "plugin"  # Force plugin mode

design_system: "material-3"
locale: "pt-BR"
validation_mode: "auto"
validation_threshold: 0.85
output_dir: "./output/example"
```

**Environment setup:**
```bash
export FIGMA_ACCESS_TOKEN="fptk-your-personal-token-here"
```

### Option 3: Auto Mode (Intelligent Selection)

```yaml
# .omni-architect.yml
prd_source: "./examples/prd-ecommerce.md"
project_name: "E-Commerce Platform"

# Figma configuration - auto-selects based on available tokens
figma_file_key: "abc123XYZ"
figma_service_token: "${FIGMA_SERVICE_TOKEN}"  # Preferred
figma_access_token: "${FIGMA_ACCESS_TOKEN}"    # Fallback
figma_integration_mode: "auto"  # Default - uses REST API if service token available

design_system: "material-3"
locale: "pt-BR"
validation_mode: "auto"
validation_threshold: 0.85
output_dir: "./output/example"
```

**Auto-selection logic:**
- If `figma_service_token` is present → Use REST API
- Else if `figma_access_token` is present → Use Plugin mode
- Else → Error

## CLI Usage Examples

### Using REST API with Environment Variable

```bash
export FIGMA_SERVICE_TOKEN="fst-xxx-yyy"

npx omni-architect run \
  --prd_source ./examples/prd-ecommerce.md \
  --project_name "E-Commerce Platform" \
  --figma_file_key "abc123XYZ" \
  --figma_integration_mode rest_api
```

**Result:** Direct canvas update, no manual plugin step required!

### Using Plugin Mode (Backward Compatible)

```bash
export FIGMA_ACCESS_TOKEN="fptk-xxx-yyy"

npx omni-architect run \
  --prd_source ./examples/prd-ecommerce.md \
  --project_name "E-Commerce Platform" \
  --figma_file_key "abc123XYZ" \
  --figma_integration_mode plugin
```

**Result:** Generates `figma-payload.json` for manual plugin import

### Auto Mode (Recommended)

```bash
export FIGMA_SERVICE_TOKEN="fst-xxx-yyy"

npx omni-architect run \
  --prd_source ./examples/prd-ecommerce.md \
  --project_name "E-Commerce Platform" \
  --figma_file_key "abc123XYZ"
```

**Result:** Automatically uses REST API because service token is present

## Programmatic API Examples

### Using REST API Client Directly

```javascript
const FigmaAgentClient = require('omni-architect/lib/figma-client');

// Initialize client
const client = new FigmaAgentClient({
  serviceToken: process.env.FIGMA_SERVICE_TOKEN,
  fileKey: 'abc123XYZ',
  timeout: 30000,
  maxRetries: 3
});

// Create a page
const page = await client.ensurePage('User Flows');

// Create a frame with auto-layout
const frame = await client.createFrame({
  parentId: page.id,
  name: 'Checkout Flow',
  x: 40,
  y: 40,
  width: 960,
  height: 720,
  fills: [{ type: 'SOLID', color: { r: 0.98, g: 0.99, b: 1 } }],
  cornerRadius: 16,
  layoutMode: 'VERTICAL',
  padding: { top: 16, right: 16, bottom: 16, left: 16 },
  itemSpacing: 12
});

// Create a rectangle node
const rect = await client.createRectangle({
  parentId: frame.id,
  name: 'Process Step',
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  fills: [{ type: 'SOLID', color: { r: 0.93, g: 0.97, b: 1 } }],
  strokes: [{ type: 'SOLID', color: { r: 0.2, g: 0.34, b: 0.61 } }],
  cornerRadius: 8
});

// Create a connector between nodes
const connector = await client.createConnector({
  parentId: frame.id,
  startNodeId: rect.id,
  endNodeId: anotherRect.id,
  label: 'user clicks',
  connectorLineType: 'ELBOWED',
  endArrowType: 'ARROW_FILLED'
});

// Get design variables
const variables = await client.getVariables('Material 3 Colors');
console.log(variables);

// Build deep link
const url = client.buildDeepLink(frame.id);
console.log(`View in Figma: ${url}`);
```

### Using Omni Architect Orchestrator

```javascript
const omniArchitect = require('omni-architect');

// REST API mode
const result = await omniArchitect.run({
  prd_source: fs.readFileSync('./prd.md', 'utf-8'),
  project_name: 'My SaaS App',
  figma_file_key: 'abc123XYZ',
  figma_service_token: process.env.FIGMA_SERVICE_TOKEN,
  figma_integration_mode: 'rest_api', // Force REST API
  diagram_types: ['flowchart', 'sequence', 'erDiagram'],
  design_system: 'material-3',
  validation_mode: 'auto',
  validation_threshold: 0.9,
  locale: 'pt-BR'
});

console.log(`Status: ${result.status}`);
console.log(`Figma assets created: ${result.figma_assets.length}`);

// No need for manual plugin import or resume step!
```

## CI/CD Integration Example

### GitHub Actions Workflow

```yaml
name: Update Figma on PRD Changes

on:
  push:
    paths:
      - 'docs/prd-*.md'

jobs:
  update-figma:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Omni Architect
        run: npm install -g omni-architect

      - name: Generate Figma Assets
        env:
          FIGMA_SERVICE_TOKEN: ${{ secrets.FIGMA_SERVICE_TOKEN }}
        run: |
          npx omni-architect run \
            --prd_source ./docs/prd-ecommerce.md \
            --project_name "E-Commerce Platform" \
            --figma_file_key ${{ secrets.FIGMA_FILE_KEY }} \
            --figma_integration_mode rest_api \
            --validation_mode auto \
            --output_dir ./output

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: figma-assets
          path: output/
```

### GitLab CI Pipeline

```yaml
stages:
  - validate
  - deploy-figma

update-figma:
  stage: deploy-figma
  image: node:18
  only:
    changes:
      - docs/prd-*.md
  script:
    - npm install -g omni-architect
    - |
      npx omni-architect run \
        --prd_source ./docs/prd-ecommerce.md \
        --project_name "E-Commerce Platform" \
        --figma_file_key "$FIGMA_FILE_KEY" \
        --figma_service_token "$FIGMA_SERVICE_TOKEN" \
        --figma_integration_mode rest_api \
        --validation_mode auto
  artifacts:
    paths:
      - output/
```

## Migration Guide

### From Plugin Mode to REST API

**Step 1:** Obtain Figma Service Token
- Go to Figma Settings → Integrations
- Click "Generate Service Token"
- Copy the token (starts with `fst-`)

**Step 2:** Update configuration
```diff
# .omni-architect.yml
figma_file_key: "abc123XYZ"
- figma_access_token: "${FIGMA_ACCESS_TOKEN}"
+ figma_service_token: "${FIGMA_SERVICE_TOKEN}"
+ figma_integration_mode: "rest_api"
```

**Step 3:** Update environment
```bash
# Remove old token
unset FIGMA_ACCESS_TOKEN

# Add new service token
export FIGMA_SERVICE_TOKEN="fst-xxx-yyy"
```

**Step 4:** Run as usual
```bash
npx omni-architect run --prd_source ./prd.md
```

**Benefits:**
- ✅ No manual plugin import step
- ✅ Fully automated pipeline
- ✅ CI/CD compatible
- ✅ Faster execution (30s vs 2-5min)

## Troubleshooting

### Error: "figma_service_token is required"

**Cause:** REST API mode selected but service token not provided

**Solution:**
```bash
export FIGMA_SERVICE_TOKEN="fst-xxx-yyy"
```

Or use auto mode:
```yaml
figma_integration_mode: "auto"
```

### Error: "Figma API error: 403"

**Cause:** Service token doesn't have permission to access file

**Solution:**
1. Verify service token has "Edit" permission
2. Check file key is correct
3. Ensure file is not locked or deleted

### Error: "Rate limit exceeded"

**Cause:** Too many API requests in short time

**Solution:**
The client automatically retries with exponential backoff. If issue persists:
- Reduce number of diagrams
- Increase `maxRetries` in client config
- Wait 60 seconds before retrying

## Feature Comparison

| Feature | Plugin Mode | REST API Mode |
|---------|------------|---------------|
| **Manual import step** | Yes (paste JSON) | No (automated) |
| **CI/CD support** | No | Yes |
| **Execution time** | 2-5 minutes | <30 seconds |
| **Vector rendering** | Text-based | Native shapes (future) |
| **Connectors** | Text lists | Native arrows (future) |
| **Auto-layout** | Manual positioning | Dynamic (future) |
| **Design system** | Hard-coded | Variable binding (future) |
| **Authentication** | Personal token | Service account |

## Best Practices

### 1. Use Service Tokens for Automation

```yaml
# For CI/CD and automated workflows
figma_integration_mode: "rest_api"
figma_service_token: "${FIGMA_SERVICE_TOKEN}"
```

### 2. Use Plugin Mode for Manual Review

```yaml
# For iterative design work with human review
figma_integration_mode: "plugin"
figma_access_token: "${FIGMA_ACCESS_TOKEN}"
```

### 3. Use Auto Mode for Flexibility

```yaml
# Adapts based on available credentials
figma_integration_mode: "auto"
figma_service_token: "${FIGMA_SERVICE_TOKEN}"
figma_access_token: "${FIGMA_ACCESS_TOKEN}"  # Fallback
```

### 4. Secure Token Storage

**Never commit tokens to git:**
```bash
# .gitignore
.env
.omni-architect.local.yml
```

**Use environment variables:**
```bash
# .env (load with dotenv)
FIGMA_SERVICE_TOKEN=fst-xxx-yyy
FIGMA_FILE_KEY=abc123XYZ
```

### 5. Test Locally Before CI/CD

```bash
# Test REST API locally first
npx omni-architect run \
  --prd_source ./test-prd.md \
  --figma_integration_mode rest_api
```

## Next Steps

- Read [Figma Agent API Assessment](./figma-agent-api-assessment.md) for detailed architecture
- Review [API Reference](./api-reference.md) for all configuration options
- Check [CHANGELOG](../CHANGELOG.md) for version compatibility
- Join discussion in [GitHub Issues](https://github.com/fabioeloi/omni-architect/issues)
