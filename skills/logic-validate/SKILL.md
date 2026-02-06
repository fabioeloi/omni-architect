---
id: logic-validate
name: Logic Validator
description: >
  Valida a coerência dos diagramas Mermaid gerados contra o PRD original.
  Calcula score ponderado em 6 critérios e gera relatório detalhado.
  Sub-skill do pipeline Omni Architect (Phase 3).
author: fabioeloi
version: 1.0.0
tags: [validation, coherence, quality, scoring]
inputs:
  - name: parsed_prd
    type: object
    required: true
    description: PRD parseado (output de prd-parse).
  - name: diagrams
    type: array
    required: true
    description: Diagramas gerados (output de mermaid-gen).
  - name: validation_mode
    type: string
    required: false
    default: "interactive"
  - name: validation_threshold
    type: number
    required: false
    default: 0.85
outputs:
  - name: validation_report
    type: object
    description: Relatório com score, status, breakdown, warnings, suggestions.
---

# Logic Validator

## Critérios (peso)

| Critério | Peso | Verificação |
|----------|------|-------------|
| coverage | 0.25 | Cada feature/story mapeada em >= 1 diagrama |
| consistency | 0.25 | Mesma entidade = mesmos atributos em todos diagramas |
| completeness | 0.20 | Happy path + sad path presentes |
| traceability | 0.15 | Todo nó Mermaid rastreável a um ID do PRD |
| naming_coherence | 0.10 | Nomenclatura consistente (sem aliases conflitantes) |
| dependency_integrity | 0.05 | Ordem de dependências respeitada nos fluxos |

## Modos de Validação

- **interactive**: apresenta cada diagrama + score, aguarda approve/reject/modify
- **batch**: apresenta tudo, aguarda approve_all/reject_all/select
- **auto**: aprova se score >= threshold, rejeita caso contrário