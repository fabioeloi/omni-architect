# Arquitetura

## Pipeline

O pipeline é dividido em 5 fases:

1. parsing do PRD
2. geração de diagramas Mermaid
3. validação lógica
4. preparação/importação no Figma
5. entrega consolidada

## Módulos principais

- [`lib/orchestrator.js`](../lib/orchestrator.js): coordena `run` e `resume`
- [`lib/config.js`](../lib/config.js): resolve config, env e defaults
- [`lib/phases/parse-prd.js`](../lib/phases/parse-prd.js): parsing determinístico
- [`lib/phases/generate-diagrams.js`](../lib/phases/generate-diagrams.js): Mermaid por template
- [`lib/phases/validate-diagrams.js`](../lib/phases/validate-diagrams.js): score e status
- [`lib/phases/prepare-figma.js`](../lib/phases/prepare-figma.js): payload para o plugin
- [`lib/phases/deliver-assets.js`](../lib/phases/deliver-assets.js): `HANDOFF`, `figma-assets`, session files
- [`figma-plugin/code.js`](../figma-plugin/code.js): aplicação do payload em páginas/nodes gerenciados
- [`figma-plugin/ui.html`](../figma-plugin/ui.html): UI de import/export
- [`lib/browser/harness-server.js`](../lib/browser/harness-server.js): preview local

## Fluxo de dados

### `run`

```text
PRD markdown
  -> parsed-prd.json
  -> diagrams/*.mmd
  -> validation-report.json
  -> figma/figma-payload.json
  -> session-state.json
```

### `resume`

```text
figma-import-result.json
  -> figma-assets.json
  -> HANDOFF.md
  -> orchestration-log.json
```

## Browser validation

O harness local usa:

- preview Mermaid em browser real
- wrapper local da UI do plugin
- resumo da sessão atual

Isso permite validar o fluxo sem depender do Figma real em todos os cenários.
