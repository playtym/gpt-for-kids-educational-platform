/**
 * MCP Tool Registry - Dynamic Tool Management System
 * Manages registration, discovery, and execution of educational tools
 */

import { Logger } from '../utils/Logger.js';

export class MCPToolRegistry {
  constructor(mcpServer) {
    this.mcpServer = mcpServer;
    // this.logger removed('MCPToolRegistry');
    
    // Tool storage and management
    this.tools = new Map();
    this.toolCategories = new Map();
    this.toolMetrics = new Map();
    this.toolValidators = new Map();
    
    // Tool execution tracking
    this.executionHistory = [];
    this.maxHistorySize = 1000;
    
    Logger.info('MCP Tool Registry initialized');
  }

  /**
   * Register a new tool
   */
  async registerTool(toolConfig) {
    try {
      const {
        name,
        description,
        inputSchema,
        handler,
        category = 'general',
        version = '1.0.0',
        metadata = {},
        validator = null,
        rateLimit = null
      } = toolConfig;

      if (!name || !description || !inputSchema || !handler) {
        throw new Error('Tool registration requires name, description, inputSchema, and handler');
      }

      if (this.tools.has(name)) {
        Logger.warn(`Tool ${name} already exists, updating...`);
      }

      const tool = {
        name,
        description,
        inputSchema,
        handler,
        category,
        version,
        metadata: {
          ...metadata,
          registeredAt: new Date().toISOString(),
          lastUsed: null,
          usageCount: 0
        },
        validator,
        rateLimit
      };

      this.tools.set(name, tool);
      
      // Update category mapping
      if (!this.toolCategories.has(category)) {
        this.toolCategories.set(category, new Set());
      }
      this.toolCategories.get(category).add(name);

      // Initialize metrics
      this.toolMetrics.set(name, {
        callCount: 0,
        successCount: 0,
        errorCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastExecutionTime: null,
        errors: []
      });

      // Set validator if provided
      if (validator) {
        this.toolValidators.set(name, validator);
      }

      Logger.info(`Tool registered: ${name}`, { 
        category, 
        version, 
        totalTools: this.tools.size 
      });

      return { success: true, tool: name };

    } catch (error) {
      Logger.error('Error registering tool:', error);
      throw error;
    }
  }

  /**
   * List all available tools
   */
  async listTools() {
    try {
      const tools = [];

      for (const [name, tool] of this.tools) {
        tools.push({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          category: tool.category,
          version: tool.version,
          metadata: {
            ...tool.metadata,
            metrics: this.toolMetrics.get(name)
          }
        });
      }

      return tools.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

    } catch (error) {
      Logger.error('Error listing tools:', error);
      throw error;
    }
  }

  /**
   * Execute a tool
   */
  async executeTool(name, args) {
    const startTime = Date.now();
    let success = false;

    try {
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      // Update metrics - call count
      const metrics = this.toolMetrics.get(name);
      metrics.callCount++;
      metrics.lastExecutionTime = new Date().toISOString();

      // Update tool metadata
      tool.metadata.lastUsed = new Date().toISOString();
      tool.metadata.usageCount++;

      // Validate input if validator exists
      if (this.toolValidators.has(name)) {
        const validator = this.toolValidators.get(name);
        const validation = await validator(args);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Basic schema validation
      if (tool.inputSchema) {
        this.validateInputSchema(args, tool.inputSchema);
      }

      // Check rate limiting
      if (tool.rateLimit) {
        await this.checkRateLimit(name, tool.rateLimit);
      }

      Logger.info(`Executing tool: ${name}`, { arguments: args });

      // Execute the tool
      const result = await tool.handler(args);
      
      success = true;
      metrics.successCount++;
      
      // Log execution
      this.addExecutionHistory({
        tool: name,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: true,
        args,
        result: typeof result === 'string' ? result.substring(0, 200) : 'non-string result'
      });

      return result;

    } catch (error) {
      const metrics = this.toolMetrics.get(name);
      if (metrics) {
        metrics.errorCount++;
        metrics.errors.push({
          timestamp: new Date().toISOString(),
          error: error.message,
          args
        });
        
        // Keep only last 10 errors
        if (metrics.errors.length > 10) {
          metrics.errors = metrics.errors.slice(-10);
        }
      }

      // Log execution error
      this.addExecutionHistory({
        tool: name,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        args,
        error: error.message
      });

      Logger.error(`Tool execution failed: ${name}`, { error: error.message, args });
      throw error;

    } finally {
      // Update execution time metrics
      const duration = Date.now() - startTime;
      const metrics = this.toolMetrics.get(name);
      if (metrics && success) {
        metrics.totalExecutionTime += duration;
        metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.successCount;
      }
    }
  }

  /**
   * Validate input against schema
   */
  validateInputSchema(input, schema) {
    if (schema.type === 'object' && schema.properties) {
      // Check required properties
      if (schema.required) {
        for (const required of schema.required) {
          if (!(required in input)) {
            throw new Error(`Missing required property: ${required}`);
          }
        }
      }

      // Validate property types
      for (const [prop, value] of Object.entries(input)) {
        if (schema.properties[prop]) {
          this.validatePropertyType(value, schema.properties[prop], prop);
        }
      }
    }
  }

  /**
   * Validate property type
   */
  validatePropertyType(value, propSchema, propName) {
    switch (propSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Property ${propName} must be a string`);
        }
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          throw new Error(`Property ${propName} must be one of: ${propSchema.enum.join(', ')}`);
        }
        break;
      
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Property ${propName} must be a number`);
        }
        if (propSchema.minimum !== undefined && value < propSchema.minimum) {
          throw new Error(`Property ${propName} must be >= ${propSchema.minimum}`);
        }
        if (propSchema.maximum !== undefined && value > propSchema.maximum) {
          throw new Error(`Property ${propName} must be <= ${propSchema.maximum}`);
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Property ${propName} must be an array`);
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          throw new Error(`Property ${propName} must be an object`);
        }
        break;
    }
  }

  /**
   * Check rate limiting for tool
   */
  async checkRateLimit(toolName, rateLimit) {
    // Simple rate limiting implementation
    // In production, you might want to use Redis or more sophisticated rate limiting
    const now = Date.now();
    const windowStart = now - (rateLimit.windowMs || 60000); // Default 1 minute window
    
    const recentExecutions = this.executionHistory.filter(exec => 
      exec.tool === toolName && 
      new Date(exec.timestamp).getTime() > windowStart
    );

    if (recentExecutions.length >= (rateLimit.maxCalls || 10)) {
      throw new Error(`Rate limit exceeded for tool ${toolName}`);
    }
  }

  /**
   * Add execution to history
   */
  addExecutionHistory(execution) {
    this.executionHistory.push(execution);
    
    // Maintain history size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get tool by name
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    const toolNames = this.toolCategories.get(category) || new Set();
    const tools = [];
    
    for (const name of toolNames) {
      const tool = this.tools.get(name);
      if (tool) {
        tools.push(tool);
      }
    }
    
    return tools;
  }

  /**
   * Get tool metrics
   */
  getToolMetrics(name = null) {
    if (name) {
      return this.toolMetrics.get(name);
    }
    
    // Return all metrics
    const allMetrics = {};
    for (const [toolName, metrics] of this.toolMetrics) {
      allMetrics[toolName] = metrics;
    }
    return allMetrics;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(toolName = null, limit = 100) {
    let history = this.executionHistory;
    
    if (toolName) {
      history = history.filter(exec => exec.tool === toolName);
    }
    
    return history.slice(-limit);
  }

  /**
   * Remove a tool
   */
  async removeTool(name) {
    try {
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      // Remove from category mapping
      const category = tool.category;
      if (this.toolCategories.has(category)) {
        this.toolCategories.get(category).delete(name);
        if (this.toolCategories.get(category).size === 0) {
          this.toolCategories.delete(category);
        }
      }

      // Remove tool data
      this.tools.delete(name);
      this.toolMetrics.delete(name);
      this.toolValidators.delete(name);

      Logger.info(`Tool removed: ${name}`);
      return { success: true };

    } catch (error) {
      Logger.error('Error removing tool:', error);
      throw error;
    }
  }

  /**
   * Update tool
   */
  async updateTool(name, updates) {
    try {
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      const updatedTool = {
        ...tool,
        ...updates,
        metadata: {
          ...tool.metadata,
          ...updates.metadata,
          updatedAt: new Date().toISOString()
        }
      };

      this.tools.set(name, updatedTool);

      Logger.info(`Tool updated: ${name}`);
      return { success: true };

    } catch (error) {
      Logger.error('Error updating tool:', error);
      throw error;
    }
  }

  /**
   * Search tools
   */
  searchTools(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [name, tool] of this.tools) {
      const matchScore = this.calculateMatchScore(tool, searchTerm);
      if (matchScore > 0) {
        results.push({
          tool,
          score: matchScore
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.tool);
  }

  /**
   * Calculate match score for search
   */
  calculateMatchScore(tool, searchTerm) {
    let score = 0;

    // Name match (highest weight)
    if (tool.name.toLowerCase().includes(searchTerm)) {
      score += 10;
    }

    // Description match
    if (tool.description.toLowerCase().includes(searchTerm)) {
      score += 5;
    }

    // Category match
    if (tool.category.toLowerCase().includes(searchTerm)) {
      score += 3;
    }

    // Metadata match
    const metadataString = JSON.stringify(tool.metadata).toLowerCase();
    if (metadataString.includes(searchTerm)) {
      score += 1;
    }

    return score;
  }

  /**
   * Get tool count
   */
  getToolCount() {
    return this.tools.size;
  }

  /**
   * Get registry health
   */
  getHealth() {
    const totalCalls = Array.from(this.toolMetrics.values())
      .reduce((sum, metrics) => sum + metrics.callCount, 0);
    
    const totalSuccess = Array.from(this.toolMetrics.values())
      .reduce((sum, metrics) => sum + metrics.successCount, 0);

    const successRate = totalCalls > 0 ? (totalSuccess / totalCalls) * 100 : 0;

    return {
      status: 'healthy',
      toolCount: this.tools.size,
      categoryCount: this.toolCategories.size,
      totalExecutions: totalCalls,
      successRate: Math.round(successRate * 100) / 100,
      executionHistorySize: this.executionHistory.length
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    Logger.info('Cleaning up tool registry...');
    
    this.tools.clear();
    this.toolCategories.clear();
    this.toolMetrics.clear();
    this.toolValidators.clear();
    this.executionHistory = [];
    
    Logger.info('Tool registry cleanup complete');
  }
}

export default MCPToolRegistry;
