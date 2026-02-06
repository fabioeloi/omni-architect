## Descrição da Mudança
<!-- Descreva o que esta PR faz e por quê -->

Closes #(issue)

## Tipo de Mudança
<!-- Marque as opções relevantes -->

- [ ] 🐛 Bug fix (mudança que corrige um problema)
- [ ] ✨ Nova feature (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (fix ou feature que causa mudança no comportamento existente)
- [ ] 📝 Documentação (mudanças apenas em documentação)
- [ ] ♻️ Refactoring (mudança que não adiciona feature nem corrige bug)
- [ ] ⚡ Performance (mudança que melhora performance)
- [ ] ✅ Testes (adição ou correção de testes)

## Fase Afetada
<!-- Marque as fases do pipeline afetadas por esta mudança -->

- [ ] Phase 1: PRD Parser
- [ ] Phase 2: Mermaid Generator
- [ ] Phase 3: Logic Validator
- [ ] Phase 4: Figma Generator
- [ ] Phase 5: Asset Delivery
- [ ] Orquestração geral
- [ ] Documentação
- [ ] Infraestrutura (CI/CD, etc)

## Checklist
<!-- Verifique cada item antes de submeter -->

### Geral
- [ ] Meu código segue o estilo do projeto
- [ ] Revisei meu próprio código
- [ ] Comentei áreas complexas quando necessário
- [ ] Minhas mudanças não geram novos warnings
- [ ] Os commits seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/)

### Testes
- [ ] Adicionei testes que provam que minha correção/feature funciona
- [ ] Testes unitários novos e existentes passam localmente
- [ ] Validei o pipeline completo end-to-end (se aplicável)

### Documentação
- [ ] Atualizei o README.md (se necessário)
- [ ] Atualizei o SKILL.md com novos inputs/outputs (se aplicável)
- [ ] Adicionei exemplos em `examples/` (se aplicável)
- [ ] Atualizei docs em `docs/` (se aplicável)
- [ ] Atualizei o CHANGELOG.md

### Por Fase (se aplicável)

#### Phase 1: PRD Parser
- [ ] Parsing funciona com formatos diversos de PRD
- [ ] Output JSON está conforme schema esperado
- [ ] Edge cases tratados (PRD malformado, campos faltando, etc)

#### Phase 2: Mermaid Generator
- [ ] Diagramas gerados são válidos sintaticamente
- [ ] Mapeamento PRD → Diagrama está correto
- [ ] Suporta todos os tipos de diagrama configurados
- [ ] Nomenclatura está consistente e legível

#### Phase 3: Logic Validator
- [ ] Critérios de validação implementados corretamente
- [ ] Scoring reflete real qualidade da lógica
- [ ] Relatório de validação está completo e útil
- [ ] Threshold funciona conforme esperado

#### Phase 4: Figma Generator
- [ ] Assets são criados corretamente no Figma
- [ ] Estrutura de páginas e frames está organizada
- [ ] Design tokens são aplicados
- [ ] Permissões de API estão corretas

#### Phase 5: Asset Delivery
- [ ] Todos os artefatos são consolidados
- [ ] Estrutura de output está correta
- [ ] Metadados de entrega estão completos

## Como Testar

```bash
# Comandos para testar esta mudança
npm install
npm test

# Se aplicável, teste end-to-end
skills run omni-architect --prd_source examples/prd-ecommerce.md --project_name "Test" --figma_file_key "..." --figma_access_token "..."
```

## Screenshots/Logs
<!-- Se aplicável, adicione screenshots ou logs que demonstrem a mudança -->

## Notas Adicionais
<!-- Qualquer contexto adicional sobre a PR -->
