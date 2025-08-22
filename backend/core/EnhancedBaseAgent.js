/**
 * Enhanced Base Agent - Microservices Pattern
 * Provides common functionality for all agents with pluggable capabilities
 */

import { Logger } from '../utils/Logger.js';

export class EnhancedBaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      maxTokens: 1000,
      temperature: 0.7,
      model: 'gpt-4o',
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetrics: true,
      enableCaching: false,
      enableContentSafety: true,
      customInstructions: '',
      ...config
    };

    // Initialize capabilities
    this.capabilities = new Set();
    this.promptTemplates = new Map();
    this.responseProcessors = new Map();
    this.contextProcessors = new Map();
    
    // Metrics
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      lastRequestTime: null
    };

    // Setup default capabilities
    this.setupDefaultCapabilities();
    
    Logger.info(`Enhanced agent initialized: ${this.name}`, { 
      component: this.name,
      capabilities: Array.from(this.capabilities)
    });
  }

  /**
   * Setup default capabilities that all agents share
   */
  setupDefaultCapabilities() {
    this.addCapability('generate', {
      promptTemplate: this.getDefaultPromptTemplate(),
      responseProcessor: this.defaultResponseProcessor.bind(this),
      contextProcessor: this.defaultContextProcessor.bind(this)
    });

    this.addCapability('analyze', {
      promptTemplate: this.getAnalysisPromptTemplate(),
      responseProcessor: this.defaultResponseProcessor.bind(this),
      contextProcessor: this.defaultContextProcessor.bind(this)
    });
  }

  /**
   * Add a capability to the agent
   */
  addCapability(name, config) {
    this.capabilities.add(name);
    
    if (config.promptTemplate) {
      this.promptTemplates.set(name, config.promptTemplate);
    }
    
    if (config.responseProcessor) {
      this.responseProcessors.set(name, config.responseProcessor);
    }
    
    if (config.contextProcessor) {
      this.contextProcessors.set(name, config.contextProcessor);
    }

    Logger.debug(`Capability added to ${this.name}: ${name}`, { 
      component: this.name 
    });
  }

  /**
   * Check if agent has a capability
   */
  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  /**
   * Execute a capability
   */
  async executeCapability(capability, input, context = {}, options = {}) {
    if (!this.hasCapability(capability)) {
      throw new Error(`Agent ${this.name} does not have capability: ${capability}`);
    }

    const startTime = Date.now();
    
    try {
      // Update metrics
      this.updateMetrics('start');

      // Process context
      const processedContext = await this.processContext(capability, context);
      
      // Build prompt
      const prompt = await this.buildPrompt(capability, input, processedContext, options);
      
      // Make LLM call with retry logic
      const rawResponse = await this.makeAPICall(prompt, options);
      
      // Process response
      const processedResponse = await this.processResponse(capability, rawResponse, input, processedContext);
      
      // Update success metrics
      this.updateMetrics('success', Date.now() - startTime);
      
      return processedResponse;

    } catch (error) {
      this.updateMetrics('error', Date.now() - startTime);
      Logger.error(`Capability execution failed: ${capability}`, {
        error: error.message,
        agent: this.name,
        component: this.name
      });
      throw error;
    }
  }

  /**
   * Process context using the appropriate processor
   */
  async processContext(capability, context) {
    const processor = this.contextProcessors.get(capability) || this.defaultContextProcessor;
    return await processor(context);
  }

  /**
   * Build prompt using the appropriate template
   */
  async buildPrompt(capability, input, context, options) {
    const template = this.promptTemplates.get(capability) || this.getDefaultPromptTemplate();
    
    if (typeof template === 'function') {
      return await template(input, context, options, this.config);
    }
    
    // Simple string replacement for basic templates
    return template
      .replace('{input}', input)
      .replace('{context}', JSON.stringify(context))
      .replace('{customInstructions}', this.config.customInstructions || '');
  }

  /**
   * Process response using the appropriate processor
   */
  async processResponse(capability, rawResponse, input, context) {
    const processor = this.responseProcessors.get(capability) || this.defaultResponseProcessor;
    return await processor(rawResponse, input, context);
  }

  /**
   * Make API call with retry logic
   */
  async makeAPICall(prompt, options = {}) {
    const finalConfig = { ...this.config, ...options };
    let lastError;

    for (let attempt = 1; attempt <= finalConfig.retryAttempts; attempt++) {
      try {
        // This would be implemented by subclasses for specific LLM providers
        const response = await this.callLLM(prompt, finalConfig);
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < finalConfig.retryAttempts) {
          const delay = finalConfig.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          Logger.warn(`API call failed, retrying in ${delay}ms`, {
            agent: this.name,
            attempt,
            error: error.message
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Call LLM - to be implemented by subclasses
   */
  async callLLM(prompt, config) {
    throw new Error('callLLM must be implemented by subclass');
  }

  /**
   * Default prompt template
   */
  getDefaultPromptTemplate() {
    return (input, context, options, config) => {
      return `You are ${this.name}, an educational AI assistant.

${config.customInstructions}

Context: ${JSON.stringify(context)}

User input: ${input}

Please provide a helpful, educational response appropriate for the given context.`;
    };
  }

  /**
   * Analysis prompt template
   */
  getAnalysisPromptTemplate() {
    return (input, context, options, config) => {
      return `You are ${this.name}, an educational AI assistant specializing in analysis.

Analyze the following input in the given context:

Context: ${JSON.stringify(context)}
Input to analyze: ${input}

Provide a detailed analysis that is educational and appropriate for the given context.`;
    };
  }

  /**
   * Default context processor
   */
  async defaultContextProcessor(context) {
    // Extract relevant information from context
    const processed = {
      ageGroup: context.ageGroup || '8-10',
      subject: context.subject || 'general',
      mode: context.mode || 'explore',
      history: context.history || [],
      preferences: context.preferences || {},
      timestamp: Date.now()
    };

    // Add age-appropriate adjustments
    processed.complexity = this.getComplexityForAge(processed.ageGroup);
    processed.vocabulary = this.getVocabularyForAge(processed.ageGroup);
    
    return processed;
  }

  /**
   * Default response processor
   */
  async defaultResponseProcessor(rawResponse, input, context) {
    // Basic processing - extract content from response
    let content = rawResponse;
    
    if (typeof rawResponse === 'object' && rawResponse.choices) {
      content = rawResponse.choices[0]?.message?.content || rawResponse.choices[0]?.text;
    }
    
    if (typeof rawResponse === 'object' && rawResponse.content) {
      content = rawResponse.content;
    }

    return {
      content,
      agent: this.name,
      capability: 'generate',
      timestamp: new Date().toISOString(),
      context: {
        ageGroup: context.ageGroup,
        subject: context.subject,
        mode: context.mode
      }
    };
  }

  /**
   * Get complexity level for age group
   */
  getComplexityForAge(ageGroup) {
    const complexityMap = {
      '5-7': 'simple',
      '8-10': 'elementary',
      '11-13': 'intermediate',
      '14-17': 'advanced'
    };
    return complexityMap[ageGroup] || 'elementary';
  }

  /**
   * Get vocabulary level for age group
   */
  getVocabularyForAge(ageGroup) {
    const vocabularyMap = {
      '5-7': 'basic',
      '8-10': 'elementary',
      '11-13': 'intermediate',
      '14-17': 'advanced'
    };
    return vocabularyMap[ageGroup] || 'elementary';
  }

  /**
   * Update metrics
   */
  updateMetrics(type, duration = 0) {
    this.metrics.lastRequestTime = Date.now();
    
    switch (type) {
      case 'start':
        this.metrics.requestCount++;
        break;
      case 'success':
        this.metrics.successCount++;
        this.metrics.totalResponseTime += duration;
        break;
      case 'error':
        this.metrics.errorCount++;
        break;
    }
  }

  /**
   * Get agent metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.successCount > 0 
      ? this.metrics.totalResponseTime / this.metrics.successCount 
      : 0;

    return {
      ...this.metrics,
      avgResponseTime,
      successRate: this.metrics.requestCount > 0 
        ? (this.metrics.successCount / this.metrics.requestCount) * 100 
        : 0,
      capabilities: Array.from(this.capabilities)
    };
  }

  /**
   * Validate input for capability
   */
  validateInput(capability, input, context) {
    if (!this.hasCapability(capability)) {
      throw new Error(`Capability not supported: ${capability}`);
    }

    if (!input || (typeof input === 'string' && input.trim().length === 0)) {
      throw new Error('Input is required');
    }

    if (!context || typeof context !== 'object') {
      throw new Error('Context must be an object');
    }

    return true;
  }

  /**
   * Create a specialized method for a capability
   */
  createMethod(capability, methodName = capability) {
    if (!this.hasCapability(capability)) {
      throw new Error(`Cannot create method for unsupported capability: ${capability}`);
    }

    this[methodName] = async (input, context = {}, options = {}) => {
      this.validateInput(capability, input, context);
      return await this.executeCapability(capability, input, context, options);
    };

    return this[methodName];
  }

  /**
   * Bulk create methods for all capabilities
   */
  createMethodsForAllCapabilities() {
    for (const capability of this.capabilities) {
      this.createMethod(capability);
    }
  }

  /**
   * Add content safety check
   */
  async checkContentSafety(content) {
    if (!this.config.enableContentSafety) {
      return { safe: true };
    }

    // This would integrate with your content safety service
    // For now, basic checks
    const flaggedWords = ['inappropriate', 'harmful', 'unsafe'];
    const lowerContent = content.toLowerCase();
    
    for (const word of flaggedWords) {
      if (lowerContent.includes(word)) {
        return { 
          safe: false, 
          reason: `Content contains flagged word: ${word}` 
        };
      }
    }

    return { safe: true };
  }

  /**
   * Get agent configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    Logger.info(`Configuration updated for ${this.name}`, { 
      component: this.name 
    });
  }

  /**
   * Reset agent metrics
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      lastRequestTime: null
    };
  }

  /**
   * Get agent health status
   */
  getHealth() {
    const metrics = this.getMetrics();
    const isHealthy = metrics.successRate >= 80; // Consider healthy if 80%+ success rate
    
    return {
      name: this.name,
      status: isHealthy ? 'healthy' : 'degraded',
      capabilities: Array.from(this.capabilities),
      metrics,
      config: {
        model: this.config.model,
        enableMetrics: this.config.enableMetrics,
        enableContentSafety: this.config.enableContentSafety
      }
    };
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.capabilities.clear();
    this.promptTemplates.clear();
    this.responseProcessors.clear();
    this.contextProcessors.clear();
    
    Logger.info(`Agent cleaned up: ${this.name}`, { component: this.name });
  }
}

export default EnhancedBaseAgent;
