# Guia Leigo: do PRD ao Pacote Final

Este guia foi validado com o PRD [`examples/prd-ecommerce.md`](../examples/prd-ecommerce.md) e com o harness local do projeto.

## Antes de começar

Você precisa de:

- Node.js 18 ou superior
- `npm`
- terminal aberto na raiz do projeto

Instale as dependências:

```bash
npm install
```

## Resultado esperado

No fim do processo você terá:

- diagramas Mermaid renderizados no browser
- um manifesto de assets do Figma
- `figma-assets.json`
- `HANDOFF.md` consolidado

## Passo 1: gerar os arquivos do PRD

Na raiz do projeto, rode:

```bash
npm run example
```

Esse comando usa o PRD de exemplo e cria a pasta `output/example`.

## Passo 2: abrir o preview local

Em outro terminal, rode:

```bash
npm run harness
```

Você verá algo como:

```text
Harness disponível em http://127.0.0.1:4173
Output monitorado: .../output/example
```

Abra o navegador em `http://127.0.0.1:4173/mermaid`.

Você deve ver 6 diagramas renderizados.

![Preview Mermaid](./assets/example-mermaid-preview.png)

## Passo 3: importar o payload sem usar o Figma real

Abra `http://127.0.0.1:4173/plugin-wrapper`.

Faça exatamente isto:

1. clique em `Carregar payload do exemplo`
2. espere o status mudar para `Payload carregado na UI do plugin`
3. clique em `Importar no Figma`
4. confirme que o status mudou para `Import concluído`

Você verá o manifesto e a árvore de páginas montada pelo wrapper.

![Wrapper do Plugin](./assets/example-plugin-wrapper.png)

## Passo 4: finalizar o pacote

O wrapper local não executa o `resume` sozinho. Para fechar o pacote, rode:

```bash
npx omni-architect resume \
  --session_dir ./output/example \
  --figma_result ./output/playwright/local-flow/figma-import-result.json \
  --prd_source ./examples/prd-ecommerce.md \
  --project_name "E-Commerce Platform" \
  --figma_file_key EXAMPLE_FILE_KEY \
  --figma_access_token EXAMPLE_TOKEN
```

Se você estiver usando o plugin no Figma real, troque `--figma_result` pelo arquivo exportado pelo plugin.

## Passo 5: conferir o resultado final

Abra `http://127.0.0.1:4173/summary`.

Você deve ver:

- `Validation`: `approved`
- `Diagramas`: `6`
- `Figma Assets`: `6`

![Resumo Final](./assets/example-summary.png)

E na pasta `output/example` você deve encontrar:

```text
figma-assets.json
figma-import-result.json
HANDOFF.md
```

## Erros comuns

### O comando `npm run example` falhou

Confira se você está na raiz do projeto e se `npm install` já foi executado.

### O navegador abre, mas a página `/mermaid` fica vazia

Espere alguns segundos. O render do Mermaid é feito no browser e pode demorar mais nos primeiros carregamentos.

### O wrapper do plugin não mostra manifesto

Confirme se você clicou primeiro em `Carregar payload do exemplo` e depois em `Importar no Figma`.

### O `resume` falha dizendo que faltou `figma_result`

O caminho passado em `--figma_result` precisa apontar para um JSON de manifesto válido.

## Quando usar o Figma real

Use o Figma real quando você quiser:

- importar o payload em um arquivo de design verdadeiro
- obter links reais de nodes
- validar o plugin em um workspace do Figma

Para isso, siga depois o guia técnico em [Guia Técnico de Browser e E2E](./e2e-playwright.md).
