# Guia Técnico: Browser Layer e E2E

## Objetivo

O projeto possui uma camada de browser baseada em Playwright para validar os assets no navegador, não apenas em memória.

Ela cobre dois níveis:

- local determinístico: Mermaid + wrapper do plugin + `resume`
- smoke real no Figma web: depende de autenticação, plugin disponível e arquivo de teste

## Componentes

### Browser layer

- [`lib/browser/context.js`](../lib/browser/context.js)
- [`lib/browser/harness-server.js`](../lib/browser/harness-server.js)

Responsabilidades:

- abrir contexto de browser reutilizável
- salvar traces e screenshots
- servir preview local do Mermaid
- servir a UI real do plugin em um wrapper com mock de Figma

### Harness

O harness expõe:

- `/mermaid`
- `/plugin-wrapper`
- `/summary`

Suba localmente com:

```bash
npm run harness
```

## Scripts e2e

### Mermaid-only

```bash
npm run e2e:mermaid
```

Valida:

- geração do PRD de exemplo
- render real dos 6 diagramas no browser
- screenshots em `output/playwright/local-flow`

### Fluxo local completo

```bash
npm run e2e
```

Valida:

1. `run` com o PRD de exemplo
2. preview Mermaid no browser
3. import do payload no wrapper do plugin
4. manifesto exportado
5. `resume`
6. `figma-assets.json` e `HANDOFF.md`

### Bootstrap de autenticação Figma

```bash
npm run e2e:figma:bootstrap
```

Por padrão, salva o storage state em:

```text
playwright/.auth/figma-user.json
```

Você pode sobrescrever com:

```bash
FIGMA_E2E_STORAGE_STATE=/caminho/figma.json npm run e2e:figma:bootstrap
```

### Smoke no Figma real

```bash
FIGMA_E2E_FILE_URL="https://www.figma.com/file/..." \
FIGMA_E2E_PLUGIN_NAME="Omni Architect Importer" \
FIGMA_E2E_STORAGE_STATE="./playwright/.auth/figma-user.json" \
npm run e2e:figma
```

Esse smoke assume:

- conta autenticada
- arquivo Figma de teste acessível
- plugin publicado ou já instalado no workspace

## Artefatos gerados

### Artefatos de browser

```text
output/playwright/
└── <session>/
    ├── trace.zip
    ├── mermaid-preview.png
    ├── plugin-wrapper.png
    ├── summary-after-resume.png
    ├── figma-import-result.json
    └── diagrams/
```

### Artefatos do pipeline

```text
output/example/
├── diagrams/*.mmd
├── figma/figma-payload.json
├── parsed-prd.json
├── validation-report.json
├── figma-assets.json
└── HANDOFF.md
```

## Variáveis de ambiente úteis

### Harness

- `OMNI_ARCHITECT_OUTPUT_DIR`
- `OMNI_ARCHITECT_HARNESS_PORT`

### Browser local

- `OMNI_ARCHITECT_BROWSER_CHANNEL`
- `OMNI_ARCHITECT_BROWSER_EXECUTABLE_PATH`
- `OMNI_ARCHITECT_BROWSER_TIMEOUT_MS`

### Figma real

- `FIGMA_E2E_FILE_URL`
- `FIGMA_E2E_PLUGIN_NAME`
- `FIGMA_E2E_STORAGE_STATE`

## Troubleshooting

### O browser não abre

Rode:

```bash
npm run e2e:install
```

Se ainda falhar, valide se Chrome/Chromium está instalado localmente.

Se necessário, force explicitamente:

```bash
OMNI_ARCHITECT_BROWSER_CHANNEL=chrome npm run e2e
```

### O smoke do Figma não acha o plugin

Confirme:

- nome do plugin igual ao valor de `FIGMA_E2E_PLUGIN_NAME`
- plugin publicado ou instalado no workspace
- storage state válido

### O preview Mermaid demora

Isso é esperado no primeiro render. O harness marca o estado no topo da página e só conclui quando todos os diagramas forem processados.

## Referências oficiais

- Plugin quickstart do Figma: <https://developers.figma.com/docs/plugins/plugin-quickstart-guide/>
- Manifest do plugin: <https://developers.figma.com/docs/plugins/manifest/>
- UI e troca de mensagens do plugin: <https://developers.figma.com/docs/plugins/creating-ui/>
- Uso do Mermaid: <https://mermaid.js.org/config/usage.html>
