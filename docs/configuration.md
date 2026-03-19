# Configuração

## Formas de fornecer configuração

O projeto aceita configuração por:

- argumentos CLI
- API programática
- `.omni-architect.yml`
- variáveis de ambiente

A precedência prática é:

1. argumentos explícitos
2. variáveis de ambiente
3. `.omni-architect.yml`
4. defaults internos

## Exemplo de `.omni-architect.yml`

```yaml
prd_source: "./examples/prd-ecommerce.md"
project_name: "E-Commerce Platform"
figma_file_key: "EXAMPLE_FILE_KEY"
figma_access_token: "EXAMPLE_TOKEN"
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

hooks:
  on_validation_approved: "echo validation-approved"
  on_figma_complete: "echo figma-complete"
  on_error: "echo pipeline-error"
```

## Campos principais

### Obrigatórios

- `prd_source`
- `project_name`
- `figma_file_key`
- `figma_access_token`

### Opcionais

- `diagram_types`
- `design_system`
- `locale`
- `validation_mode`
- `validation_threshold`
- `output_dir`
- `hooks`

## Defaults

```json
{
  "design_system": "material-3",
  "locale": "pt-BR",
  "validation_mode": "interactive",
  "validation_threshold": 0.85,
  "diagram_types": ["flowchart", "sequence", "erDiagram", "stateDiagram", "C4Context"],
  "output_dir": "output"
}
```

## Variáveis de ambiente

- `OMNI_ARCHITECT_PRD_SOURCE`
- `OMNI_ARCHITECT_PROJECT_NAME`
- `FIGMA_FILE_KEY`
- `FIGMA_ACCESS_TOKEN`
- `FIGMA_TOKEN`
- `OMNI_ARCHITECT_DESIGN_SYSTEM`
- `OMNI_ARCHITECT_LOCALE`
- `OMNI_ARCHITECT_VALIDATION_MODE`
- `OMNI_ARCHITECT_VALIDATION_THRESHOLD`
- `OMNI_ARCHITECT_OUTPUT_DIR`

## Hooks

Os hooks são opcionais e recebem estas variáveis:

- `OMNI_ARCHITECT_EVENT`
- `OMNI_ARCHITECT_STATUS`
- `OMNI_ARCHITECT_OUTPUT_DIR`
- `OMNI_ARCHITECT_PROJECT_NAME`

Falhas de hook entram como warning no log e não apagam os artefatos já gerados.
