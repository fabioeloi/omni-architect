---
id: mermaid-gen
name: Mermaid Generator
description: >
  Gera diagramas Mermaid automaticamente a partir de um PRD parseado.
  Suporta flowchart, sequence, ER, state, C4, journey e gantt.
  Sub-skill do pipeline Omni Architect (Phase 2).
author: fabioeloi
version: 1.0.0
tags: [mermaid, diagrams, generation, visualization]
inputs:
  - name: parsed_prd
    type: object
    required: true
    description: PRD parseado (output de prd-parse).
  - name: diagram_types
    type: array
    required: false
    default: ["flowchart", "sequence", "erDiagram"]
    description: Tipos de diagramas a gerar.
  - name: locale
    type: string
    required: false
    default: "pt-BR"
    description: Idioma dos labels.
outputs:
  - name: diagrams
    type: array
    description: Array de objetos {type, code, coverage_pct, source_features}.
---

# Mermaid Generator

## Mapeamento

| Elemento PRD | Tipo Mermaid | Condição |
|-------------|-------------|----------|
| flows | flowchart TD | Sempre que existirem fluxos |
| user_stories + entities | sequenceDiagram | Quando houver interações ator-sistema |
| entities + relationships | erDiagram | Quando houver >= 2 entidades |
| features com estados | stateDiagram-v2 | Quando features tiverem lifecycle |
| system overview | C4Context | Quando PRD mencionar sistemas externos |
| personas + journeys | journey | Quando personas estiverem definidas |

## Regras

- Validar sintaxe Mermaid antes de emitir (parser check)
- Labels no idioma do locale configurado
- Máximo 50 nós por diagrama; se exceder, auto-split com diagrama índice
- Referenciar IDs de features/stories como comentários no código Mermaid