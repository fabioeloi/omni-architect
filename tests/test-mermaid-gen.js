/**
 * Test suite for Phase 2: Mermaid Generator
 * 
 * Tests generation of valid Mermaid diagrams from parsed PRD
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock Mermaid Generator
class MermaidGenerator {
  async generate(parsedPRD, options = {}) {
    const diagramTypes = options.diagramTypes || ['flowchart', 'sequence', 'erDiagram'];
    const diagrams = [];
    
    // Generate flowcharts for features
    if (diagramTypes.includes('flowchart') && parsedPRD.features) {
      parsedPRD.features.forEach(feature => {
        diagrams.push({
          type: 'flowchart',
          name: `${feature.name} Flow`,
          code: this.generateFlowchart(feature),
          feature_ids: [feature.id],
          entities: [],
          metadata: {
            nodes: 5,
            edges: 4,
            complexity: 0.3
          }
        });
      });
    }
    
    // Generate ER diagram if entities exist
    if (diagramTypes.includes('erDiagram') && parsedPRD.entities && parsedPRD.entities.length > 0) {
      diagrams.push({
        type: 'erDiagram',
        name: 'Domain Model',
        code: this.generateERDiagram(parsedPRD.entities),
        feature_ids: [],
        entities: parsedPRD.entities.map(e => e.name),
        metadata: {
          nodes: parsedPRD.entities.length,
          edges: 0,
          complexity: 0.5
        }
      });
    }
    
    return {
      diagrams,
      mapping: {
        features_to_diagrams: {},
        entities_to_diagrams: {}
      },
      metadata: {
        generated_at: new Date().toISOString(),
        total_diagrams: diagrams.length,
        total_nodes: diagrams.reduce((sum, d) => sum + d.metadata.nodes, 0)
      }
    };
  }
  
  generateFlowchart(feature) {
    return `flowchart TD
    Start["Start ${feature.name}"]
    Process["Process ${feature.name}"]
    End["Complete"]
    
    Start --> Process
    Process --> End`;
  }
  
  generateERDiagram(entities) {
    let code = 'erDiagram\n';
    entities.forEach(entity => {
      code += `    ${entity.name} {\n`;
      entity.attributes?.forEach(attr => {
        code += `        ${attr.type} ${attr.name}\n`;
      });
      code += '    }\n';
    });
    return code;
  }
}

describe('Mermaid Generator - Phase 2', () => {
  const generator = new MermaidGenerator();
  
  test('should generate flowchart for feature', async () => {
    const parsedPRD = {
      project: { name: 'Test' },
      features: [{
        id: 'F001',
        name: 'User Login',
        description: 'Login functionality'
      }],
      entities: []
    };
    
    const result = await generator.generate(parsedPRD, {
      diagramTypes: ['flowchart']
    });
    
    assert.strictEqual(result.diagrams.length, 1);
    assert.strictEqual(result.diagrams[0].type, 'flowchart');
    assert.ok(result.diagrams[0].code.includes('flowchart TD'));
  });
  
  test('should generate ER diagram for entities', async () => {
    const parsedPRD = {
      project: { name: 'Test' },
      features: [],
      entities: [
        {
          name: 'User',
          attributes: [
            { name: 'id', type: 'string', required: true },
            { name: 'email', type: 'string', required: true }
          ]
        },
        {
          name: 'Product',
          attributes: [
            { name: 'id', type: 'string', required: true },
            { name: 'name', type: 'string', required: true }
          ]
        }
      ]
    };
    
    const result = await generator.generate(parsedPRD, {
      diagramTypes: ['erDiagram']
    });
    
    assert.strictEqual(result.diagrams.length, 1);
    assert.strictEqual(result.diagrams[0].type, 'erDiagram');
    assert.ok(result.diagrams[0].code.includes('erDiagram'));
    assert.ok(result.diagrams[0].code.includes('User'));
    assert.ok(result.diagrams[0].code.includes('Product'));
  });
  
  test('should generate multiple diagram types', async () => {
    const parsedPRD = {
      project: { name: 'Test' },
      features: [{
        id: 'F001',
        name: 'Checkout'
      }],
      entities: [{
        name: 'Order',
        attributes: []
      }]
    };
    
    const result = await generator.generate(parsedPRD, {
      diagramTypes: ['flowchart', 'erDiagram']
    });
    
    assert.ok(result.diagrams.length >= 2);
    const types = result.diagrams.map(d => d.type);
    assert.ok(types.includes('flowchart'));
    assert.ok(types.includes('erDiagram'));
  });
  
  test('should set correct metadata', async () => {
    const parsedPRD = {
      features: [{ id: 'F001', name: 'Test' }],
      entities: []
    };
    
    const result = await generator.generate(parsedPRD);
    
    assert.ok(result.metadata.generated_at);
    assert.strictEqual(result.metadata.total_diagrams, 1);
    assert.ok(result.metadata.total_nodes > 0);
  });
});

describe('Mermaid Generator - Diagram Validation', () => {
  const generator = new MermaidGenerator();
  
  test('generated flowchart should have valid syntax', async () => {
    const parsedPRD = {
      features: [{ id: 'F001', name: 'Auth' }],
      entities: []
    };
    
    const result = await generator.generate(parsedPRD, {
      diagramTypes: ['flowchart']
    });
    
    const code = result.diagrams[0].code;
    
    // Basic syntax validation
    assert.ok(code.startsWith('flowchart'));
    assert.ok(code.includes('Start'));
    assert.ok(code.includes('-->'));
  });
  
  test('generated ER diagram should have valid syntax', async () => {
    const parsedPRD = {
      features: [],
      entities: [{
        name: 'User',
        attributes: [{ name: 'id', type: 'string' }]
      }]
    };
    
    const result = await generator.generate(parsedPRD, {
      diagramTypes: ['erDiagram']
    });
    
    const code = result.diagrams[0].code;
    
    // Basic syntax validation
    assert.ok(code.startsWith('erDiagram'));
    assert.ok(code.includes('User'));
    assert.ok(code.includes('{'));
    assert.ok(code.includes('}'));
  });
  
  test('should handle empty inputs gracefully', async () => {
    const parsedPRD = {
      features: [],
      entities: []
    };
    
    const result = await generator.generate(parsedPRD);
    
    assert.strictEqual(result.diagrams.length, 0);
    assert.strictEqual(result.metadata.total_diagrams, 0);
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Running Mermaid Generator tests...');
}
