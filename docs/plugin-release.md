# Release do Plugin

## Objetivo

Preparar um pacote publicável do plugin e gerar um checklist operacional para publish/update no Figma.

## Comando

```bash
npm run plugin:release:prepare
```

## Saída

```text
output/plugin-release/<version>/
├── figma-plugin/
│   ├── manifest.json
│   ├── code.js
│   └── ui.html
├── checksums.json
└── PUBLISH-CHECKLIST.md
```

## O que é validado

- presença de `name`, `id`, `api`, `main` e `ui` no `manifest.json`
- cópia dos arquivos do plugin para um diretório versionado
- geração de checksums SHA-256
- checklist manual para publicação

## Passo manual depois do prepare

1. abra o Figma Desktop com a conta do plugin
2. revise o conteúdo de `output/plugin-release/<version>/figma-plugin`
3. publique ou atualize o plugin
4. confirme o nome usado em `FIGMA_E2E_PLUGIN_NAME`
5. rode o smoke `npm run e2e:figma`
