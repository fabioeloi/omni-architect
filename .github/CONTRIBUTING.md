# Contributing

## Objetivo

Este repositório prioriza clareza de pipeline, rastreabilidade e evidência de funcionamento.

Se a sua mudança tocar o fluxo principal, trate como caminho crítico:

```text
run -> plugin/wrapper -> resume
```

## Setup

```bash
git clone https://github.com/fabioeloi/omni-architect.git
cd omni-architect
npm install
```

## Fluxo sugerido

```bash
git checkout -b feature/minha-feature
npm run lint
npm run validate
npm test
```

Se a mudança afetar documentação operacional, também valide os comandos descritos no README.

Se a mudança afetar browser flow ou plugin wrapper, prefira ainda:

```bash
npm run example
npm run harness
```

## Pull Requests

Inclua no PR:

- o problema que a mudança resolve
- o impacto no pipeline principal
- evidência de teste ou de execução do fluxo local
- atualização de documentação quando o comportamento público mudar

## Regras práticas

- não remova rastreabilidade do PRD para os diagramas
- não documente um fluxo diferente do que o repositório realmente executa
- mantenha `run`, `harness` e `resume` como caminhos centrais da experiência local
