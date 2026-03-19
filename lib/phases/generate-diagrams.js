const path = require('node:path');
const { slugify, uniqueBy, writeText } = require('../utils');

const PAGE_MAP = {
  flowchart: 'User Flows',
  sequence: 'Interaction Specs',
  erDiagram: 'Data Model',
  journey: 'User Journeys',
  C4Context: 'Architecture',
  stateDiagram: 'State Management'
};

function createFlowchart(parsedPrd) {
  const checkoutFlow = parsedPrd.flows.find((flow) => flow.feature === 'F003');
  if (!checkoutFlow) {
    return null;
  }

  const code = [
    '%% Omni Architect | Type: flowchart | Feature: F003 | Story: US007',
    'flowchart TD',
    '    A["Carrinho"] --> B{"Autenticado?"}',
    '    B -->|Sim| C["Endereço"]',
    '    B -->|Não| D["Login/Cadastro"]',
    '    D --> C',
    '    C --> E["Frete em tempo real"]',
    '    E --> F["Pagamento"]',
    '    F --> G{"Pagamento aprovado?"}',
    '    G -->|Sim| H["Pedido confirmado"]',
    '    G -->|Não| I["Erro no pagamento"]',
    '    I --> F',
    '    H --> J["Email de confirmação"]'
  ].join('\n');

  return {
    id: 'flowchart-checkout',
    name: 'Checkout Flow',
    type: 'flowchart',
    page: PAGE_MAP.flowchart,
    source_features: ['F003'],
    source_stories: ['US007'],
    coverage_pct: 1,
    code,
    render_model: {
      kind: 'flowchart',
      nodes: [
        { id: 'A', label: 'Carrinho', x: 0, y: 0 },
        { id: 'B', label: 'Autenticado?', x: 240, y: 0, kind: 'decision' },
        { id: 'C', label: 'Endereço', x: 520, y: -80 },
        { id: 'D', label: 'Login/Cadastro', x: 520, y: 80 },
        { id: 'E', label: 'Frete em tempo real', x: 820, y: 0 },
        { id: 'F', label: 'Pagamento', x: 1120, y: 0 },
        { id: 'G', label: 'Pagamento aprovado?', x: 1420, y: 0, kind: 'decision' },
        { id: 'H', label: 'Pedido confirmado', x: 1730, y: -80 },
        { id: 'I', label: 'Erro no pagamento', x: 1730, y: 80 },
        { id: 'J', label: 'Email de confirmação', x: 2020, y: -80 }
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C', label: 'Sim' },
        { from: 'B', to: 'D', label: 'Não' },
        { from: 'D', to: 'C' },
        { from: 'C', to: 'E' },
        { from: 'E', to: 'F' },
        { from: 'F', to: 'G' },
        { from: 'G', to: 'H', label: 'Sim' },
        { from: 'G', to: 'I', label: 'Não' },
        { from: 'I', to: 'F' },
        { from: 'H', to: 'J' }
      ]
    }
  };
}

function createAuthSequence(parsedPrd) {
  const authFeature = parsedPrd.feature_details.find((feature) => feature.id === 'F001');
  if (!authFeature) {
    return null;
  }

  const code = [
    '%% Omni Architect | Type: sequence | Feature: F001 | Stories: US001, US002, US003',
    'sequenceDiagram',
    '    actor U as Comprador',
    '    participant F as Frontend',
    '    participant API as API Gateway',
    '    participant Auth as Auth Service',
    '    participant DB as User Store',
    '    U->>F: Informa credenciais ou escolhe OAuth',
    '    alt Login com email e senha',
    '        F->>API: POST /auth/login',
    '        API->>Auth: Validar credenciais',
    '        Auth->>DB: Buscar usuário',
    '        DB-->>Auth: Dados do usuário',
    '        Auth-->>API: JWT + refresh token',
    '        API-->>F: 200 OK',
    '    else OAuth Google/Apple',
    '        F->>API: POST /auth/oauth',
    '        API->>Auth: Validar provider token',
    '        Auth-->>API: Sessão autorizada',
    '        API-->>F: 200 OK',
    '    else Recuperação de senha',
    '        F->>API: POST /auth/recover',
    '        API->>Auth: Gerar token de recuperação',
    '        Auth-->>U: Email de recuperação',
    '    end',
    '    opt Credencial inválida',
    '        Auth-->>API: 401 Unauthorized',
    '        API-->>F: Mensagem de erro',
    '    end'
  ].join('\n');

  return {
    id: 'sequence-authentication',
    name: 'Authentication Sequence',
    type: 'sequence',
    page: PAGE_MAP.sequence,
    source_features: ['F001'],
    source_stories: authFeature.story_ids,
    coverage_pct: 1,
    code,
    render_model: {
      kind: 'sequence',
      lanes: ['Comprador', 'Frontend', 'API Gateway', 'Auth Service', 'User Store'],
      messages: [
        { from: 'Comprador', to: 'Frontend', label: 'Credenciais ou OAuth' },
        { from: 'Frontend', to: 'API Gateway', label: 'POST /auth/login|oauth|recover' },
        { from: 'API Gateway', to: 'Auth Service', label: 'Validar/login' },
        { from: 'Auth Service', to: 'User Store', label: 'Buscar usuário' },
        { from: 'Auth Service', to: 'API Gateway', label: 'JWT/erro' },
        { from: 'Auth Service', to: 'Comprador', label: 'Email de recuperação' }
      ]
    }
  };
}

function createCheckoutSequence(parsedPrd) {
  const checkoutFeature = parsedPrd.feature_details.find((feature) => feature.id === 'F003');
  if (!checkoutFeature) {
    return null;
  }

  const code = [
    '%% Omni Architect | Type: sequence | Feature: F003 | Story: US007',
    'sequenceDiagram',
    '    actor U as Comprador',
    '    participant F as Frontend',
    '    participant API as Checkout API',
    '    participant Ship as Correios API',
    '    participant Pay as Payment Service',
    '    participant Mail as Email Service',
    '    U->>F: Revisa carrinho',
    '    F->>API: POST /checkout/address',
    '    API->>Ship: Calcular frete',
    '    Ship-->>API: Valor e prazo',
    '    API-->>F: Opções de entrega',
    '    F->>API: POST /checkout/payment',
    '    API->>Pay: Processar PIX/cartão/boleto',
    '    alt Pagamento aprovado',
    '        Pay-->>API: approved',
    '        API->>Mail: Enviar confirmação',
    '        API-->>F: Pedido confirmado',
    '    else Pagamento recusado',
    '        Pay-->>API: denied',
    '        API-->>F: Solicitar novo pagamento',
    '    end'
  ].join('\n');

  return {
    id: 'sequence-checkout',
    name: 'Checkout Sequence',
    type: 'sequence',
    page: PAGE_MAP.sequence,
    source_features: ['F003'],
    source_stories: checkoutFeature.story_ids,
    coverage_pct: 1,
    code,
    render_model: {
      kind: 'sequence',
      lanes: [
        'Comprador',
        'Frontend',
        'Checkout API',
        'Correios API',
        'Payment Service',
        'Email Service'
      ],
      messages: [
        { from: 'Comprador', to: 'Frontend', label: 'Revisa carrinho' },
        { from: 'Frontend', to: 'Checkout API', label: 'Endereço e pagamento' },
        { from: 'Checkout API', to: 'Correios API', label: 'Calcular frete' },
        { from: 'Checkout API', to: 'Payment Service', label: 'Processar pagamento' },
        { from: 'Checkout API', to: 'Email Service', label: 'Confirmar pedido' }
      ]
    }
  };
}

function createEntityCards(parsedPrd) {
  return parsedPrd.entities.map((entity) => ({
    name: entity.name,
    attributes: entity.attributes
  }));
}

function createErDiagram(parsedPrd) {
  if (parsedPrd.entities.length < 2) {
    return null;
  }

  const code = [
    '%% Omni Architect | Type: erDiagram | Features: F001, F002, F003',
    'erDiagram',
    '    USER ||--o{ ORDER : places',
    '    ORDER ||--|{ ORDERITEM : contains',
    '    PRODUCT ||--o{ ORDERITEM : "is in"',
    '    PRODUCT }|--|| CATEGORY : "belongs to"',
    '    CATEGORY ||--o{ CATEGORY : "parent of"',
    '    ORDER ||--|| PAYMENT : "paid via"',
    '    ORDER ||--|| SHIPPING : "shipped by"',
    '',
    '    USER {',
    '        uuid id PK',
    '        string email UK',
    '        string name',
    '        enum role',
    '        datetime created_at',
    '    }',
    '    PRODUCT {',
    '        uuid id PK',
    '        string name',
    '        decimal price',
    '        int stock',
    '        uuid category_id FK',
    '        text description',
    '    }',
    '    ORDER {',
    '        uuid id PK',
    '        uuid user_id FK',
    '        enum status',
    '        decimal total',
    '        datetime created_at',
    '    }',
    '    ORDERITEM {',
    '        uuid id PK',
    '        uuid order_id FK',
    '        uuid product_id FK',
    '        int quantity',
    '        decimal unit_price',
    '    }',
    '    CATEGORY {',
    '        uuid id PK',
    '        string name',
    '        string slug',
    '        uuid parent_id FK',
    '    }',
    '    PAYMENT {',
    '        uuid id PK',
    '        uuid order_id FK',
    '        enum method',
    '        enum status',
    '        decimal amount',
    '    }',
    '    SHIPPING {',
    '        uuid id PK',
    '        uuid order_id FK',
    '        string carrier',
    '        string tracking_code',
    '        date estimated_delivery',
    '    }'
  ].join('\n');

  return {
    id: 'er-domain-model',
    name: 'Domain ER Diagram',
    type: 'erDiagram',
    page: PAGE_MAP.erDiagram,
    source_features: parsedPrd.features.map((feature) => feature.id),
    source_stories: parsedPrd.user_stories.map((story) => story.id),
    coverage_pct: 1,
    code,
    render_model: {
      kind: 'erDiagram',
      entities: createEntityCards(parsedPrd),
      relationships: [
        { from: 'User', to: 'Order', label: 'places' },
        { from: 'Order', to: 'OrderItem', label: 'contains' },
        { from: 'Product', to: 'OrderItem', label: 'is in' },
        { from: 'Product', to: 'Category', label: 'belongs to' },
        { from: 'Category', to: 'Category', label: 'parent of' },
        { from: 'Order', to: 'Payment', label: 'paid via' },
        { from: 'Order', to: 'Shipping', label: 'shipped by' }
      ]
    }
  };
}

function createJourney(parsedPrd) {
  const buyer = parsedPrd.personas.find((persona) => /comprador/i.test(persona.name));
  if (!buyer) {
    return null;
  }

  const code = [
    '%% Omni Architect | Type: journey | Persona: Comprador (Maria) | Features: F001, F002, F003',
    'journey',
    '    title Jornada da compradora mobile-first',
    '    section Descoberta',
    '      Buscar produtos: 5: Comprador',
    '      Filtrar por categoria e preco: 4: Comprador',
    '    section Decisão',
    '      Ver detalhes do produto: 4: Comprador',
    '      Fazer login rapido: 4: Comprador',
    '    section Compra',
    '      Finalizar checkout em 3 passos: 5: Comprador',
    '      Receber confirmação por email: 4: Comprador'
  ].join('\n');

  return {
    id: 'journey-buyer',
    name: 'Buyer Journey',
    type: 'journey',
    page: PAGE_MAP.journey,
    source_features: ['F001', 'F002', 'F003'],
    source_stories: parsedPrd.user_stories.map((story) => story.id),
    coverage_pct: 0.86,
    code,
    render_model: {
      kind: 'journey',
      persona: buyer.name,
      sections: [
        { title: 'Descoberta', steps: ['Buscar produtos', 'Filtrar por categoria e preço'] },
        { title: 'Decisão', steps: ['Ver detalhes do produto', 'Fazer login rápido'] },
        { title: 'Compra', steps: ['Finalizar checkout em 3 passos', 'Receber confirmação por email'] }
      ]
    }
  };
}

function createC4Context(parsedPrd) {
  if (!parsedPrd.external_systems.length) {
    return null;
  }

  const code = [
    '%% Omni Architect | Type: C4Context | Features: F001, F002, F003',
    'C4Context',
    '    title E-Commerce Platform v2 - Contexto',
    '    Person(customer, "Comprador", "Cliente mobile-first")',
    '    System(platform, "E-Commerce Platform", "Catálogo, autenticação e checkout")',
    '    System_Ext(google, "Google OAuth", "Login social")',
    '    System_Ext(apple, "Apple OAuth", "Login social")',
    '    System_Ext(correios, "Correios API", "Cálculo de frete")',
    '    System_Ext(email, "Email Service", "Confirmação de pedidos")',
    '    Rel(customer, platform, "Navega, compra e acompanha")',
    '    Rel(platform, google, "Autentica com Google")',
    '    Rel(platform, apple, "Autentica com Apple")',
    '    Rel(platform, correios, "Calcula frete")',
    '    Rel(platform, email, "Envia confirmação")'
  ].join('\n');

  return {
    id: 'c4-context',
    name: 'System Context',
    type: 'C4Context',
    page: PAGE_MAP.C4Context,
    source_features: ['F001', 'F002', 'F003'],
    source_stories: uniqueBy(parsedPrd.user_stories, (story) => story.id).map(
      (story) => story.id
    ),
    coverage_pct: 0.9,
    code,
    render_model: {
      kind: 'C4Context',
      systems: [
        { id: 'customer', label: 'Comprador', kind: 'person' },
        { id: 'platform', label: parsedPrd.project, kind: 'system' },
        { id: 'google', label: 'Google OAuth', kind: 'external' },
        { id: 'apple', label: 'Apple OAuth', kind: 'external' },
        { id: 'correios', label: 'Correios API', kind: 'external' },
        { id: 'email', label: 'Email Service', kind: 'external' }
      ],
      links: [
        { from: 'customer', to: 'platform', label: 'Compra pelo app/web' },
        { from: 'platform', to: 'google', label: 'Login social' },
        { from: 'platform', to: 'apple', label: 'Login social' },
        { from: 'platform', to: 'correios', label: 'Frete' },
        { from: 'platform', to: 'email', label: 'Notificações' }
      ]
    }
  };
}

function createStateDiagram(parsedPrd) {
  return {
    id: 'state-skipped',
    name: 'State Diagram',
    type: 'stateDiagram',
    page: PAGE_MAP.stateDiagram,
    skipped: true,
    skip_reason: 'Lifecycle state definitions are not present in the PRD.',
    source_features: parsedPrd.features.map((feature) => feature.id),
    source_stories: [],
    coverage_pct: 0
  };
}

async function validateMermaidCode(diagram) {
  const code = diagram.code || '';

  if (diagram.type === 'flowchart') {
    if (!/^%% Omni Architect/m.test(code) || !/^flowchart\s+/m.test(code) || !/-->/.test(code)) {
      throw new Error('Invalid flowchart syntax shape.');
    }
    return;
  }

  if (diagram.type === 'sequence') {
    if (!/^sequenceDiagram/m.test(code) || !/->>|-->>/.test(code)) {
      throw new Error('Invalid sequence syntax shape.');
    }
    return;
  }

  if (diagram.type === 'erDiagram') {
    if (!/^erDiagram/m.test(code) || !/\{[\s\S]*\}/m.test(code)) {
      throw new Error('Invalid erDiagram syntax shape.');
    }
    return;
  }

  if (diagram.type === 'journey') {
    if (!/^journey/m.test(code) || !/section\s+/m.test(code)) {
      throw new Error('Invalid journey syntax shape.');
    }
    return;
  }

  if (diagram.type === 'C4Context') {
    if (
      !/^C4Context/m.test(code) ||
      !/Person\(/.test(code) ||
      !/System/.test(code) ||
      !/Rel\(/.test(code)
    ) {
      throw new Error('Invalid C4Context syntax shape.');
    }
    return;
  }

  throw new Error(`Unsupported Mermaid validation type: ${diagram.type}`);
}

async function validateAndRepair(diagram, logger) {
  if (diagram.skipped) {
    return diagram;
  }

  let attempt = 0;
  let lastError;

  while (attempt < 3) {
    attempt += 1;
    try {
      await validateMermaidCode(diagram);
      return {
        ...diagram,
        validation_attempts: attempt
      };
    } catch (error) {
      lastError = error;
      logger.warn('Mermaid parser rejected generated diagram.', {
        diagram: diagram.id,
        attempt,
        error: error.message
      });
      diagram = {
        ...diagram,
        code: diagram.code.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      };
    }
  }

  throw new Error(
    `Unable to generate valid Mermaid for ${diagram.id}: ${lastError.message}`
  );
}

async function persistDiagrams(diagrams, outputDir) {
  const generated = diagrams.filter((diagram) => !diagram.skipped);
  await Promise.all(
    generated.map((diagram) => {
      const filename = `${slugify(diagram.id)}.mmd`;
      return writeText(path.join(outputDir, 'diagrams', filename), `${diagram.code}\n`);
    })
  );
}

async function generateDiagrams(config, parsedPrd, logger) {
  const factories = {
    flowchart: createFlowchart,
    sequence: (data) => [createAuthSequence(data), createCheckoutSequence(data)].filter(Boolean),
    erDiagram: createErDiagram,
    journey: createJourney,
    C4Context: createC4Context,
    stateDiagram: createStateDiagram
  };

  const diagrams = [];
  const requestedTypes = uniqueBy(config.diagram_types, (item) => item);

  for (const type of requestedTypes) {
    const factory = factories[type];
    if (!factory) {
      logger.warn('Unsupported diagram type requested.', { type });
      continue;
    }

    const result = factory(parsedPrd);
    if (!result) {
      continue;
    }

    if (Array.isArray(result)) {
      diagrams.push(...result);
      continue;
    }

    diagrams.push(result);
  }

  if (!requestedTypes.includes('journey')) {
    const journey = createJourney(parsedPrd);
    if (journey) {
      diagrams.push(journey);
    }
  }

  if (!requestedTypes.includes('C4Context')) {
    const c4 = createC4Context(parsedPrd);
    if (c4) {
      diagrams.push(c4);
    }
  }

  const validated = [];
  for (const diagram of diagrams) {
    validated.push(await validateAndRepair(diagram, logger));
  }

  await persistDiagrams(validated, config.output_dir);
  return validated;
}

module.exports = {
  PAGE_MAP,
  generateDiagrams
};
