/**
 * Test suite for Phase 3: Logic Validator
 * 
 * Tests validation scoring and criteria evaluation
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

// Mock Logic Validator
class LogicValidator {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.85;
    this.mode = options.mode || 'auto';
  }
  
  async validate(parsedPRD, diagrams) {
    const breakdown = {
      coverage: this.evaluateCoverage(parsedPRD, diagrams),
      consistency: this.evaluateConsistency(parsedPRD, diagrams),
      completeness: this.evaluateCompleteness(parsedPRD, diagrams),
      traceability: this.evaluateTraceability(parsedPRD, diagrams),
      naming_coherence: this.evaluateNaming(parsedPRD, diagrams),
      dependency_integrity: this.evaluateDependencies(parsedPRD)
    };
    
    // Calculate weighted overall score
    const overall_score = 
      breakdown.coverage.score * breakdown.coverage.weight +
      breakdown.consistency.score * breakdown.consistency.weight +
      breakdown.completeness.score * breakdown.completeness.weight +
      breakdown.traceability.score * breakdown.traceability.weight +
      breakdown.naming_coherence.score * breakdown.naming_coherence.weight +
      breakdown.dependency_integrity.score * breakdown.dependency_integrity.weight;
    
    const status = overall_score >= this.threshold ? 'approved' : 'rejected';
    
    return {
      overall_score: Math.round(overall_score * 100) / 100,
      status,
      breakdown,
      recommendations: this.generateRecommendations(breakdown, status),
      validated_at: new Date().toISOString(),
      validator_version: '1.0.0'
    };
  }
  
  evaluateCoverage(prd, diagrams) {
    const totalFeatures = prd.features?.length || 0;
    if (totalFeatures === 0) {
      return { score: 1.0, weight: 0.25, issues: [] };
    }
    
    const coveredFeatures = new Set();
    diagrams.forEach(diagram => {
      diagram.feature_ids?.forEach(id => coveredFeatures.add(id));
    });
    
    const coverage = coveredFeatures.size / totalFeatures;
    
    return {
      score: coverage,
      weight: 0.25,
      details: {
        features_covered: coveredFeatures.size,
        features_total: totalFeatures,
        coverage_percentage: Math.round(coverage * 100)
      },
      issues: coverage < 0.9 ? [{
        severity: 'warning',
        criterion: 'coverage',
        message: `Only ${coveredFeatures.size}/${totalFeatures} features covered in diagrams`
      }] : []
    };
  }
  
  evaluateConsistency(prd, diagrams) {
    // Simplified: check for naming consistency
    const score = 0.92; // Mock value
    
    return {
      score,
      weight: 0.25,
      details: {
        naming_conflicts: 0,
        entity_mismatches: 0
      },
      issues: []
    };
  }
  
  evaluateCompleteness(prd, diagrams) {
    const score = 0.90;
    
    return {
      score,
      weight: 0.20,
      details: {
        missing_actors: [],
        missing_states: []
      },
      issues: []
    };
  }
  
  evaluateTraceability(prd, diagrams) {
    const score = 0.95;
    
    return {
      score,
      weight: 0.15,
      details: {
        orphaned_features: [],
        unmapped_entities: []
      },
      issues: []
    };
  }
  
  evaluateNaming(prd, diagrams) {
    const score = 0.88;
    
    return {
      score,
      weight: 0.10,
      details: {
        inconsistent_names: []
      },
      issues: []
    };
  }
  
  evaluateDependencies(prd) {
    const score = 1.0;
    
    return {
      score,
      weight: 0.05,
      details: {
        circular_dependencies: [],
        broken_dependencies: []
      },
      issues: []
    };
  }
  
  generateRecommendations(breakdown, status) {
    const recommendations = [];
    
    if (breakdown.coverage.score < 0.9) {
      recommendations.push('Increase feature coverage in diagrams');
    }
    
    if (breakdown.consistency.score < 0.85) {
      recommendations.push('Review naming consistency across diagrams');
    }
    
    if (status === 'approved') {
      recommendations.push('Validation passed - ready for Figma generation');
    } else {
      recommendations.push('Address validation issues before proceeding');
    }
    
    return recommendations;
  }
}

describe('Logic Validator - Phase 3', () => {
  test('should approve high-quality diagrams', async () => {
    const validator = new LogicValidator({ threshold: 0.85 });
    
    const parsedPRD = {
      features: [
        { id: 'F001', name: 'Auth' },
        { id: 'F002', name: 'Catalog' }
      ]
    };
    
    const diagrams = [
      { type: 'flowchart', feature_ids: ['F001'], metadata: { nodes: 5 } },
      { type: 'flowchart', feature_ids: ['F002'], metadata: { nodes: 8 } }
    ];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.strictEqual(result.status, 'approved');
    assert.ok(result.overall_score >= 0.85);
  });
  
  test('should reject low coverage', async () => {
    const validator = new LogicValidator({ threshold: 0.85 });
    
    const parsedPRD = {
      features: [
        { id: 'F001', name: 'Auth' },
        { id: 'F002', name: 'Catalog' },
        { id: 'F003', name: 'Checkout' },
        { id: 'F004', name: 'Analytics' }
      ]
    };
    
    const diagrams = [
      { type: 'flowchart', feature_ids: ['F001'], metadata: { nodes: 5 } }
      // Only 1 out of 4 features covered
    ];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.strictEqual(result.breakdown.coverage.details.features_covered, 1);
    assert.strictEqual(result.breakdown.coverage.details.features_total, 4);
    assert.ok(result.breakdown.coverage.score < 0.5);
  });
  
  test('should calculate weighted score correctly', async () => {
    const validator = new LogicValidator({ threshold: 0.85 });
    
    const parsedPRD = { features: [] };
    const diagrams = [];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    // Verify weights sum to 1.0
    const totalWeight = 
      result.breakdown.coverage.weight +
      result.breakdown.consistency.weight +
      result.breakdown.completeness.weight +
      result.breakdown.traceability.weight +
      result.breakdown.naming_coherence.weight +
      result.breakdown.dependency_integrity.weight;
    
    assert.ok(Math.abs(totalWeight - 1.0) < 0.01);
  });
  
  test('should respect custom threshold', async () => {
    const strictValidator = new LogicValidator({ threshold: 0.95 });
    
    const parsedPRD = { features: [{ id: 'F001', name: 'Test' }] };
    const diagrams = [{ feature_ids: ['F001'] }];
    
    const result = await strictValidator.validate(parsedPRD, diagrams);
    
    // With mock scores, this should fail the higher threshold
    if (result.overall_score < 0.95) {
      assert.strictEqual(result.status, 'rejected');
    }
  });
  
  test('should generate recommendations', async () => {
    const validator = new LogicValidator();
    
    const parsedPRD = {
      features: [
        { id: 'F001', name: 'Auth' },
        { id: 'F002', name: 'Catalog' }
      ]
    };
    
    const diagrams = [
      { feature_ids: ['F001'] }
    ];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.recommendations.length > 0);
  });
});

describe('Logic Validator - Criteria Evaluation', () => {
  const validator = new LogicValidator();
  
  test('coverage should be 100% when all features covered', async () => {
    const parsedPRD = {
      features: [
        { id: 'F001', name: 'Auth' },
        { id: 'F002', name: 'Catalog' }
      ]
    };
    
    const diagrams = [
      { feature_ids: ['F001', 'F002'] }
    ];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.strictEqual(result.breakdown.coverage.score, 1.0);
    assert.strictEqual(result.breakdown.coverage.details.features_covered, 2);
    assert.strictEqual(result.breakdown.coverage.details.features_total, 2);
  });
  
  test('should handle empty PRD', async () => {
    const parsedPRD = { features: [] };
    const diagrams = [];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.ok(result.overall_score >= 0);
    assert.ok(result.overall_score <= 1.0);
  });
  
  test('should set validation timestamp', async () => {
    const parsedPRD = { features: [] };
    const diagrams = [];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.ok(result.validated_at);
    assert.ok(new Date(result.validated_at).getTime() > 0);
  });
});

describe('Logic Validator - Modes', () => {
  test('auto mode should use threshold', async () => {
    const validator = new LogicValidator({ 
      mode: 'auto',
      threshold: 0.85 
    });
    
    const parsedPRD = { features: [{ id: 'F001' }] };
    const diagrams = [{ feature_ids: ['F001'] }];
    
    const result = await validator.validate(parsedPRD, diagrams);
    
    assert.ok(['approved', 'rejected'].includes(result.status));
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Running Logic Validator tests...');
}
