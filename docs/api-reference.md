# API Reference

## Omni Architect API

Referência completa de inputs, outputs e APIs por fase do pipeline.

## Global Inputs

Inputs aceitos pelo skill principal `omni-architect`:

### prd_source

- **Type**: `string`
- **Required**: Yes
- **Description**: PRD completo em Markdown, ou caminho/URL para o documento
- **Accepts**: 
  - String com conteúdo Markdown direto
  - Caminho de arquivo local: `./docs/prd.md`
  - URL: `https://example.com/prd.md`
- **Example**:
  ```javascript
  prd_source: "./examples/prd-ecommerce.md"
  ```

### project_name

- **Type**: `string`
- **Required**: Yes
- **Description**: Nome do projeto usado como namespace
- **Example**: `"E-Commerce Platform"`

### figma_file_key

- **Type**: `string`
- **Required**: Yes
- **Description**: Chave do arquivo Figma (extraída da URL)
- **Format**: Alfanumérico, tipicamente ~10-20 caracteres
- **Example**: `"abc123XYZ456"`

### figma_access_token

- **Type**: `string`
- **Required**: Yes
- **Description**: Token de acesso Figma API
- **Format**: Começa com `figd_`
- **Security**: ⚠️ Nunca commitar em código-fonte, usar env var
- **Example**: `process.env.FIGMA_ACCESS_TOKEN`

### diagram_types

- **Type**: `array<string>`
- **Required**: No
- **Default**: `["flowchart", "sequence", "erDiagram"]`
- **Options**: `"flowchart"`, `"sequence"`, `"erDiagram"`, `"stateDiagram"`, `"C4Context"`, `"journey"`, `"classDiagram"`
- **Example**:
  ```json
  ["flowchart", "sequence", "erDiagram", "stateDiagram"]
  ```

### design_system

- **Type**: `string`
- **Required**: No
- **Default**: `"material-3"`
- **Options**: `"material-3"`, `"apple-hig"`, `"tailwind"`, `"custom"`
- **Example**: `"material-3"`

### validation_mode

- **Type**: `string`
- **Required**: No
- **Default**: `"interactive"`
- **Options**: `"interactive"`, `"batch"`, `"auto"`
- **Example**: `"auto"`

### validation_threshold

- **Type**: `number`
- **Required**: No
- **Default**: `0.85`
- **Range**: `0.0` - `1.0`
- **Example**: `0.90`

### locale

- **Type**: `string`
- **Required**: No
- **Default**: `"en-US"`
- **Example**: `"pt-BR"`

---

## Global Outputs

Outputs retornados pelo pipeline completo:

### parsed_prd

- **Type**: `object`
- **Description**: PRD parseado em estrutura semântica
- **Schema**:
  ```typescript
  {
    project: {
      name: string;
      description: string;
      version: string;
    };
    features: Feature[];
    entities: Entity[];
    metadata: {
      parsed_at: string;
      parser_version: string;
    };
  }
  ```

### mermaid_diagrams

- **Type**: `array<Diagram>`
- **Description**: Diagramas Mermaid gerados
- **Schema**:
  ```typescript
  {
    type: string;          // "flowchart", "sequence", etc
    name: string;          // Nome descritivo
    code: string;          // Código Mermaid
    feature_ids: string[]; // Features relacionadas
    metadata: {
      nodes: number;
      edges: number;
      complexity: number;
    };
  }
  ```

### validation_report

- **Type**: `object`
- **Description**: Relatório detalhado de validação
- **Schema**:
  ```typescript
  {
    overall_score: number;        // 0.0 - 1.0
    status: "approved" | "rejected" | "pending";
    breakdown: {
      [criterion: string]: {
        score: number;
        weight: number;
        issues: Issue[];
      };
    };
    recommendations: string[];
    validated_at: string;
  }
  ```

### figma_assets

- **Type**: `object`
- **Description**: Assets criados no Figma
- **Schema**:
  ```typescript
  {
    file_key: string;
    file_url: string;
    pages: Page[];
    components: Component[];
    created_at: string;
    figma_version: string;
  }
  ```

### orchestration_log

- **Type**: `array<LogEntry>`
- **Description**: Log completo da execução
- **Schema**:
  ```typescript
  {
    timestamp: string;
    phase: string;
    level: "debug" | "info" | "warn" | "error";
    message: string;
    metadata: Record<string, any>;
    duration_ms?: number;
  }
  ```

---

## Phase 1: PRD Parser

### Input

```typescript
{
  prd_source: string;        // Markdown PRD
  project_name: string;
  locale: string;
}
```

### Output

```typescript
{
  project: {
    name: string;
    description: string;
    version: string;
    stakeholders: string[];
  };
  
  features: Array<{
    id: string;              // e.g., "F001"
    name: string;
    description: string;
    priority: "high" | "medium" | "low";
    user_stories: Array<{
      id: string;            // e.g., "US001"
      as_a: string;
      i_want: string;
      so_that: string;
    }>;
    acceptance_criteria: string[];
    dependencies: string[];  // IDs de outras features
  }>;
  
  entities: Array<{
    name: string;
    attributes: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
    relationships: Array<{
      target: string;
      type: "one-to-one" | "one-to-many" | "many-to-many";
    }>;
  }>;
  
  actors: Array<{
    name: string;
    role: string;
    goals: string[];
  }>;
  
  metadata: {
    parsed_at: string;
    parser_version: string;
    word_count: number;
    feature_count: number;
  };
}
```

---

## Phase 2: Mermaid Generator

### Input

```typescript
{
  parsed_prd: ParsedPRD;    // Output de Phase 1
  diagram_types: string[];
  project_name: string;
}
```

### Output

```typescript
{
  diagrams: Array<{
    type: "flowchart" | "sequence" | "erDiagram" | "stateDiagram" | "C4Context" | "journey";
    name: string;
    code: string;            // Mermaid code
    feature_ids: string[];   // Features representadas
    entities: string[];      // Entidades usadas
    metadata: {
      nodes: number;
      edges: number;
      complexity: number;    // 0.0-1.0
      estimated_render_time_ms: number;
    };
  }>;
  
  mapping: {
    features_to_diagrams: Record<string, string[]>;
    entities_to_diagrams: Record<string, string[]>;
  };
  
  metadata: {
    generated_at: string;
    total_diagrams: number;
    total_nodes: number;
  };
}
```

### Diagram Type Mappings

| PRD Element | → | Diagram Type | Notes |
|-------------|---|--------------|-------|
| User Story + Flow | → | `flowchart` | Fluxo completo da feature |
| System Interaction | → | `sequence` | Interação entre atores/sistemas |
| Entities + Relationships | → | `erDiagram` | Modelo de dados |
| State Transitions | → | `stateDiagram` | Estados e transições |
| System Architecture | → | `C4Context` | Contexto arquitetural |
| User Experience | → | `journey` | Jornada do usuário |

---

## Phase 3: Logic Validator

### Input

```typescript
{
  parsed_prd: ParsedPRD;
  diagrams: Diagram[];
  validation_threshold: number;
  validation_mode: "interactive" | "batch" | "auto";
}
```

### Output

```typescript
{
  overall_score: number;           // 0.0 - 1.0
  status: "approved" | "rejected" | "pending";
  
  breakdown: {
    coverage: {
      score: number;               // 0.0 - 1.0
      weight: number;              // 0.25
      details: {
        features_covered: number;
        features_total: number;
        coverage_percentage: number;
      };
      issues: Issue[];
    };
    
    consistency: {
      score: number;               // 0.0 - 1.0
      weight: number;              // 0.25
      details: {
        naming_conflicts: number;
        entity_mismatches: number;
      };
      issues: Issue[];
    };
    
    completeness: {
      score: number;               // 0.0 - 1.0
      weight: number;              // 0.20
      details: {
        missing_actors: string[];
        missing_states: string[];
      };
      issues: Issue[];
    };
    
    traceability: {
      score: number;               // 0.0 - 1.0
      weight: number;              // 0.15
      details: {
        orphaned_features: string[];
        unmapped_entities: string[];
      };
      issues: Issue[];
    };
    
    naming_coherence: {
      score: number;               // 0.0 - 1.0
      weight: number;              // 0.10
      details: {
        inconsistent_names: Array<{
          term: string;
          variations: string[];
        }>;
      };
      issues: Issue[];
    };
    
    dependency_integrity: {
      score: number;               // 0.0 - 1.0
      weight: number;              // 0.05
      details: {
        circular_dependencies: string[][];
        broken_dependencies: string[];
      };
      issues: Issue[];
    };
  };
  
  recommendations: string[];
  validated_at: string;
  validator_version: string;
}
```

### Issue Schema

```typescript
interface Issue {
  severity: "error" | "warning" | "info";
  criterion: string;
  message: string;
  location: {
    feature_id?: string;
    diagram_name?: string;
    line?: number;
  };
  suggestion?: string;
}
```

---

## Phase 4: Figma Generator

### Input

```typescript
{
  diagrams: Diagram[];
  validation_report: ValidationReport;
  figma_file_key: string;
  figma_access_token: string;
  design_system: string;
  design_tokens?: DesignTokens;
  project_name: string;
}
```

### Output

```typescript
{
  file_key: string;
  file_url: string;
  
  pages: Array<{
    id: string;
    name: string;
    type: "flows" | "specs" | "data-model" | "architecture" | "components";
    frames: Array<{
      id: string;
      name: string;
      width: number;
      height: number;
      diagram_type: string;
      source_diagram: string;
    }>;
  }>;
  
  components: Array<{
    id: string;
    name: string;
    type: "token" | "connector" | "shape";
  }>;
  
  metadata: {
    created_at: string;
    figma_version: string;
    total_frames: number;
    total_components: number;
    generation_duration_ms: number;
  };
}
```

---

## Phase 5: Asset Delivery

### Input

```typescript
{
  parsed_prd: ParsedPRD;
  diagrams: Diagram[];
  validation_report: ValidationReport;
  figma_assets: FigmaAssets;
  orchestration_log: LogEntry[];
  output_dir: string;
}
```

### Output

```typescript
{
  package_path: string;          // Path to delivery package
  
  deliverables: {
    prd_json: string;            // Path to parsed PRD
    diagrams_dir: string;        // Path to .mmd files
    validation_report: string;   // Path to validation JSON
    figma_metadata: string;      // Path to Figma metadata
    orchestration_log: string;   // Path to full log
    summary: string;             // Path to summary report
  };
  
  summary: {
    project_name: string;
    execution_date: string;
    total_duration_ms: number;
    status: "success" | "partial" | "failed";
    phases_completed: number;
    
    metrics: {
      features_parsed: number;
      diagrams_generated: number;
      validation_score: number;
      figma_frames_created: number;
    };
  };
  
  metadata: {
    delivered_at: string;
    package_size_bytes: number;
    checksum: string;
  };
}
```

---

## Programmatic Usage

### Node.js API

```javascript
const { OmniArchitect } = require('omni-architect');

const orchestrator = new OmniArchitect({
  projectName: 'My Project',
  figmaFileKey: 'abc123',
  figmaAccessToken: process.env.FIGMA_ACCESS_TOKEN,
  validationThreshold: 0.85,
  diagramTypes: ['flowchart', 'sequence', 'erDiagram']
});

// Run complete pipeline
const result = await orchestrator.run({
  prdSource: './docs/prd.md'
});

console.log(result.summary);
console.log(result.figma_assets.file_url);

// Run individual phases
const parsed = await orchestrator.parsePRD('./docs/prd.md');
const diagrams = await orchestrator.generateDiagrams(parsed);
const report = await orchestrator.validateLogic(parsed, diagrams);

if (report.status === 'approved') {
  const assets = await orchestrator.generateFigma(diagrams);
  const delivery = await orchestrator.deliverAssets(/* all outputs */);
}
```

### CLI API

```bash
# Full pipeline
skills run omni-architect \
  --prd_source "./docs/prd.md" \
  --project_name "My Project" \
  --figma_file_key "abc123" \
  --figma_access_token "$FIGMA_TOKEN"

# With config file
skills run omni-architect --config .omni-architect.yml

# Individual phases
skills run omni-architect:prd-parse --input prd.md --output parsed.json
skills run omni-architect:mermaid-gen --input parsed.json --output diagrams/
skills run omni-architect:logic-validate --input diagrams/ --threshold 0.90
skills run omni-architect:figma-gen --input diagrams/ --file-key abc123
skills run omni-architect:asset-deliver --input-dir ./work/ --output delivery.zip
```

---

## Error Codes

| Code | Phase | Description |
|------|-------|-------------|
| `E001` | PRD Parse | Invalid PRD format |
| `E002` | PRD Parse | Missing required sections |
| `E003` | Mermaid Gen | Diagram generation failed |
| `E004` | Mermaid Gen | Invalid diagram syntax |
| `E005` | Logic Validate | Validation threshold not met |
| `E006` | Logic Validate | Critical validation errors |
| `E007` | Figma Gen | Figma API authentication failed |
| `E008` | Figma Gen | Invalid file key |
| `E009` | Figma Gen | Rate limit exceeded |
| `E010` | Asset Deliver | Output directory not writable |
| `E999` | General | Unexpected error |

---

## Webhooks (Future)

```typescript
// POST to configured webhook URL on phase completion
{
  event: "phase_completed" | "phase_failed" | "pipeline_completed";
  phase: string;
  timestamp: string;
  data: any;
}
```

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Maintainer**: [@fabioeloi](https://github.com/fabioeloi)
