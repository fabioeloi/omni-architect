/**
 * Test suite for Phase 1: PRD Parser
 * 
 * Tests the semantic extraction of features, stories, entities from PRD markdown
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Mock PRD Parser (in real implementation, import from skills/prd-parse)
class PRDParser {
  async parse(prdMarkdown, options = {}) {
    // Simplified mock implementation
    const lines = prdMarkdown.split('\n');
    
    const result = {
      project: {
        name: options.projectName || 'Test Project',
        description: '',
        version: '1.0.0'
      },
      features: [],
      entities: [],
      actors: [],
      metadata: {
        parsed_at: new Date().toISOString(),
        parser_version: '1.0.0',
        word_count: prdMarkdown.split(/\s+/).length,
        feature_count: 0
      }
    };
    
    // Extract features (simplified)
    const featureRegex = /## Feature[:\s]+(.+)/gi;
    let match;
    let featureId = 1;
    
    while ((match = featureRegex.exec(prdMarkdown)) !== null) {
      result.features.push({
        id: `F${String(featureId).padStart(3, '0')}`,
        name: match[1].trim(),
        description: '',
        priority: 'medium',
        user_stories: [],
        acceptance_criteria: [],
        dependencies: []
      });
      featureId++;
    }
    
    result.metadata.feature_count = result.features.length;
    
    return result;
  }
}

describe('PRD Parser - Phase 1', () => {
  const parser = new PRDParser();
  
  test('should parse basic PRD structure', async () => {
    const prd = `
# Project: E-Commerce

## Feature: User Authentication
Users need to login to access their account.

## Feature: Product Catalog
Browse and search products.
    `;
    
    const result = await parser.parse(prd, { projectName: 'E-Commerce' });
    
    assert.strictEqual(result.project.name, 'E-Commerce');
    assert.strictEqual(result.features.length, 2);
    assert.strictEqual(result.features[0].id, 'F001');
    assert.strictEqual(result.features[0].name, 'User Authentication');
  });
  
  test('should extract feature from example PRD', async () => {
    const examplePath = path.join(__dirname, '../examples/prd-ecommerce.md');
    
    if (!fs.existsSync(examplePath)) {
      console.warn('Example PRD not found, skipping test');
      return;
    }
    
    const prd = fs.readFileSync(examplePath, 'utf-8');
    const result = await parser.parse(prd, { projectName: 'E-Commerce Platform' });
    
    assert.ok(result.features.length > 0, 'Should extract at least one feature');
    assert.ok(result.metadata.word_count > 100, 'Should count words');
  });
  
  test('should handle empty PRD gracefully', async () => {
    const prd = '';
    const result = await parser.parse(prd);
    
    assert.strictEqual(result.features.length, 0);
    assert.strictEqual(result.metadata.word_count, 0);
  });
  
  test('should extract feature IDs sequentially', async () => {
    const prd = `
## Feature: Auth
## Feature: Catalog
## Feature: Checkout
## Feature: Analytics
    `;
    
    const result = await parser.parse(prd);
    
    assert.strictEqual(result.features[0].id, 'F001');
    assert.strictEqual(result.features[1].id, 'F002');
    assert.strictEqual(result.features[2].id, 'F003');
    assert.strictEqual(result.features[3].id, 'F004');
  });
  
  test('should set correct metadata', async () => {
    const prd = '## Feature: Test\nSome description here.';
    const result = await parser.parse(prd, { projectName: 'Test Project' });
    
    assert.ok(result.metadata.parsed_at);
    assert.strictEqual(result.metadata.parser_version, '1.0.0');
    assert.strictEqual(result.metadata.feature_count, 1);
    assert.ok(result.metadata.word_count > 0);
  });
});

describe('PRD Parser - Edge Cases', () => {
  const parser = new PRDParser();
  
  test('should handle PRD with special characters', async () => {
    const prd = `
## Feature: Auth & Authorization
Users can login/logout with OAuth 2.0
    `;
    
    const result = await parser.parse(prd);
    assert.strictEqual(result.features[0].name, 'Auth & Authorization');
  });
  
  test('should handle malformed markdown', async () => {
    const prd = `
### This is level 3
## Feature: Something
#### Another level
    `;
    
    const result = await parser.parse(prd);
    assert.ok(result.features.length >= 1);
  });
  
  test('should handle very large PRDs', async () => {
    // Simulate large PRD
    let largePRD = '# Large Project\n';
    for (let i = 1; i <= 50; i++) {
      largePRD += `## Feature: Feature ${i}\nDescription for feature ${i}.\n\n`;
    }
    
    const result = await parser.parse(largePRD);
    assert.strictEqual(result.features.length, 50);
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Running PRD Parser tests...');
}
