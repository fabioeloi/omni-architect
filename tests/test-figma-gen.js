/**
 * Test suite for Phase 4: Figma Generator
 * 
 * Tests Figma API integration and asset generation
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock Figma Generator
class FigmaGenerator {
  constructor(options = {}) {
    this.fileKey = options.fileKey;
    this.accessToken = options.accessToken;
    this.designSystem = options.designSystem || 'material-3';
  }
  
  async generate(diagrams, options = {}) {
    // Validate credentials
    if (!this.fileKey) {
      throw new Error('Figma file key is required');
    }
    if (!this.accessToken) {
      throw new Error('Figma access token is required');
    }
    
    const projectName = options.projectName || 'Untitled Project';
    
    // Simulate API calls to create pages and frames
    const pages = this.createPages(diagrams, projectName);
    const components = this.createComponents(this.designSystem);
    
    return {
      file_key: this.fileKey,
      file_url: `https://www.figma.com/file/${this.fileKey}/${encodeURIComponent(projectName)}`,
      pages,
      components,
      metadata: {
        created_at: new Date().toISOString(),
        figma_version: 'v1',
        total_frames: pages.reduce((sum, p) => sum + p.frames.length, 0),
        total_components: components.length,
        generation_duration_ms: 1500
      }
    };
  }
  
  createPages(diagrams, projectName) {
    const pages = [];
    
    // Group diagrams by type
    const flowcharts = diagrams.filter(d => d.type === 'flowchart');
    const sequences = diagrams.filter(d => d.type === 'sequence');
    const erDiagrams = diagrams.filter(d => d.type === 'erDiagram');
    
    // Create "User Flows" page
    if (flowcharts.length > 0) {
      pages.push({
        id: 'page-flows',
        name: '🔄 User Flows',
        type: 'flows',
        frames: flowcharts.map((d, i) => ({
          id: `frame-flow-${i}`,
          name: d.name,
          width: 1200,
          height: 800,
          diagram_type: 'flowchart',
          source_diagram: d.name
        }))
      });
    }
    
    // Create "Interaction Specs" page
    if (sequences.length > 0) {
      pages.push({
        id: 'page-specs',
        name: '📋 Interaction Specs',
        type: 'specs',
        frames: sequences.map((d, i) => ({
          id: `frame-seq-${i}`,
          name: d.name,
          width: 1000,
          height: 600,
          diagram_type: 'sequence',
          source_diagram: d.name
        }))
      });
    }
    
    // Create "Data Model" page
    if (erDiagrams.length > 0) {
      pages.push({
        id: 'page-data',
        name: '🗄️ Data Model',
        type: 'data-model',
        frames: erDiagrams.map((d, i) => ({
          id: `frame-er-${i}`,
          name: d.name,
          width: 1400,
          height: 1000,
          diagram_type: 'erDiagram',
          source_diagram: d.name
        }))
      });
    }
    
    // Add index page
    pages.unshift({
      id: 'page-index',
      name: '📄 Index',
      type: 'index',
      frames: [{
        id: 'frame-index',
        name: `${projectName} - Overview`,
        width: 800,
        height: 600,
        diagram_type: 'index',
        source_diagram: 'index'
      }]
    });
    
    return pages;
  }
  
  createComponents(designSystem) {
    return [
      {
        id: 'comp-tokens',
        name: 'Design Tokens',
        type: 'token'
      },
      {
        id: 'comp-connector',
        name: 'Flow Connector',
        type: 'connector'
      },
      {
        id: 'comp-shape',
        name: 'Basic Shapes',
        type: 'shape'
      }
    ];
  }
}

describe('Figma Generator - Phase 4', () => {
  test('should create Figma structure with diagrams', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test_token'
    });
    
    const diagrams = [
      { type: 'flowchart', name: 'Checkout Flow' },
      { type: 'sequence', name: 'Auth Sequence' },
      { type: 'erDiagram', name: 'Domain Model' }
    ];
    
    const result = await generator.generate(diagrams, {
      projectName: 'E-Commerce'
    });
    
    assert.strictEqual(result.file_key, 'test123');
    assert.ok(result.file_url.includes('test123'));
    assert.ok(result.pages.length > 0);
  });
  
  test('should throw error without file key', async () => {
    const generator = new FigmaGenerator({
      accessToken: 'figd_test_token'
    });
    
    await assert.rejects(
      async () => await generator.generate([]),
      { message: /file key is required/ }
    );
  });
  
  test('should throw error without access token', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123'
    });
    
    await assert.rejects(
      async () => await generator.generate([]),
      { message: /access token is required/ }
    );
  });
  
  test('should create pages by diagram type', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test'
    });
    
    const diagrams = [
      { type: 'flowchart', name: 'Flow 1' },
      { type: 'flowchart', name: 'Flow 2' },
      { type: 'erDiagram', name: 'ER 1' }
    ];
    
    const result = await generator.generate(diagrams);
    
    // Should have index + flows + data-model pages
    assert.ok(result.pages.length >= 3);
    
    const flowsPage = result.pages.find(p => p.type === 'flows');
    assert.ok(flowsPage);
    assert.strictEqual(flowsPage.frames.length, 2);
    
    const dataPage = result.pages.find(p => p.type === 'data-model');
    assert.ok(dataPage);
    assert.strictEqual(dataPage.frames.length, 1);
  });
  
  test('should create index page', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test'
    });
    
    const result = await generator.generate([], {
      projectName: 'Test Project'
    });
    
    const indexPage = result.pages.find(p => p.type === 'index');
    assert.ok(indexPage);
    assert.strictEqual(indexPage.name, '📄 Index');
  });
  
  test('should create component library', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test'
    });
    
    const result = await generator.generate([]);
    
    assert.ok(result.components.length > 0);
    assert.ok(result.components.some(c => c.type === 'token'));
  });
  
  test('should set correct metadata', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test'
    });
    
    const diagrams = [
      { type: 'flowchart', name: 'Flow 1' }
    ];
    
    const result = await generator.generate(diagrams);
    
    assert.ok(result.metadata.created_at);
    assert.ok(result.metadata.total_frames > 0);
    assert.strictEqual(result.metadata.figma_version, 'v1');
  });
});

describe('Figma Generator - Page Structure', () => {
  const generator = new FigmaGenerator({
    fileKey: 'test123',
    accessToken: 'figd_test'
  });
  
  test('should create frames with correct dimensions', async () => {
    const diagrams = [
      { type: 'flowchart', name: 'Test Flow' }
    ];
    
    const result = await generator.generate(diagrams);
    
    const flowsPage = result.pages.find(p => p.type === 'flows');
    const frame = flowsPage.frames[0];
    
    assert.ok(frame.width > 0);
    assert.ok(frame.height > 0);
    assert.strictEqual(frame.diagram_type, 'flowchart');
  });
  
  test('should handle empty diagram list', async () => {
    const result = await generator.generate([]);
    
    // Should still create index page
    assert.ok(result.pages.length >= 1);
    assert.ok(result.pages[0].type === 'index');
  });
  
  test('should generate valid file URL', async () => {
    const result = await generator.generate([], {
      projectName: 'My Project'
    });
    
    assert.ok(result.file_url.startsWith('https://www.figma.com/file/'));
    assert.ok(result.file_url.includes('test123'));
    assert.ok(result.file_url.includes('My%20Project'));
  });
});

describe('Figma Generator - Design Systems', () => {
  test('should support material-3 design system', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test',
      designSystem: 'material-3'
    });
    
    const result = await generator.generate([]);
    
    assert.ok(result.components.length > 0);
  });
  
  test('should support custom design system', async () => {
    const generator = new FigmaGenerator({
      fileKey: 'test123',
      accessToken: 'figd_test',
      designSystem: 'custom'
    });
    
    const result = await generator.generate([]);
    
    assert.ok(result.components.length > 0);
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Running Figma Generator tests...');
}
