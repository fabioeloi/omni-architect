# Configuration Guide

Este guia detalha todas as opções de configuração do Omni Architect.

## Arquivo de Configuração

O Omni Architect usa o arquivo `.omni-architect.yml` na raiz do projeto para configuração.

### Estrutura Básica

```yaml
# .omni-architect.yml
project_name: "My Project"
figma_file_key: "abc123XYZ"
design_system: "material-3"
locale: "pt-BR"
validation_mode: "interactive"
validation_threshold: 0.85

diagram_types:
  - flowchart
  - sequence
  - erDiagram

design_tokens:
  colors:
    primary: "#4A90D9"
  typography:
    font_family: "Inter"
  spacing:
    base: 8

hooks:
  on_validation_approved: "npm run generate:specs"
  on_figma_complete: "npm run notify:slack"

advanced:
  max_retries: 3
  phase_timeout: 300
```

## Referência Completa de Configuração

### project_name

- **Tipo**: `string`
- **Obrigatório**: Sim
- **Descrição**: Nome do projeto usado como namespace nos diagramas e no Figma
- **Exemplo**: `"E-Commerce Platform"`

### figma_file_key

- **Tipo**: `string`
- **Obrigatório**: Sim (ou via CLI)
- **Descrição**: Chave do arquivo Figma extraída da URL
- **Como obter**: Da URL `https://www.figma.com/file/ABC123XYZ/Project`, use `ABC123XYZ`
- **Exemplo**: `"abc123XYZ456"`

### figma_access_token

- **Tipo**: `string`
- **Obrigatório**: Sim
- **Descrição**: Token de acesso pessoal da API Figma
- **Recomendação**: Usar variável de ambiente `FIGMA_ACCESS_TOKEN` ao invés de hardcoded
- **Como gerar**: 
  1. Vá para [Figma Settings > Access Tokens](https://www.figma.com/developers/api#access-tokens)
  2. Clique em "Generate new token"
  3. Dê um nome descritivo
  4. Copie e salve em local seguro

```yaml
# ❌ NÃO fazer (expõe token)
figma_access_token: "figd_abc123..."

# ✅ Fazer (via environment variable)
# figma_access_token omitido do .yml
# Definir: export FIGMA_ACCESS_TOKEN="figd_abc123..."
```

### design_system

- **Tipo**: `string`
- **Obrigatório**: Não
- **Default**: `"material-3"`
- **Opções**: 
  - `"material-3"` - Material Design 3 (Google)
  - `"apple-hig"` - Apple Human Interface Guidelines
  - `"tailwind"` - Tailwind CSS design tokens
  - `"custom"` - Design system customizado (requer `design_tokens`)
- **Descrição**: Design system base para geração de assets Figma

### locale

- **Tipo**: `string`
- **Obrigatório**: Não
- **Default**: `"en-US"`
- **Opções**: Qualquer locale válido (`pt-BR`, `en-US`, `es-ES`, etc)
- **Descrição**: Locale para mensagens, labels e documentação gerada

### validation_mode

- **Tipo**: `string`
- **Obrigatório**: Não
- **Default**: `"interactive"`
- **Opções**:
  - `"interactive"` - Solicita aprovação manual quando threshold não é atingido
  - `"batch"` - Processa todos os PRDs em fila, aprovação em lote no final
  - `"auto"` - Aprova automaticamente se threshold for atingido, rejeita caso contrário
- **Descrição**: Modo de operação da fase de validação

### validation_threshold

- **Tipo**: `number`
- **Obrigatório**: Não
- **Default**: `0.85`
- **Range**: `0.0` a `1.0`
- **Descrição**: Score mínimo para aprovação automática
- **Recomendações**:
  - `0.90+` - Muito rigoroso, ideal para projetos críticos
  - `0.85` - Balanceado (padrão)
  - `0.75-` - Mais permissivo, aceita mais inconsistências

### diagram_types

- **Tipo**: `array<string>`
- **Obrigatório**: Não
- **Default**: `["flowchart", "sequence", "erDiagram"]`
- **Opções**:
  - `"flowchart"` - Fluxogramas para user flows
  - `"sequence"` - Diagramas de sequência para interações
  - `"erDiagram"` - Entity-Relationship para modelo de dados
  - `"stateDiagram"` - Máquinas de estado
  - `"C4Context"` - Diagramas C4 de contexto/container
  - `"journey"` - User journey maps
  - `"classDiagram"` - Diagramas de classe (raramente usado em PRDs)
- **Descrição**: Tipos de diagramas Mermaid a serem gerados

```yaml
diagram_types:
  - flowchart      # User flows principais
  - sequence       # Interações entre sistemas
  - erDiagram      # Modelo de dados
  - C4Context      # Arquitetura high-level
```

### design_tokens

Estrutura de design tokens customizados. Usado apenas quando `design_system: "custom"`.

#### design_tokens.colors

```yaml
design_tokens:
  colors:
    primary: "#4A90D9"
    secondary: "#7B68EE"
    success: "#2ECC71"
    error: "#E74C3C"
    warning: "#FFA500"
    info: "#1ABC9C"
    background: "#FFFFFF"
    surface: "#F5F5F5"
    text: "#333333"
    text_secondary: "#666666"
```

- **Formato**: Hex colors (`#RRGGBB`)
- **Cores requeridas**: `primary`, `background`, `text`
- **Cores opcionais**: `secondary`, `success`, `error`, `warning`, `info`, `surface`, `text_secondary`

#### design_tokens.typography

```yaml
design_tokens:
  typography:
    font_family: "Inter"
    font_family_mono: "Fira Code"
    heading_size: 24
    subheading_size: 18
    body_size: 14
    caption_size: 12
    line_height: 1.5
    letter_spacing: 0
```

- **font_family**: Fonte principal (disponível no Figma)
- **sizes**: Em pixels
- **line_height**: Multiplicador (1.0 = 100%)
- **letter_spacing**: Em pixels (pode ser negativo)

#### design_tokens.spacing

```yaml
design_tokens:
  spacing:
    base: 8        # Unidade base em pixels
    scale: 1.5     # Multiplicador para escala modular
    # Gera: base=8, 8*1.5=12, 12*1.5=18, 18*1.5=27, etc
```

- **base**: Unidade mínima de spacing (tipicamente 4 ou 8)
- **scale**: Escala modular (1.2, 1.5, 1.618 Golden Ratio, 2.0)

#### design_tokens.borders

```yaml
design_tokens:
  borders:
    radius: 8      # Border radius em pixels
    width: 1       # Border width em pixels
```

### hooks

Comandos executados em momentos específicos do pipeline.

```yaml
hooks:
  on_validation_approved: "npm run post-validation"
  on_figma_complete: "npm run export-specs"
  on_error: "npm run alert-team"
  on_complete: "npm run celebrate"
```

#### on_validation_approved

- **Tipo**: `string` (comando shell)
- **Quando**: Após Phase 3 aprovar a validação
- **Exemplo**: Gerar documentação técnica, atualizar Jira, etc

#### on_figma_complete

- **Tipo**: `string` (comando shell)
- **Quando**: Após Phase 4 criar assets no Figma
- **Exemplo**: Notificar time no Slack, exportar assets, etc

#### on_error

- **Tipo**: `string` (comando shell)
- **Quando**: Quando qualquer fase falhar
- **Exemplo**: Enviar alert, criar issue automaticamente, etc

#### on_complete

- **Tipo**: `string` (comando shell)
- **Quando**: Após Phase 5 completar com sucesso
- **Exemplo**: Arquivar outputs, atualizar status, etc

### advanced

Opções avançadas para fine-tuning.

```yaml
advanced:
  max_retries: 3
  phase_timeout: 300
  verbose: false
  parallel_diagrams: true
  cache_prd: true
  output_dir: "./output"
  log_level: "info"
  dry_run: false
```

#### max_retries

- **Tipo**: `integer`
- **Default**: `3`
- **Descrição**: Número máximo de tentativas para operações transientes (API calls, etc)

#### phase_timeout

- **Tipo**: `integer`
- **Default**: `300` (5 minutos)
- **Descrição**: Timeout por fase em segundos

#### verbose

- **Tipo**: `boolean`
- **Default**: `false`
- **Descrição**: Habilita logging verboso para debugging

#### parallel_diagrams

- **Tipo**: `boolean`
- **Default**: `true`
- **Descrição**: Gera múltiplos diagramas em paralelo (Phase 2)

#### cache_prd

- **Tipo**: `boolean`
- **Default**: `true`
- **Descrição**: Cacheia PRDs parseados para re-runs

#### output_dir

- **Tipo**: `string`
- **Default**: `"./output"`
- **Descrição**: Diretório para outputs locais

#### log_level

- **Tipo**: `string`
- **Default**: `"info"`
- **Opções**: `"debug"`, `"info"`, `"warn"`, `"error"`

#### dry_run

- **Tipo**: `boolean`
- **Default**: `false`
- **Descrição**: Se `true`, simula execução sem modificar Figma

## Exemplos de Configuração

### Configuração Mínima

```yaml
project_name: "My Project"
figma_file_key: "abc123"
# figma_access_token via env var
```

### Configuração para E-Commerce

```yaml
project_name: "E-Commerce Platform"
figma_file_key: "ecomm123XYZ"
design_system: "material-3"
locale: "pt-BR"
validation_threshold: 0.90

diagram_types:
  - flowchart       # Checkout, auth, search flows
  - sequence        # Payment, inventory interactions
  - erDiagram       # Product, user, order entities
  - stateDiagram    # Order status machine

hooks:
  on_figma_complete: "npm run notify:design-team"
```

### Configuração para Startup MVP

```yaml
project_name: "Startup MVP"
figma_file_key: "mvp789"
design_system: "tailwind"
validation_mode: "auto"
validation_threshold: 0.75   # Mais permissivo

diagram_types:
  - flowchart
  - erDiagram

advanced:
  verbose: true
  output_dir: "./design-output"
```

### Configuração Enterprise com Custom Design System

```yaml
project_name: "Enterprise Portal"
figma_file_key: "enterprise456"
design_system: "custom"
locale: "en-US"
validation_mode: "batch"
validation_threshold: 0.92

diagram_types:
  - flowchart
  - sequence
  - erDiagram
  - C4Context
  - stateDiagram

design_tokens:
  colors:
    primary: "#003366"
    secondary: "#0066CC"
    success: "#28A745"
    error: "#DC3545"
    warning: "#FFC107"
    background: "#F8F9FA"
    surface: "#FFFFFF"
    text: "#212529"
  
  typography:
    font_family: "IBM Plex Sans"
    font_family_mono: "IBM Plex Mono"
    heading_size: 28
    subheading_size: 20
    body_size: 16
    caption_size: 14
  
  spacing:
    base: 8
    scale: 1.618   # Golden ratio
  
  borders:
    radius: 4
    width: 2

hooks:
  on_validation_approved: "./scripts/generate-confluence-docs.sh"
  on_figma_complete: "./scripts/notify-stakeholders.sh"
  on_error: "./scripts/alert-sre.sh"

advanced:
  max_retries: 5
  phase_timeout: 600
  parallel_diagrams: true
  cache_prd: true
  log_level: "debug"
```

## Priorização de Configuração

A configuração é resolvida na seguinte ordem (última sobrescreve):

1. Defaults internos
2. `.omni-architect.yml` no diretório atual
3. Argumentos CLI (`--config`, `--project_name`, etc)
4. Environment variables (`OMNI_ARCHITECT_*`)

### Exemplo de Override via CLI

```bash
# .omni-architect.yml tem threshold: 0.85
# Override para 0.90 nesta execução
skills run omni-architect \
  --config .omni-architect.yml \
  --validation_threshold 0.90
```

### Exemplo de Override via Environment Variable

```bash
export OMNI_ARCHITECT_VALIDATION_THRESHOLD=0.90
export FIGMA_ACCESS_TOKEN="figd_..."

skills run omni-architect --config .omni-architect.yml
```

## Validação de Configuração

Valide seu arquivo de configuração antes de executar:

```bash
# Valida syntax e schema
skills validate-config .omni-architect.yml

# Saída esperada
✅ Configuration is valid
✅ All required fields present
✅ Design tokens are well-formed
✅ Hooks are executable
```

## Troubleshooting

### "figma_file_key is invalid"

- Verifique que o file key foi extraído corretamente da URL
- Certifique-se de ter acesso ao arquivo no Figma

### "design_tokens.colors.primary is required"

- Ao usar `design_system: "custom"`, todas as cores requeridas devem estar definidas

### "Hook command failed"

- Verifique que o comando no hook é executável
- Use caminhos absolutos ou relativos corretos
- Teste o comando manualmente primeiro

---

**Dúvidas?** Abra uma [issue](https://github.com/fabioeloi/omni-architect/issues) ou [discussion](https://github.com/fabioeloi/omni-architect/discussions).
