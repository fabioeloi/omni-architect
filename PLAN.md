# Implementar Omni Architect para o PRD E-Commerce v2

## Resumo
- Transformar o repositório de especificação em um pacote Node/CJS funcional que processe o PRD de exemplo de ponta a ponta: fases 1-3 localmente e fase 4 com escrita real no Figma via plugin.
- Preservar o contrato público atual da skill, incluindo `figma_file_key` e `figma_access_token` como inputs obrigatórios, mesmo com a escrita do canvas feita pelo plugin.
- Entregar dois fluxos de uso: CLI e API programática, além de um exemplo funcional que gere os artefatos do PRD e o payload para o Figma.

## Mudanças de Implementação
- Adicionar uma engine de orquestração com carregamento de config, leitura de `prd_source` por caminho/local/raw markdown/URL, execução por fases, logs sanitizados e persistência de artefatos em `output/`.
- Expor um CLI com `run` e `resume`.
  `run` executa parsing, geração Mermaid, validação e preparação do payload Figma; grava `parsed-prd.json`, `diagrams/*.mmd`, `validation-report.json`, `figma/figma-payload.json`, `orchestration-log.json` e encerra com `status=awaiting_figma_import`.
  `resume` recebe o manifesto exportado pelo plugin e conclui a fase 5, gerando `figma-assets.json` e `HANDOFF.md`.
- Expor uma API programática com `run(options)` e `resumeFigma({ sessionDir, figmaResultPath })`; em `interactive` e `batch`, a API exige callbacks de revisão e falha com erro de configuração se eles não forem fornecidos.
- Implementar a fase 1 com parsing determinístico de headings, listas e tabelas para extrair projeto, personas, features, dependências, user stories, fluxos, critérios de aceite, entidades e requisitos não-funcionais; gerar IDs estáveis para stories/flows ausentes e score de completude com warnings sem bloquear o pipeline.
- Implementar a fase 2 com templates Mermaid rastreáveis por comentários de origem. Para o PRD e-commerce v2, a v1 deve gerar: flowchart de checkout, sequence diagrams de autenticação e checkout, ER diagram de domínio, journey da persona compradora e C4 context; `stateDiagram` deve ser pulado com warning explícito por falta de lifecycle definido no PRD.
- Validar Mermaid antes de persistir usando o parser/runtime oficial do Mermaid, com até 3 tentativas de auto-reparo em erro sintático; padronizar o auto-split em 50 nós por diagrama e gerar diagrama índice quando houver split.
- Implementar a fase 3 calculando exatamente os 6 critérios documentados (`coverage`, `consistency`, `completeness`, `traceability`, `naming_coherence`, `dependency_integrity`) e suportando `auto`, `interactive` e `batch`; rejeições devem regenerar só o tipo de diagrama afetado.
- Implementar a fase 4 como plugin real do Figma em JavaScript simples, com import do `figma-payload.json` e criação/atualização das páginas `Index`, `User Flows`, `Interaction Specs`, `Data Model`, `Architecture`, `User Journeys` e `Component Library` sob o namespace `{project_name} - Omni Architect`.
- Marcar todo conteúdo criado pelo plugin como “managed”; em reexecuções, substituir apenas nós gerenciados e preservar trabalho manual fora desse escopo.
- Fazer o plugin exportar um manifesto com `node_id`, nome, tipo, página e deep link; o `resume` incorpora esse manifesto ao pacote final.
- Implementar hooks `on_validation_approved`, `on_figma_complete` e `on_error`; falhas de hook entram como warning no log e não apagam saídas já geradas.
- Corrigir a superfície prometida pelo pacote atual: scripts de exemplo e testes funcionando, além de atualização da documentação para refletir o fluxo real `run -> import plugin -> resume`.

## Interfaces Públicas
- CLI:
  `omni-architect run --prd_source ... --project_name ... --figma_file_key ... --figma_access_token ...`
  `omni-architect resume --session_dir ./output --figma_result ./figma-import-result.json`
- API:
  `run(options)` retorna artefatos parciais, paths e `status`.
  `resumeFigma({ sessionDir, figmaResultPath })` conclui o pacote final após a importação no Figma.
- Contrato do plugin:
  entrada = `figma-payload.json`
  saída = manifesto JSON consumido pelo `resume`

## Testes
- Parser: o PRD e-commerce deve produzir 3 features, dependências corretas, entidades esperadas, fluxo de checkout e score de completude em faixa aprovada.
- Mermaid: todos os diagramas esperados da v1 são gerados com comentários de rastreabilidade e passam na validação; `stateDiagram` é pulado de forma determinística.
- Validação: fixture principal deve resultar em `approved`; fixtures com cobertura baixa devem cair abaixo do threshold; `interactive` e `batch` devem respeitar decisões do revisor.
- CLI: `run` cria o pacote pendente; `resume` consome um manifesto fixture do plugin e fecha `figma-assets.json` e `HANDOFF.md`.
- Plugin: importar o payload de exemplo deve criar a árvore de páginas esperada; reexecutar deve atualizar só conteúdo “managed”; o manifesto exportado deve ser estável.
- Segurança e resiliência: redaction de secrets no log, erro claro para config inválida, retry de Mermaid limitado a 3, hooks sem efeito destrutivo e backoff previsível em falhas externas.

## Premissas E Defaults
- Base técnica: Node 18+, CommonJS, dependências mínimas, uso preferencial de `fetch` e `node:test`.
- `pt-BR` continua como locale default e `material-3` como design system default.
- O PRD e-commerce de exemplo vira o fixture de integração principal do repositório.
- A escrita real no Figma será plugin-based porque a documentação oficial atual separa mutação de documento na Plugin API e o uso externo na REST API: https://developers.figma.com/docs/plugins/api/api-reference/ , https://developers.figma.com/docs/rest-api/ , https://developers.figma.com/compare-apis
- `figma_access_token` permanece obrigatório por compatibilidade com a spec atual, mas não será usado para mutação do canvas nesta v1 plugin-based; ele só entra em validação de contrato, metadata futura e nunca em logs sem redaction.
