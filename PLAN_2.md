# Playwright Browser Context, E2E Real de Figma e Guia Leigo

## Resumo
- Expandir o projeto com uma camada de browser baseada em Playwright para validar assets gerados no navegador, não só via testes em memória.
- Cobrir o fluxo completo do PRD de exemplo com e2e em dois níveis: e2e local determinístico para Mermaid + plugin/harness, e smoke e2e no Figma web com sessão autenticada e plugin já publicado/instalado no workspace de teste.
- Reescrever a documentação em pt-BR para dois públicos: técnico e leigo, incluindo um passo a passo validado do PRD de exemplo até o pacote final e os assets no Figma.

## Mudanças de Implementação
- Adicionar Playwright ao repositório com uma browser layer reutilizável para contexto, storage state, screenshots, downloads e tracing; essa camada deve ser usada tanto pelos testes e2e quanto por scripts de bootstrap/documentação.
- Criar um harness web local que:
  - renderize todos os `.mmd` gerados com Mermaid no browser para validação visual real;
  - hospede a UI do plugin e um wrapper de import/export para validar o fluxo de `figma-payload.json` sem depender do Figma real;
  - grave artifacts em `output/playwright/`.
- Introduzir scripts públicos para:
  - bootstrap de autenticação Figma via Playwright em modo headed, salvando storage state local;
  - execução e2e local completa do PRD de exemplo;
  - execução e2e Mermaid-only;
  - execução e2e Figma web real;
  - preparo de release do plugin.
- Manter o pipeline atual `run -> payload -> plugin -> resume`, mas adicionar uma rota de validação browser que:
  - roda o exemplo;
  - renderiza/inspeciona todos os Mermaid assets no harness;
  - exercita import/export do plugin no harness;
  - usa o mesmo payload para o smoke real no Figma web.
- Planejar o e2e real de Figma assumindo:
  - plugin já publicado ou previamente instalado no workspace de teste;
  - arquivo Figma de teste dedicado;
  - execução local autenticada, não obrigatória em CI.
- Preparar a release do plugin no repo com bundle/manifest/versionamento/checklist e validar esse artefato no fluxo; a publicação/submissão em si continua como passo manual validado no Figma Desktop, não como automação total.
- Atualizar a documentação em duas trilhas:
  - técnica: arquitetura browser/e2e, bootstrap auth, variáveis, scripts, troubleshooting e limites do Figma real;
  - leiga: pré-requisitos, como abrir o exemplo, rodar o comando, importar no plugin, finalizar, verificar o resultado e resolver erros comuns.
- Incluir screenshots reais capturadas via Playwright no passo a passo leigo, usando sempre o PRD `examples/prd-ecommerce.md` como fluxo canônico validado.

## Interfaces Públicas
- Novos scripts npm:
  - `e2e` para o fluxo local completo do exemplo;
  - `e2e:mermaid` para validar renderização browser dos diagramas;
  - `e2e:figma` para smoke no Figma web com storage state;
  - `e2e:figma:bootstrap` para capturar sessão autenticada;
  - `plugin:release:prepare` para gerar artefato e checklist de publicação.
- Novos inputs operacionais:
  - URL do arquivo Figma de teste;
  - nome/id do plugin publicado no workspace;
  - path do storage state Playwright;
  - diretório de artifacts do browser.
- O contrato principal do pipeline não muda; o plano adiciona validação browser/e2e e release prep ao redor dele.

## Testes e Cenários
- E2E local do exemplo:
  - roda `run` com o PRD e-commerce;
  - valida a criação dos JSONs e `.mmd`;
  - renderiza todos os Mermaid gerados no browser e captura screenshot por asset;
  - valida o import/export do plugin no harness e fecha com `resume`.
- E2E Figma web real:
  - abre o arquivo de teste com storage state já autenticado;
  - invoca o plugin publicado/instalado;
  - importa o payload do exemplo;
  - verifica criação/atualização das páginas e frames esperados;
  - exporta ou captura evidência suficiente para fechar o `resume`.
- Testes de release prep:
  - manifest, versionamento, assets do plugin e checklist de publicação;
  - falha clara se faltar plugin id, arquivo Figma de teste, storage state ou plugin instalado.
- Validação de documentação:
  - seguir o guia leigo do zero em ambiente limpo até obter os outputs do exemplo;
  - confirmar que os comandos, paths e screenshots batem com o comportamento real.

## Assumptions e Defaults
- O browser context será implementado com `@playwright/test`, apesar do fluxo CLI-first da skill de Playwright, porque aqui o pedido explícito é por suíte e2e persistente no repositório.
- O smoke real no Figma web assume plugin já publicado/instalado no workspace de teste; o plano não depende de carregar plugin local no browser.
- “Automatizar release” será tratado como automação de preparo de release e checklist de publicação, não como submissão fully automated ao ecossistema Figma.
- O e2e real de Figma será local-only na v1; o harness local e os e2e Mermaid devem ficar aptos a rodar em CI.
- Restrições oficiais que motivam isso:
  - Plugin local/dev exige desktop app no fluxo oficial: https://developers.figma.com/docs/plugins/plugin-quickstart-guide/
  - Manifest/id/network access precisam estar corretos para distribuição e uso: https://developers.figma.com/docs/plugins/manifest/
  - UI do plugin e mensageria seguem o modelo `showUI`/`postMessage`: https://developers.figma.com/docs/plugins/creating-ui/
