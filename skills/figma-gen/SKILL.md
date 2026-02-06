---
id: figma-gen
name: Figma Generator
description: >
  Gera assets de design no Figma a partir dos diagramas Mermaid validados.
  Cria frames, componentes e flows organizados por tipo de diagrama.
  Sub-skill do pipeline Omni Architect (Phase 4).
author: fabioeloi
version: 1.0.0
tags: [figma, design, assets, generation, ui]
inputs:
  - name: diagrams
    type: array
    required: true
    description: Diagramas validados (output de logic-validate com status=approved).
  - name: figma_file_key
    type: string
    required: true
  - name: figma_access_token
    type: string
    required: true
  - name: design_system
    type: string
    required: false
    default: "material-3"
  - name: project_name
    type: string
    required: true
outputs:
  - name: figma_assets
    type: array
    description: Array de {node_id, type, name, preview_url, figma_url}.
---

# Figma Generator

## Processo

1. Conectar à API Figma (REST API v1)
2. Criar/localizar página no arquivo
3. Para cada diagrama: criar Frame com auto-layout
4. Mapear nós Mermaid → componentes Figma
5. Aplicar design tokens (cores, tipografia, spacing)
6. Criar conexões visuais (arrows, lines)
7. Gerar variantes responsivas se aplicável
8. Adicionar anotações de dev
9. Criar página de índice com links

## Rate Limiting

- Exponential backoff: 1s, 2s, 4s, 8s (max 5 retries)
- Batch creation para minimizar chamadas API
- Cache de componentes já criados