/**
 * Figma REST API Client for Agent-based canvas manipulation
 *
 * This client supports the new Figma Agent API that allows programmatic
 * creation and manipulation of canvas nodes via REST API.
 *
 * @see https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/
 */

class FigmaAgentClient {
  constructor(config) {
    this.serviceToken = config.serviceToken;
    this.fileKey = config.fileKey;
    this.baseUrl = 'https://api.figma.com/v1';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Make authenticated request to Figma API
   * @private
   */
  async _request(method, endpoint, body = null, retryCount = 0) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Figma-Token': this.serviceToken,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < this.maxRetries) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        const delay = Math.min(retryAfter * 1000, Math.pow(2, retryCount) * 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._request(method, endpoint, body, retryCount + 1);
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Figma API error: ${response.status} - ${error.error || error.message}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries && this._isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._request(method, endpoint, body, retryCount + 1);
      }
      throw error;
    }
  }

  _isRetryableError(error) {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.message.includes('timeout')
    );
  }

  /**
   * Get file metadata
   */
  async getFile() {
    return this._request('GET', `/files/${this.fileKey}`);
  }

  /**
   * Get pages in the file
   */
  async getPages() {
    const file = await this.getFile();
    return file.document.children.filter(child => child.type === 'PAGE');
  }

  /**
   * Find or create a page
   */
  async ensurePage(pageName) {
    const pages = await this.getPages();
    const existing = pages.find(p => p.name === pageName);

    if (existing) {
      return existing;
    }

    // Create new page
    return this.createPage(pageName);
  }

  /**
   * Create a new page
   */
  async createPage(name) {
    return this._request('POST', `/files/${this.fileKey}/pages`, { name });
  }

  /**
   * Create canvas nodes via REST API
   * Supports the new Agent API for direct canvas manipulation
   *
   * @param {string} parentId - Parent node ID (page or frame)
   * @param {Array} nodes - Array of node definitions
   * @returns {Promise<Object>} Created nodes with IDs
   */
  async createNodes(parentId, nodes) {
    return this._request('POST', `/files/${this.fileKey}/nodes`, {
      parent_id: parentId,
      nodes: nodes,
    });
  }

  /**
   * Update existing nodes
   *
   * @param {Array<string>} nodeIds - Node IDs to update
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Update result
   */
  async updateNodes(nodeIds, properties) {
    return this._request('PATCH', `/files/${this.fileKey}/nodes`, {
      node_ids: nodeIds,
      properties: properties,
    });
  }

  /**
   * Delete nodes
   *
   * @param {Array<string>} nodeIds - Node IDs to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteNodes(nodeIds) {
    return this._request('DELETE', `/files/${this.fileKey}/nodes`, {
      node_ids: nodeIds,
    });
  }

  /**
   * Create connector between two nodes
   * Uses new Agent API connector support
   *
   * @param {Object} config - Connector configuration
   * @returns {Promise<Object>} Created connector
   */
  async createConnector(config) {
    const {
      parentId,
      startNodeId,
      endNodeId,
      label = '',
      connectorLineType = 'ELBOWED', // STRAIGHT | ELBOWED | CURVED
      stroke = { type: 'SOLID', color: { r: 0.2, g: 0.34, b: 0.61 } },
      endArrowType = 'ARROW_FILLED', // NONE | ARROW_FILLED | ARROW_OUTLINE | CIRCLE_FILLED
    } = config;

    return this._request('POST', `/files/${this.fileKey}/connectors`, {
      parent_id: parentId,
      connector: {
        connector_start: { node_id: startNodeId },
        connector_end: { node_id: endNodeId },
        connector_line_type: connectorLineType,
        strokes: [stroke],
        end_arrow_type: endArrowType,
        text: label ? { characters: label } : undefined,
      },
    });
  }

  /**
   * Query design variables (for design system integration)
   *
   * @param {string} collectionName - Variable collection name
   * @returns {Promise<Object>} Variables
   */
  async getVariables(collectionName = null) {
    const response = await this._request('GET', `/files/${this.fileKey}/variables`);

    if (collectionName) {
      const collection = response.meta.variableCollections.find(
        c => c.name === collectionName
      );
      return collection ? collection.variables : [];
    }

    return response;
  }

  /**
   * Batch operations to reduce API calls
   * Applies multiple operations in a single request
   *
   * @param {Array<Object>} operations - Array of operations
   * @returns {Promise<Object>} Batch result
   */
  async applyBatch(operations) {
    return this._request('POST', `/files/${this.fileKey}/batch`, {
      operations: operations,
    });
  }

  /**
   * Create a frame with auto-layout
   *
   * @param {Object} config - Frame configuration
   * @returns {Promise<Object>} Created frame
   */
  async createFrame(config) {
    const {
      parentId,
      name,
      x = 0,
      y = 0,
      width = 200,
      height = 100,
      fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
      strokes = [],
      cornerRadius = 0,
      layoutMode = 'NONE', // NONE | HORIZONTAL | VERTICAL
      padding = { top: 0, right: 0, bottom: 0, left: 0 },
      itemSpacing = 0,
    } = config;

    const frameNode = {
      type: 'FRAME',
      name,
      x,
      y,
      width,
      height,
      fills,
      strokes,
      cornerRadius,
      layoutMode,
      paddingTop: padding.top,
      paddingRight: padding.right,
      paddingBottom: padding.bottom,
      paddingLeft: padding.left,
      itemSpacing,
    };

    const result = await this.createNodes(parentId, [frameNode]);
    return result.nodes[0];
  }

  /**
   * Create a text node
   *
   * @param {Object} config - Text configuration
   * @returns {Promise<Object>} Created text node
   */
  async createText(config) {
    const {
      parentId,
      characters,
      x = 0,
      y = 0,
      fontSize = 14,
      fontFamily = 'Inter',
      fontWeight = 400,
      fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
    } = config;

    const textNode = {
      type: 'TEXT',
      x,
      y,
      characters,
      fontSize,
      fontName: { family: fontFamily, style: this._weightToStyle(fontWeight) },
      fills,
    };

    const result = await this.createNodes(parentId, [textNode]);
    return result.nodes[0];
  }

  /**
   * Create a rectangle with optional rounded corners
   *
   * @param {Object} config - Rectangle configuration
   * @returns {Promise<Object>} Created rectangle
   */
  async createRectangle(config) {
    const {
      parentId,
      name = 'Rectangle',
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }],
      strokes = [],
      cornerRadius = 0,
    } = config;

    const rectNode = {
      type: 'RECTANGLE',
      name,
      x,
      y,
      width,
      height,
      fills,
      strokes,
      cornerRadius,
    };

    const result = await this.createNodes(parentId, [rectNode]);
    return result.nodes[0];
  }

  /**
   * Create a vector node with custom path
   * Useful for complex shapes like decision diamonds
   *
   * @param {Object} config - Vector configuration
   * @returns {Promise<Object>} Created vector
   */
  async createVector(config) {
    const {
      parentId,
      name = 'Vector',
      x = 0,
      y = 0,
      vectorPaths,
      fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }],
      strokes = [],
    } = config;

    const vectorNode = {
      type: 'VECTOR',
      name,
      x,
      y,
      vectorPaths,
      fills,
      strokes,
    };

    const result = await this.createNodes(parentId, [vectorNode]);
    return result.nodes[0];
  }

  /**
   * Helper: Convert font weight to Figma style name
   * @private
   */
  _weightToStyle(weight) {
    const styleMap = {
      100: 'Thin',
      200: 'ExtraLight',
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'SemiBold',
      700: 'Bold',
      800: 'ExtraBold',
      900: 'Black',
    };
    return styleMap[weight] || 'Regular';
  }

  /**
   * Get nodes managed by omni-architect
   * (nodes with specific plugin data marker)
   *
   * @param {string} pageId - Page to search
   * @returns {Promise<Array>} Managed nodes
   */
  async getManagedNodes(pageId) {
    // Note: This requires the Figma API to support plugin data queries
    // Fallback: track node IDs in session state
    const response = await this._request('GET', `/files/${this.fileKey}/nodes`, {
      ids: [pageId],
      plugin_data: {
        namespace: 'omni-architect',
        key: 'managed',
      },
    });

    return response.nodes || [];
  }

  /**
   * Mark a node as managed by omni-architect
   *
   * @param {string} nodeId - Node to mark
   * @returns {Promise<void>}
   */
  async markNodeAsManaged(nodeId) {
    return this._request('PATCH', `/files/${this.fileKey}/nodes/${nodeId}/plugin-data`, {
      namespace: 'omni-architect',
      key: 'managed',
      value: 'true',
    });
  }

  /**
   * Build deep link to Figma node
   *
   * @param {string} nodeId - Node ID
   * @returns {string} Figma URL
   */
  buildDeepLink(nodeId) {
    return `https://www.figma.com/file/${this.fileKey}/?node-id=${encodeURIComponent(nodeId)}`;
  }
}

module.exports = FigmaAgentClient;
