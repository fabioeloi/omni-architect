async function ensureFonts(figmaApi) {
  await figmaApi.loadFontAsync({ family: 'Inter', style: 'Regular' });
}

function markManaged(node) {
  node.setSharedPluginData('omni-architect', 'managed', 'true');
  return node;
}

function createTextNode(figmaApi, value, fontSize, color) {
  const text = markManaged(figmaApi.createText());
  text.characters = value;
  text.fontSize = fontSize;
  if (color) {
    text.fills = [{ type: 'SOLID', color }];
  }
  return text;
}

function createCard(figmaApi, label, width, height, x, y, fillColor) {
  const frame = markManaged(figmaApi.createFrame());
  frame.name = label;
  frame.resize(width, height);
  frame.x = x;
  frame.y = y;
  frame.fills = [{ type: 'SOLID', color: fillColor || { r: 0.95, g: 0.97, b: 1 } }];
  frame.strokes = [{ type: 'SOLID', color: { r: 0.2, g: 0.34, b: 0.61 } }];
  frame.strokeWeight = 1;
  frame.cornerRadius = 16;
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.paddingTop = 16;
  frame.paddingRight = 16;
  frame.paddingBottom = 16;
  frame.paddingLeft = 16;
  frame.itemSpacing = 8;
  frame.appendChild(createTextNode(figmaApi, label, 16, { r: 0.06, g: 0.13, b: 0.23 }));
  return frame;
}

function clearManagedContent(page) {
  const managedChildren = page.findAll(
    (node) => node.getSharedPluginData('omni-architect', 'managed') === 'true'
  );
  managedChildren
    .sort((left, right) => right.depth - left.depth)
    .forEach((node) => {
      if (node.parent) {
        node.remove();
      }
    });
}

function ensurePage(figmaApi, name) {
  let page = figmaApi.root.children.find((child) => child.type === 'PAGE' && child.name === name);
  if (!page) {
    page = figmaApi.createPage();
    page.name = name;
  }
  clearManagedContent(page);
  return page;
}

function buildDeepLink(figmaFileKey, nodeId) {
  return `https://www.figma.com/file/${figmaFileKey}/?node-id=${encodeURIComponent(nodeId)}`;
}

function renderFlowchart(figmaApi, container, model) {
  for (const node of model.nodes) {
    const card = createCard(
      figmaApi,
      node.label,
      node.kind === 'decision' ? 220 : 200,
      96,
      node.x + 40,
      node.y + 80,
      node.kind === 'decision'
        ? { r: 1, g: 0.97, b: 0.86 }
        : { r: 0.93, g: 0.97, b: 1 }
    );
    container.appendChild(card);
  }

  const legend = createCard(figmaApi, 'Conexões', 640, 120, 40, 280, {
    r: 0.96,
    g: 0.95,
    b: 1
  });
  model.edges.forEach((edge) => {
    legend.appendChild(
      createTextNode(
        figmaApi,
        `${edge.from} -> ${edge.to}${edge.label ? ` (${edge.label})` : ''}`,
        12,
        { r: 0.16, g: 0.19, b: 0.33 }
      )
    );
  });
  container.appendChild(legend);
}

function renderSequence(figmaApi, container, model) {
  const header = createCard(figmaApi, 'Lanes', 860, 100, 40, 80, {
    r: 0.94,
    g: 0.99,
    b: 0.95
  });
  header.layoutMode = 'HORIZONTAL';
  model.lanes.forEach((lane) => {
    const laneCard = createCard(figmaApi, lane, 140, 60, 0, 0, {
      r: 1,
      g: 1,
      b: 1
    });
    header.appendChild(laneCard);
  });
  container.appendChild(header);

  const stream = createCard(figmaApi, 'Mensagens', 860, 260, 40, 220, {
    r: 1,
    g: 1,
    b: 1
  });
  model.messages.forEach((message) => {
    stream.appendChild(
      createTextNode(
        figmaApi,
        `${message.from} -> ${message.to}: ${message.label}`,
        13,
        { r: 0.16, g: 0.19, b: 0.33 }
      )
    );
  });
  container.appendChild(stream);
}

function renderEr(figmaApi, container, model) {
  model.entities.forEach((entity, index) => {
    const card = createCard(figmaApi, entity.name, 240, 160, 40 + (index % 3) * 280, 80 + Math.floor(index / 3) * 220, {
      r: 0.97,
      g: 0.96,
      b: 1
    });
    entity.attributes.forEach((attribute) => {
      card.appendChild(
        createTextNode(figmaApi, attribute, 12, { r: 0.2, g: 0.2, b: 0.35 })
      );
    });
    container.appendChild(card);
  });

  const relations = createCard(figmaApi, 'Relacionamentos', 840, 140, 40, 560, {
    r: 0.94,
    g: 0.99,
    b: 0.95
  });
  model.relationships.forEach((relation) => {
    relations.appendChild(
      createTextNode(
        figmaApi,
        `${relation.from} -> ${relation.to}: ${relation.label}`,
        12,
        { r: 0.16, g: 0.19, b: 0.33 }
      )
    );
  });
  container.appendChild(relations);
}

function renderJourney(figmaApi, container, model) {
  const title = createCard(figmaApi, `Persona: ${model.persona}`, 860, 90, 40, 80, {
    r: 0.99,
    g: 0.95,
    b: 0.89
  });
  container.appendChild(title);

  model.sections.forEach((section, index) => {
    const card = createCard(figmaApi, section.title, 260, 180, 40 + index * 280, 220, {
      r: 1,
      g: 1,
      b: 1
    });
    section.steps.forEach((step) => {
      card.appendChild(
        createTextNode(figmaApi, step, 12, { r: 0.16, g: 0.19, b: 0.33 })
      );
    });
    container.appendChild(card);
  });
}

function renderContext(figmaApi, container, model) {
  model.systems.forEach((system, index) => {
    const fill =
      system.kind === 'person'
        ? { r: 0.99, g: 0.95, b: 0.89 }
        : system.kind === 'system'
          ? { r: 0.93, g: 0.97, b: 1 }
          : { r: 0.94, g: 0.99, b: 0.95 };
    const card = createCard(figmaApi, system.label, 220, 100, 40 + (index % 3) * 280, 80 + Math.floor(index / 3) * 160, fill);
    container.appendChild(card);
  });

  const relations = createCard(figmaApi, 'Relações', 840, 140, 40, 440, {
    r: 1,
    g: 1,
    b: 1
  });
  model.links.forEach((link) => {
    relations.appendChild(
      createTextNode(
        figmaApi,
        `${link.from} -> ${link.to}: ${link.label}`,
        12,
        { r: 0.16, g: 0.19, b: 0.33 }
      )
    );
  });
  container.appendChild(relations);
}

function renderDiagram(figmaApi, page, namespace, diagram) {
  const frame = createCard(
    figmaApi,
    diagram.name,
    960,
    720,
    40,
    40,
    { r: 0.98, g: 0.99, b: 1 }
  );
  frame.name = `${namespace} / ${diagram.name}`;
  frame.layoutMode = 'NONE';
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisSizingMode = 'FIXED';
  frame.resize(960, 720);
  frame.appendChild(
    createTextNode(figmaApi, `${diagram.type} • ${diagram.id}`, 12, {
      r: 0.33,
      g: 0.38,
      b: 0.52
    })
  );

  if (diagram.render_model.kind === 'flowchart') {
    renderFlowchart(figmaApi, frame, diagram.render_model);
  } else if (diagram.render_model.kind === 'sequence') {
    renderSequence(figmaApi, frame, diagram.render_model);
  } else if (diagram.render_model.kind === 'erDiagram') {
    renderEr(figmaApi, frame, diagram.render_model);
  } else if (diagram.render_model.kind === 'journey') {
    renderJourney(figmaApi, frame, diagram.render_model);
  } else if (diagram.render_model.kind === 'C4Context') {
    renderContext(figmaApi, frame, diagram.render_model);
  }

  const source = createCard(figmaApi, 'Mermaid Source', 860, 140, 40, 600, {
    r: 0.08,
    g: 0.14,
    b: 0.24
  });
  source.appendChild(
    createTextNode(figmaApi, diagram.code, 10, { r: 0.9, g: 0.93, b: 1 })
  );
  frame.appendChild(source);
  page.appendChild(frame);
  return frame;
}

async function applyPayload(figmaApi, payload) {
  await ensureFonts(figmaApi);
  const namespace = payload.namespace || `${payload.project_name} - Omni Architect`;
  const assets = [];

  for (const pageDefinition of payload.pages) {
    const page = ensurePage(figmaApi, `${namespace} / ${pageDefinition.name}`);
    figmaApi.currentPage = page;

    const header = createCard(figmaApi, pageDefinition.name, 1040, 90, 40, 20, {
      r: 0.06,
      g: 0.13,
      b: 0.23
    });
    header.appendChild(
      createTextNode(figmaApi, payload.project_name, 12, {
        r: 0.9,
        g: 0.93,
        b: 1
      })
    );
    page.appendChild(header);

    pageDefinition.diagrams.forEach((diagram, index) => {
      const frame = renderDiagram(figmaApi, page, namespace, diagram);
      frame.y = 140 + index * 780;
      assets.push({
        node_id: frame.id,
        name: frame.name,
        type: diagram.type,
        page: pageDefinition.name,
        figma_url: buildDeepLink(payload.figma_file_key, frame.id)
      });
    });
  }

  return {
    imported_at: new Date().toISOString(),
    project_name: payload.project_name,
    figma_file_key: payload.figma_file_key,
    assets
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.__OMNI_ARCHITECT_PLUGIN__ = {
    applyPayload,
    buildDeepLink
  };
}

if (typeof figma !== 'undefined') {
  figma.showUI(__html__, { width: 540, height: 720 });

  figma.ui.onmessage = async (message) => {
    if (message.type !== 'import-payload') {
      return;
    }

    try {
      const payload = JSON.parse(message.payload);
      const manifest = await applyPayload(figma, payload);
      figma.notify(`Omni Architect importou ${manifest.assets.length} assets.`);
      figma.ui.postMessage({
        type: 'import-result',
        manifest
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'import-error',
        error: error.message
      });
    }
  };
}
