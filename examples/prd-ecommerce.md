# PRD: E-Commerce Platform v2

## Visão Geral

Plataforma de e-commerce B2C focada em experiência mobile-first com checkout
em 3 passos e suporte a múltiplos métodos de pagamento.

## Personas

### Comprador (Maria)
- 28 anos, compra pelo celular
- Quer rapidez e segurança
- Usa PIX como método principal

### Vendedor (João)
- 35 anos, pequeno empresário
- Precisa de dashboard de vendas
- Quer gestão de estoque simples

## Features

### F001: Autenticação de Usuário
**Prioridade**: Alta | **Complexidade**: Média

#### User Stories
- Como **comprador**, quero **fazer login com email e senha**, para **acessar minha conta**
- Como **comprador**, quero **fazer login com Google/Apple**, para **entrar mais rápido**
- Como **comprador**, quero **recuperar minha senha**, para **não perder acesso**

#### Critérios de Aceite
- [ ] Login com email/senha com validação
- [ ] OAuth com Google e Apple
- [ ] Recuperação de senha por email
- [ ] JWT com refresh token

### F002: Catálogo de Produtos
**Prioridade**: Alta | **Complexidade**: Alta
**Dependências**: F001

#### User Stories
- Como **comprador**, quero **buscar produtos por nome**, para **encontrar o que preciso**
- Como **comprador**, quero **filtrar por categoria e preço**, para **refinar resultados**
- Como **comprador**, quero **ver detalhes do produto**, para **decidir a compra**

### F003: Checkout
**Prioridade**: Alta | **Complexidade**: Alta
**Dependências**: F001, F002

#### User Stories
- Como **comprador**, quero **finalizar minha compra em até 3 passos**, para **ter experiência rápida**

#### Fluxo
1. Revisar carrinho
2. Selecionar/cadastrar endereço
3. Calcular frete (Correios API)
4. Selecionar pagamento (PIX, Cartão, Boleto)
5. Confirmar pedido
6. Receber email de confirmação

#### Critérios de Aceite
- [ ] Máximo 3 passos no checkout
- [ ] Cálculo de frete em tempo real
- [ ] Suporte a PIX, cartão e boleto
- [ ] Email de confirmação automático

## Entidades

| Entidade | Atributos |
|----------|-----------|
| User | id, email, name, role, created_at |
| Product | id, name, price, stock, category_id, description |
| Order | id, user_id, status, total, created_at |
| OrderItem | id, order_id, product_id, quantity, unit_price |
| Category | id, name, slug, parent_id |
| Payment | id, order_id, method, status, amount |
| Shipping | id, order_id, carrier, tracking_code, estimated_delivery |

## Requisitos Não-Funcionais
- Performance: página carrega em < 2s (LCP)
- Segurança: HTTPS, dados sensíveis criptografados
- Disponibilidade: 99.9% uptime
- Escalabilidade: suportar 10k usuários simultâneos