---
id: prd-parse
name: PRD Parser
description: >
  Extrai estrutura semântica de um PRD Markdown, identificando features,
  user stories, entidades de domínio, fluxos de negócio e critérios de aceite.
  Sub-skill do pipeline Omni Architect (Phase 1).
author: fabioeloi
version: 1.0.0
tags: [prd, parser, semantic, extraction]
inputs:
  - name: prd_content
    type: string
    required: true
    description: Conteúdo completo do PRD em Markdown.
outputs:
  - name: parsed_prd
    type: object
    description: Estrutura semântica com features, stories, entities, flows.
  - name: completeness_score
    type: number
    description: Score de completude do PRD (0.0 - 1.0).
---

# PRD Parser

## Instruções

1. Tokenizar o PRD por heading levels (H1, H2, H3)
2. Classificar cada seção por tipo semântico (feature, story, requirement, entity, flow)
3. Extrair entidades nomeadas (NER) para identificar domínio
4. Mapear relacionamentos entre entidades
5. Calcular grafo de dependências entre features
6. Computar score de completude
7. Emitir warnings se score < 0.6 com sugestões de melhoria

## Heurísticas de Classificação

| Padrão no texto | Classificação |
|-----------------|---------------|
| "Como [persona], quero..." | User Story |
| "Requisito:", "Deve..." | Requisito Funcional |
| "Performance:", "Segurança:" | Requisito Não-Funcional |
| Tabelas com atributos | Entidade de Domínio |
| "Fluxo:", listas numeradas de passos | Fluxo de Negócio |
| "Critério de aceite", checkboxes | Acceptance Criteria |