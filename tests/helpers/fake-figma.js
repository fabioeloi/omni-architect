let nextId = 1;

class FakeNode {
  constructor(type) {
    this.type = type;
    this.id = String(nextId++);
    this.name = `${type}-${this.id}`;
    this.children = [];
    this.parent = null;
    this.sharedPluginData = new Map();
    this.depth = 0;
    this.x = 0;
    this.y = 0;
  }

  appendChild(node) {
    node.parent = this;
    node.depth = this.depth + 1;
    this.children.push(node);
    return node;
  }

  remove() {
    if (!this.parent) {
      return;
    }

    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }

  findAll(predicate) {
    const matches = [];
    for (const child of this.children) {
      if (predicate(child)) {
        matches.push(child);
      }
      matches.push(...child.findAll(predicate));
    }
    return matches;
  }

  setSharedPluginData(namespace, key, value) {
    this.sharedPluginData.set(`${namespace}:${key}`, value);
  }

  getSharedPluginData(namespace, key) {
    return this.sharedPluginData.get(`${namespace}:${key}`) || '';
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}

class FakeTextNode extends FakeNode {
  constructor() {
    super('TEXT');
    this.characters = '';
  }
}

class FakePageNode extends FakeNode {
  constructor() {
    super('PAGE');
  }
}

class FakeRootNode extends FakeNode {
  constructor() {
    super('DOCUMENT');
  }
}

function createFakeFigma() {
  nextId = 1;
  const root = new FakeRootNode();
  const figmaApi = {
    root,
    currentPage: null,
    ui: {
      onmessage: null,
      postMessage() {}
    },
    viewport: {
      scrollAndZoomIntoView() {}
    },
    showUI() {},
    notify() {},
    closePlugin() {},
    async loadFontAsync() {},
    createPage() {
      const page = new FakePageNode();
      root.appendChild(page);
      if (!figmaApi.currentPage) {
        figmaApi.currentPage = page;
      }
      return page;
    },
    createFrame() {
      return new FakeNode('FRAME');
    },
    createText() {
      return new FakeTextNode();
    },
    createRectangle() {
      return new FakeNode('RECTANGLE');
    }
  };

  figmaApi.createPage();
  return figmaApi;
}

module.exports = {
  createFakeFigma
};
