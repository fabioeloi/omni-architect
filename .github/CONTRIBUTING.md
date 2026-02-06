# Contribuindo para o Omni Architect

Obrigado por considerar contribuir com o Omni Architect! 🎉

## Código de Conduta

Este projeto segue o [Código de Conduta do Contributor Covenant](./CODE_OF_CONDUCT.md). Ao participar, espera-se que você siga este código.

## Como Contribuir

### Reportando Bugs

Se você encontrou um bug, por favor:

1. **Verifique se o bug já foi reportado** nas [Issues](https://github.com/fabioeloi/omni-architect/issues)
2. Se não encontrou, [abra uma nova issue](https://github.com/fabioeloi/omni-architect/issues/new/choose) usando o template de bug report
3. Inclua o máximo de detalhes possível:
   - Fase do pipeline onde o erro ocorreu
   - Mensagem de erro completa
   - Versão do Node.js e do Omni Architect
   - Trecho do PRD (se relevante)
   - Passos para reproduzir

### Sugerindo Melhorias

Tem uma ideia para melhorar o Omni Architect?

1. **Verifique se a sugestão já foi feita** nas [Issues](https://github.com/fabioeloi/omni-architect/issues) ou [Discussions](https://github.com/fabioeloi/omni-architect/discussions)
2. [Abra uma issue de feature request](https://github.com/fabioeloi/omni-architect/issues/new/choose)
3. Descreva claramente:
   - O problema que a feature resolve
   - Como a feature funcionaria
   - Exemplos de uso

### Pull Requests

1. **Fork** o repositório
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/SEU_USER/omni-architect.git
   cd omni-architect
   ```
3. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/minha-feature
   ```
4. **Instale as dependências**:
   ```bash
   npm install
   ```
5. **Faça suas alterações**
   - Siga o estilo de código existente
   - Adicione testes se aplicável
   - Atualize a documentação se necessário
6. **Teste suas alterações**:
   ```bash
   npm test
   ```
7. **Commit suas alterações** usando [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: adiciona suporte para diagramas de classe"
   git commit -m "fix: corrige validação de PRD com caracteres especiais"
   git commit -m "docs: atualiza exemplos de configuração"
   ```
8. **Push para seu fork**:
   ```bash
   git push origin feature/minha-feature
   ```
9. **Abra um Pull Request** no repositório original

### Padrão de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para commits semânticos:

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Apenas documentação
- `style:` Formatação, ponto e vírgula faltando, etc
- `refactor:` Refatoração de código
- `perf:` Melhoria de performance
- `test:` Adição ou correção de testes
- `chore:` Tarefas de manutenção

Exemplos:
```
feat(mermaid-gen): adiciona suporte para diagramas de classe
fix(prd-parse): corrige parsing de listas aninhadas
docs(readme): atualiza instruções de instalação
```

## Estrutura do Projeto

```
omni-architect/
├── skills/               # Sub-skills do pipeline
│   ├── prd-parse/       # Fase 1: Parser de PRD
│   ├── mermaid-gen/     # Fase 2: Gerador de Mermaid
│   ├── logic-validate/  # Fase 3: Validador lógico
│   ├── figma-gen/       # Fase 4: Gerador de Figma
│   └── asset-deliver/   # Fase 5: Entrega de assets
├── examples/            # Exemplos de uso
├── docs/                # Documentação detalhada
├── tests/               # Testes automatizados
├── SKILL.md            # Especificação da skill
└── README.md           # Documentação principal
```

## Desenvolvimento por Fase

Se você está contribuindo para uma fase específica do pipeline:

### Phase 1: PRD Parser
- Arquivo: `skills/prd-parse/SKILL.md`
- Teste: `tests/test-prd-parse.js`
- Foco: Extração semântica de features, stories, entidades

### Phase 2: Mermaid Generator
- Arquivo: `skills/mermaid-gen/SKILL.md`
- Teste: `tests/test-mermaid-gen.js`
- Foco: Geração de diagramas válidos e coerentes

### Phase 3: Logic Validator
- Arquivo: `skills/logic-validate/SKILL.md`
- Teste: `tests/test-logic-validate.js`
- Foco: Critérios de validação e scoring

### Phase 4: Figma Generator
- Arquivo: `skills/figma-gen/SKILL.md`
- Teste: `tests/test-figma-gen.js`
- Foco: Integração com Figma API e geração de assets

### Phase 5: Asset Delivery
- Arquivo: `skills/asset-deliver/SKILL.md`
- Foco: Consolidação e empacotamento de deliverables

## Testes

Execute os testes antes de submeter um PR:

```bash
# Todos os testes
npm test

# Teste específico
npm test -- tests/test-prd-parse.js

# Com cobertura
npm run test:coverage
```

## Documentação

Se sua contribuição adiciona novas features ou altera comportamento:

1. Atualize o `README.md`
2. Atualize o `SKILL.md` com novos inputs/outputs
3. Adicione exemplos em `examples/`
4. Atualize a documentação em `docs/`

## Estilo de Código

- Use **2 espaços** para indentação
- Nomes de variáveis em **camelCase**
- Nomes de constantes em **UPPER_SNAKE_CASE**
- Comentários em **português** para documentação interna
- Documentação de API em **inglês** quando aplicável

## Review Process

1. Todos os PRs passam por code review
2. CI deve estar verde (testes, lint)
3. Pelo menos 1 aprovação necessária
4. Mantainer fará merge após aprovação

## Dúvidas?

- 💬 [Discussions](https://github.com/fabioeloi/omni-architect/discussions)
- 📧 Email: [fabioeloi@example.com]
- 🐛 [Issues](https://github.com/fabioeloi/omni-architect/issues)

---

**Obrigado por contribuir! 🚀**
