# Figma Agent API Assessment & Integration Proposal

**Document Version:** 1.0
**Date:** 2026-03-25
**Author:** Omni Architect Team
**Status:** Proposal

---

## Executive Summary

Figma has recently announced that **the Figma canvas is now open to agents**, introducing new REST API capabilities that allow AI agents to programmatically create, read, update, and delete content on the Figma canvas. This represents a significant opportunity for the Omni Architect project to:

1. **Eliminate manual import steps** - Move from plugin-based import to direct API-driven canvas manipulation
2. **Enable real-time updates** - Support incremental diagram updates without full re-imports
3. **Improve diagram fidelity** - Leverage vector graphics and native Figma connectors instead of text-based layouts
4. **Unlock automation** - Create end-to-end automated PRD-to-Figma pipelines
5. **Enhance collaboration** - Enable direct integration with Figma's commenting and version control

---

## Current State Analysis

### Omni Architect v1.0 Figma Integration

**Architecture:**
```
PRD → Mermaid → Validation → JSON Payload → [MANUAL] Plugin Import → Resume
                                              ^^^^^^^^
                                              Gap: Manual step
```

**Current Limitations:**

| Limitation | Impact | Business Cost |
|-----------|--------|---------------|
| **Manual import step** | User must paste payload into plugin UI | 2-5 minutes per iteration |
| **Text-based diagrams** | Flowchart edges shown as text, not visual | Poor visual fidelity |
| **Static layouts** | Hard-coded X/Y coordinates | Diagrams don't adapt to content |
| **No incremental updates** | Full re-import on any change | Wastes time & creates clutter |
| **Limited styling** | Basic fills/strokes only | Doesn't leverage design systems |
| **No REST API usage** | Plugin-only approach | Can't automate in CI/CD |

**Current Plugin Implementation:**
- Location: `figma-plugin/code.js`
- Method: Creates Frames + Text nodes via Plugin API
- Diagrams: Flowchart, Sequence, ER, Journey, C4Context
- Idempotency: Uses `setSharedPluginData` to mark managed nodes
- Output: Returns manifest with node IDs and deep links

---

## Figma's New Agent API Capabilities

### What's New (Based on Industry Announcements)

Figma's new Agent API provides:

1. **REST API Canvas Mutations** - POST/PUT/DELETE operations on canvas nodes
2. **Vector Shape Creation** - Programmatic creation of paths, rectangles, ellipses, lines
3. **Connector API** - First-class support for arrows and connection lines
4. **Component Instantiation** - Create instances from design system components
5. **Auto-Layout Manipulation** - Programmatic control of Flexbox-like layouts
6. **Variables & Styles API** - Bind to design tokens and styles
7. **Batch Operations** - Multiple canvas operations in single request
8. **WebSocket Updates** - Real-time change notifications
9. **Agent Authentication** - Service account tokens with granular permissions
10. **Version Control Integration** - Programmatic branching and committing

### Key Differences from Plugin API

| Feature | Plugin API (Current) | Agent REST API (New) |
|---------|---------------------|----------------------|
| **Authentication** | Browser session | Service account token |
| **Execution Context** | Inside Figma app | External server/CLI |
| **User Interaction** | Requires manual trigger | Fully automated |
| **Batch Operations** | Sequential plugin calls | Single batched request |
| **Vector Graphics** | Limited | Full SVG path support |
| **Connectors** | Text-based edges | Native arrow nodes |
| **Real-time Updates** | No | WebSocket support |
| **CI/CD Integration** | No | Yes |
| **Rate Limits** | Per-user | Per-service account |

---

## Opportunity Assessment

### High-Impact Improvements

#### 1. **Automated End-to-End Pipeline** ⭐⭐⭐⭐⭐

**Current:** `run` → (manual plugin import) → `resume`
**Proposed:** `run` → **automated Figma API calls** → `resume`

**Benefits:**
- Eliminates 2-5 minute manual step per iteration
- Enables CI/CD integration (e.g., auto-update Figma on PRD changes)
- Reduces human error in payload import
- Allows headless execution in server environments

**Implementation Effort:** Medium (2-3 days)

---

#### 2. **Native Vector Diagram Rendering** ⭐⭐⭐⭐⭐

**Current:** Text-based edge lists: "Checkout -> Payment: validate card"
**Proposed:** Actual visual connectors with arrows, curves, and labels

**Technical Approach:**
- Convert Mermaid flowchart edges to Figma Connector nodes
- Use SVG path generation for decision diamonds
- Leverage Auto-Layout for automatic node positioning
- Apply design system variables for consistent styling

**Benefits:**
- Professional-looking diagrams matching design quality
- Visual fidelity matches Mermaid rendered output
- Easier handoff to designers and developers
- Supports hover states and interactive prototypes

**Implementation Effort:** High (5-7 days)

---

#### 3. **Incremental Diagram Updates** ⭐⭐⭐⭐

**Current:** Full page clear + re-import on any change
**Proposed:** Delta-based updates (add/modify/remove specific nodes)

**Technical Approach:**
- Track node IDs in session state
- Compute diff between previous and current diagram
- Apply only changed operations via PATCH requests
- Preserve user annotations and manual adjustments

**Benefits:**
- Faster updates (seconds vs minutes)
- Preserves manual designer tweaks
- Supports iterative PRD refinement workflows
- Reduces Figma version history clutter

**Implementation Effort:** Medium (3-4 days)

---

#### 4. **Design System Integration** ⭐⭐⭐⭐

**Current:** Hard-coded colors in plugin (`r: 0.95, g: 0.97, b: 1`)
**Proposed:** Reference actual Figma Variables and Styles

**Technical Approach:**
- Query Figma file for available Variables (colors, spacing, radii)
- Map `design_system` config to Variable collections
- Apply Variables to generated components
- Support theme switching (light/dark mode)

**Benefits:**
- Diagrams inherit brand identity automatically
- Consistent with existing design systems
- Supports theme variants out-of-the-box
- Designer-friendly (can modify variables, not code)

**Implementation Effort:** Medium (3-4 days)

---

#### 5. **Real-Time Collaboration** ⭐⭐⭐

**Current:** One-way sync (Omni Architect → Figma)
**Proposed:** Bi-directional updates via WebSocket

**Use Cases:**
- Designer adds annotation in Figma → reflected in next `resume`
- PRD updated → Figma auto-updates → notification to design team
- Validation score changes → badge on Figma canvas updates

**Benefits:**
- Tighter collaboration loops
- Reduced context switching
- Living documentation

**Implementation Effort:** High (7-10 days)

---

#### 6. **Component Library Creation** ⭐⭐⭐⭐

**Current:** Each diagram creates raw frames
**Proposed:** Generate reusable component library

**Technical Approach:**
- Create master components for common patterns:
  - Flowchart nodes (process, decision, terminal)
  - Sequence diagram lanes
  - ER entity cards
- Instantiate components instead of raw frames
- Allow designers to modify masters, instances update

**Benefits:**
- DRY principle for diagrams
- Easier to maintain consistency
- Designer can customize once, affects all diagrams
- Supports component swapping (Material → Tailwind)

**Implementation Effort:** Medium-High (4-5 days)

---

## Proposed Architecture Changes

### Phase 1: Hybrid Approach (v1.1) - Quick Win

**Goal:** Add REST API support while maintaining plugin fallback

```
┌─────────────────────────────────────────┐
│  Orchestrator                           │
│  ├─ Check for FIGMA_SERVICE_TOKEN       │
│  ├─ If present: Use REST API            │ ← NEW
│  └─ If absent: Generate plugin payload  │ ← EXISTING
└─────────────────────────────────────────┘
```

**Configuration:**
```yaml
# .omni-architect.yml
figma_service_token: "fst-xxx-yyy"  # NEW: Service account token
figma_access_token: "fptk-xxx-yyy"  # DEPRECATED: Plugin fallback only
figma_integration_mode: "auto"      # NEW: auto | rest_api | plugin
```

**Implementation:**
1. Create `lib/figma-client.js` - REST API wrapper
2. Update `lib/phases/prepare-figma.js` - Add API mode branching
3. Implement `lib/renderers/vector-diagrams.js` - Vector rendering
4. Update CLI to support new config options
5. Add integration tests for REST API path

**Backward Compatibility:** ✅ Full - Plugin path still works

**Effort:** 5-7 days
**Risk:** Low

---

### Phase 2: Native Vector Rendering (v1.2)

**Goal:** Generate professional vector diagrams via REST API

**New Modules:**
- `lib/renderers/flowchart-renderer.js` - Converts Mermaid → Figma shapes
- `lib/renderers/sequence-renderer.js` - Swimlanes with connectors
- `lib/renderers/er-renderer.js` - Entity-relationship with cardinality
- `lib/layout-engine.js` - Auto-layout algorithm (Dagre-based)

**Key Features:**
- SVG path generation for complex shapes (diamonds, cylinders)
- Connector API for edges with arrow heads
- Auto-layout for node positioning (no hard-coded X/Y)
- Design token integration (colors, typography, spacing)

**Effort:** 7-10 days
**Risk:** Medium (depends on REST API stability)

---

### Phase 3: Real-Time Updates (v1.3)

**Goal:** Incremental updates + WebSocket notifications

**New Components:**
- `lib/diff-engine.js` - Computes diagram diffs
- `lib/figma-sync.js` - WebSocket client for live updates
- `lib/session-tracker.js` - Persistent node ID mapping

**Workflow:**
```
1. User updates PRD
2. Re-run validation
3. Diff engine: only "Checkout" flow changed
4. PATCH request: update 3 nodes, add 1 edge
5. WebSocket: notify designers in real-time
```

**Effort:** 10-12 days
**Risk:** High (requires robust state management)

---

## Technical Implementation Plan

### 1. Figma REST API Client (`lib/figma-client.js`)

```javascript
/**
 * Figma REST API Client for Agent-based canvas manipulation
 */
class FigmaAgentClient {
  constructor(serviceToken, fileKey) {
    this.token = serviceToken;
    this.fileKey = fileKey;
    this.baseUrl = 'https://api.figma.com/v1';
  }

  /**
   * Create canvas nodes via REST API
   * Uses new Agent API endpoints
   */
  async createNodes(pageId, nodes) {
    // POST /v1/files/:fileKey/nodes
    // Body: { parent_id, nodes: [ {type, properties} ] }
  }

  /**
   * Update existing nodes
   */
  async updateNodes(nodeIds, properties) {
    // PATCH /v1/files/:fileKey/nodes
  }

  /**
   * Create connector between two nodes
   */
  async createConnector(fromNodeId, toNodeId, label, style) {
    // POST /v1/files/:fileKey/connectors
    // Body: { start_node, end_node, label, arrow_style }
  }

  /**
   * Query design variables (for design system integration)
   */
  async getVariables(collectionName) {
    // GET /v1/files/:fileKey/variables
  }

  /**
   * Batch operations (reduce API calls)
   */
  async applyBatch(operations) {
    // POST /v1/files/:fileKey/batch
    // Body: { operations: [ {type, ...}, ... ] }
  }
}
```

---

### 2. Vector Diagram Renderer (`lib/renderers/flowchart-renderer.js`)

```javascript
/**
 * Converts Mermaid flowchart to Figma vector shapes
 */
class FlowchartRenderer {
  constructor(figmaClient, layoutEngine) {
    this.client = figmaClient;
    this.layout = layoutEngine;
  }

  async render(diagram, pageId, designSystem) {
    // 1. Parse Mermaid AST
    const graph = parseMermaidFlowchart(diagram.code);

    // 2. Compute layout (auto-positioning)
    const layout = this.layout.compute(graph);

    // 3. Create nodes with proper shapes
    const nodeOps = layout.nodes.map(node => ({
      type: node.kind === 'decision' ? 'POLYGON' : 'RECTANGLE',
      properties: {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        fills: [{ type: 'SOLID', color: designSystem.colors.primary }],
        cornerRadius: node.kind === 'process' ? 16 : 0,
        // For decision nodes: create diamond path
        vectorPaths: node.kind === 'decision' ?
          this.createDiamondPath(node.width, node.height) : null
      },
      children: [
        { type: 'TEXT', properties: { characters: node.label } }
      ]
    }));

    // 4. Create connectors
    const edgeOps = layout.edges.map(edge => ({
      type: 'CONNECTOR',
      properties: {
        startNodeId: edge.fromId,
        endNodeId: edge.toId,
        connectorLineType: 'ELBOWED',
        endArrowType: 'ARROW_FILLED',
        label: edge.label
      }
    }));

    // 5. Batch apply
    return await this.client.applyBatch([...nodeOps, ...edgeOps]);
  }

  createDiamondPath(width, height) {
    // SVG path for diamond shape
    const cx = width / 2;
    const cy = height / 2;
    return [
      { windingRule: 'NONZERO',
        data: `M ${cx} 0 L ${width} ${cy} L ${cx} ${height} L 0 ${cy} Z`
      }
    ];
  }
}
```

---

### 3. Layout Engine (`lib/layout-engine.js`)

```javascript
/**
 * Auto-layout for diagrams using Dagre algorithm
 */
const dagre = require('dagre');

class LayoutEngine {
  compute(graph) {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

    // Add nodes
    graph.nodes.forEach(node => {
      g.setNode(node.id, {
        width: node.kind === 'decision' ? 180 : 200,
        height: 100
      });
    });

    // Add edges
    graph.edges.forEach(edge => {
      g.setEdge(edge.from, edge.to);
    });

    // Compute layout
    dagre.layout(g);

    // Extract positions
    return {
      nodes: graph.nodes.map(node => {
        const pos = g.node(node.id);
        return { ...node, x: pos.x, y: pos.y, width: pos.width, height: pos.height };
      }),
      edges: graph.edges
    };
  }
}
```

---

### 4. Configuration Schema Update

```yaml
# .omni-architect.yml (v1.1+)

figma:
  # NEW: Service account token for REST API
  service_token: "${FIGMA_SERVICE_TOKEN}"

  # DEPRECATED: Plugin-based fallback
  access_token: "${FIGMA_ACCESS_TOKEN}"

  # File target
  file_key: "abc123XYZ"

  # NEW: Integration mode
  integration_mode: "auto"  # auto | rest_api | plugin

  # NEW: Feature flags
  features:
    vector_rendering: true      # Use native shapes vs text
    auto_layout: true           # Dagre-based positioning
    design_system_binding: true # Use Figma Variables
    incremental_updates: false  # Delta updates (v1.3)
    real_time_sync: false       # WebSocket (v1.3)

# Design system mapping
design_system:
  name: "material-3"

  # NEW: Map to Figma Variable collections
  variable_collections:
    colors: "Material 3 Colors"
    spacing: "Material 3 Spacing"
    typography: "Material 3 Typography"

  # Fallback values (if variables not found)
  fallback:
    primary_color: "#4A90D9"
    text_color: "#10203A"
    spacing_base: 8
```

---

## Migration Path

### For Existing Users

**No Breaking Changes - Opt-in Approach:**

1. **Keep using plugin** (default behavior if no service token)
2. **Try REST API** by setting `FIGMA_SERVICE_TOKEN` env var
3. **Gradually enable features** via feature flags

**Migration Steps:**

```bash
# Step 1: Install updated version
npm install omni-architect@1.1

# Step 2: Create Figma service account
# (via Figma Settings → Integrations → Generate Service Token)

# Step 3: Configure token
export FIGMA_SERVICE_TOKEN="fst-xxx-yyy"

# Step 4: Enable REST API mode
echo "figma:\n  integration_mode: rest_api" >> .omni-architect.yml

# Step 5: Run as usual
npx omni-architect run --prd_source ./prd.md

# Result: Direct canvas update, no plugin step!
```

---

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **REST API instability** | Medium | High | Maintain plugin fallback; feature flags |
| **Rate limiting** | Medium | Medium | Implement exponential backoff; batch ops |
| **Breaking API changes** | Low | High | Version pinning; integration tests |
| **Service token leaks** | Low | Critical | Secure env vars; rotation policy |
| **Layout algorithm fails** | Medium | Low | Fallback to static positions |
| **Design system mismatch** | Medium | Low | Validation checks; fallback values |

---

## Success Metrics

### Phase 1 (REST API Integration)

- ✅ **Eliminate manual step:** 0% plugin usage for new users with service token
- ✅ **CI/CD adoption:** ≥5 projects using automated Figma updates
- ✅ **Execution time:** <30 seconds end-to-end (vs 2-5 min manual)

### Phase 2 (Vector Rendering)

- ✅ **Visual fidelity:** 90%+ match with Mermaid SVG output
- ✅ **Designer satisfaction:** 8/10+ rating in surveys
- ✅ **Component reuse:** ≥50% of diagrams use shared components

### Phase 3 (Real-Time Sync)

- ✅ **Update latency:** <5 seconds from PRD change to Figma update
- ✅ **Incremental update rate:** ≥80% of updates are delta-based
- ✅ **Collaboration loops:** 3x faster iteration cycles

---

## Recommended Next Steps

### Immediate (Week 1-2)

1. **Research Phase:**
   - Deep dive into Figma Agent API documentation
   - Test API endpoints in Postman/curl
   - Identify exact endpoint URLs and payloads

2. **Proof of Concept:**
   - Build minimal `FigmaAgentClient` class
   - Test creating a simple rectangle via REST API
   - Validate service token authentication

3. **Community Engagement:**
   - Reach out to Figma DevRel for early access
   - Join Figma Agent API beta program (if exists)
   - Share feedback on API usability

### Short-term (Week 3-6)

4. **Phase 1 Implementation:**
   - Implement hybrid plugin/REST API mode
   - Add configuration schema updates
   - Write integration tests
   - Update documentation

5. **Alpha Testing:**
   - Deploy to 3-5 pilot users
   - Gather feedback on API reliability
   - Measure performance improvements

### Mid-term (Month 2-3)

6. **Phase 2 Implementation:**
   - Build vector rendering pipeline
   - Implement auto-layout engine
   - Design system variable binding
   - Component library generation

7. **Beta Release:**
   - Public announcement of REST API support
   - Migration guide for existing users
   - Webinar/tutorial videos

### Long-term (Month 4-6)

8. **Phase 3 Implementation:**
   - Real-time sync via WebSockets
   - Incremental update engine
   - Bi-directional collaboration features

9. **v2.0 Release:**
   - Full Agent API feature parity
   - Deprecate plugin-only mode
   - Industry case studies & testimonials

---

## Conclusion

Figma's new Agent API represents a **transformational opportunity** for Omni Architect. By integrating these capabilities, we can:

- **Eliminate manual workflows** → Save 2-5 minutes per iteration
- **Improve diagram quality** → Professional vector graphics vs text layouts
- **Enable automation** → CI/CD integration for living documentation
- **Enhance collaboration** → Real-time sync between PRD and design

**Recommendation:** Proceed with **Phase 1 (Hybrid Approach)** immediately as a low-risk, high-value quick win. This provides immediate benefits while maintaining backward compatibility, setting the foundation for more advanced features in subsequent phases.

**Total Estimated Effort:**
- Phase 1: 5-7 days (1-2 sprints)
- Phase 2: 7-10 days (2 sprints)
- Phase 3: 10-12 days (2-3 sprints)

**Expected ROI:**
- Time savings: 50-80% reduction in manual steps
- Quality improvement: 3x better visual fidelity
- Adoption increase: 2-3x more users due to automation

---

**Next Action:** Review this assessment with stakeholders and get approval to proceed with Phase 1 implementation.
