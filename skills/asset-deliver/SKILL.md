---
id: asset-deliver
name: Asset Delivery
description: >
  Consolida todos os outputs do pipeline em um pacote de entrega estruturado.
  Gera documentação de handoff e log de orquestração.
  Sub-skill do pipeline Omni Architect (Phase 5).
author: fabioeloi
version: 1.0.0
tags: [delivery, packaging, handoff, documentation]
inputs:
  - name: parsed_prd
    type: object
    required: true
  - name: diagrams
    type: array
    required: true
  - name: validation_report
    type: object
    required: true
  - name: figma_assets
    type: array
    required: true
outputs:
  - name: delivery_package
    type: object
    description: Pacote com todos artefatos, logs e documentação de handoff.
---

# Asset Delivery

## Artefatos Gerados

| Artefato | Formato | Localização |
|----------|---------|-------------|
| PRD Parseado | JSON | `output/parsed-prd.json` |
| Diagramas Mermaid | .mmd + .svg | `output/diagrams/` |
| Relatório de Validação | JSON + MD | `output/validation/` |
| Figma Assets (links) | JSON | `output/figma-assets.json` |
| Orchestration Log | JSON | `output/orchestration-log.json` |
| Design Handoff Doc | Markdown | `output/HANDOFF.md` |

## Sanitização

- Tokens e secrets são removidos do log
- Informações sensíveis substituídas por `[REDACTED]`