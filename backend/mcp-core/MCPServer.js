#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Server Implementation
 * Scales the microservices architecture to full MCP server with tools, resources, and prompts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { MCPToolRegistry } from './MCPToolRegistry.js';
import { MCPResourceManager } from './MCPResourceManager.js';
import { MCPAgentOrchestrator } from './MCPAgentOrchestrator.js';
import { MCPServiceDiscovery } from './MCPServiceDiscovery.js';
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced MCP Server with microservices orchestration
 */
export class MCPServer {
  constructor(config = {}) {
    this.config = {
      name: 'gpt-for-kids-educational-platform',
      version: '2.0.0',
      description: 'MCP server for educational AI platform with dynamic agent orchestration',
      maxConnections: 10,
      enableMetrics: true,
      enableCaching: true,
      enableValidation: true,
      enableAgentOrchestrator: true,
      ...config
    };

    // this.logger removed('MCPServer');
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {},
        },
      }
    );

    // Initialize core components
    this.toolRegistry = new MCPToolRegistry(this);
    this.resourceManager = new MCPResourceManager(this);
    
    // Conditionally initialize agent orchestrator
    if (this.config.enableAgentOrchestrator) {
      this.agentOrchestrator = new MCPAgentOrchestrator(this);
    } else {
      this.agentOrchestrator = null;
    }
    
    this.serviceDiscovery = new MCPServiceDiscovery(this);

    // AI clients (will be set externally)
    this.openaiClient = null;
    this.anthropicClient = null;

    // Metrics and monitoring
    this.metrics = {
      toolCalls: 0,
      resourceAccess: 0,
      promptRequests: 0,
      errors: 0,
      uptime: Date.now()
    };

    this.setupHandlers();
    Logger.info('MCP Server initialized', { 
      name: this.config.name,
      version: this.config.version 
    });
  }

  /**
   * Setup MCP protocol handlers
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = await this.toolRegistry.listTools();
        Logger.debug(`Listed ${tools.length} tools`);
        return { tools };
      } catch (error) {
        Logger.error('Error listing tools:', error);
        this.metrics.errors++;
        throw error;
      }
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        this.metrics.toolCalls++;
        const { name, arguments: args } = request.params;
        
        Logger.info(`Executing tool: ${name}`, { arguments: args });
        
        const result = await this.toolRegistry.executeTool(name, args);
        
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        Logger.error(`Error executing tool ${request.params.name}:`, error);
        this.metrics.errors++;
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await this.resourceManager.listResources();
        Logger.debug(`Listed ${resources.length} resources`);
        return { resources };
      } catch (error) {
        Logger.error('Error listing resources:', error);
        this.metrics.errors++;
        throw error;
      }
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        this.metrics.resourceAccess++;
        const { uri } = request.params;
        
        Logger.info(`Reading resource: ${uri}`);
        
        const content = await this.resourceManager.readResource(uri);
        
        return {
          contents: [
            {
              uri,
              mimeType: content.mimeType || 'text/plain',
              text: content.text || JSON.stringify(content.data, null, 2)
            }
          ]
        };
      } catch (error) {
        Logger.error(`Error reading resource ${request.params.uri}:`, error);
        this.metrics.errors++;
        throw error;
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      try {
        const prompts = await this.agentOrchestrator.listPrompts();
        Logger.debug(`Listed ${prompts.length} prompts`);
        return { prompts };
      } catch (error) {
        Logger.error('Error listing prompts:', error);
        this.metrics.errors++;
        throw error;
      }
    });

    // Get prompt content
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        this.metrics.promptRequests++;
        const { name, arguments: args } = request.params;
        
        Logger.info(`Getting prompt: ${name}`, { arguments: args });
        
        const prompt = await this.agentOrchestrator.getPrompt(name, args);
        
        return {
          description: prompt.description,
          messages: prompt.messages
        };
      } catch (error) {
        Logger.error(`Error getting prompt ${request.params.name}:`, error);
        this.metrics.errors++;
        throw error;
      }
    });
  }

  /**
   * Initialize and register all agents and services
   */
  async initialize() {
    try {
      Logger.info('Initializing MCP server components...');

      // Initialize service discovery
      await this.serviceDiscovery.initialize();
      
      // Initialize agent orchestrator if enabled
      if (this.agentOrchestrator) {
        await this.agentOrchestrator.initialize();
      }
      
      // Register core educational tools
      await this.registerCoreTools();
      
      // Register educational resources
      await this.registerCoreResources();
      
      // Register agents as services (if orchestrator enabled)
      if (this.agentOrchestrator) {
        await this.registerAgentServices();
      }
      
      Logger.info('MCP server initialization complete', {
        tools: await this.toolRegistry.getToolCount(),
        resources: await this.resourceManager.getResourceCount(),
        agents: this.agentOrchestrator ? await this.agentOrchestrator.getAgentCount() : 0
      });

    } catch (error) {
      Logger.error('Failed to initialize MCP server:', error);
      throw error;
    }
  }

  /**
   * Set OpenAI client
   */
  setOpenAIClient(client) {
    this.openaiClient = client;
    Logger.info('OpenAI client set for MCP server');
  }

  /**
   * Set Anthropic client
   */
  setAnthropicClient(client) {
    this.anthropicClient = client;
    Logger.info('Anthropic client set for MCP server');
  }

  /**
   * Set Agent Manager for direct tool execution
   */
  setAgentManager(agentManager) {
    this.agentManager = agentManager;
    Logger.info('Agent Manager set for MCP server');
  }

  /**
   * Call a registered tool
   */
  async callTool(name, args = {}) {
    try {
      return await this.toolRegistry.executeTool(name, args);
    } catch (error) {
      Logger.error(`Failed to call tool ${name}:`, error);
      throw error;
    }
  }

  /**
   * List all available tools
   */
  async listTools() {
    try {
      return await this.toolRegistry.listTools();
    } catch (error) {
      Logger.error('Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * List all available resources
   */
  async listResources() {
    try {
      return await this.resourceManager.listResources();
    } catch (error) {
      Logger.error('Failed to list resources:', error);
      throw error;
    }
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
        logging: true
      },
      metrics: this.metrics,
      uptime: Date.now() - this.metrics.uptime
    };
  }

  /**
   * Register core educational tools
   */
  async registerCoreTools() {
    // Educational content generation tools
    await this.toolRegistry.registerTool({
      name: 'generate-educational-content',
      description: 'Generate age-appropriate educational content on any topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'The educational topic' },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          contentType: { type: 'string', enum: ['story', 'explanation', 'quiz', 'activity'] },
          context: { type: 'array', items: { type: 'object' }, description: 'Previous conversation context' }
        },
        required: ['topic', 'ageGroup', 'contentType']
      },
      handler: async (args) => {
        return await this.agentOrchestrator.generateEducationalContent(args);
      }
    });

    // Socratic learning tool
    await this.toolRegistry.registerTool({
      name: 'socratic-dialogue',
      description: 'Engage in Socratic dialogue to guide learning through questions',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Student question or response' },
          subject: { type: 'string', description: 'Subject area' },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          mode: { type: 'string', enum: ['socratic', 'answer-first', 'deep-dive'] },
          context: { type: 'array', items: { type: 'object' }, description: 'Previous conversation context as array of ChatMessage objects' }
        },
        required: ['question', 'subject', 'ageGroup']
      },
      handler: async (args) => {
        if (!this.agentManager) {
          throw new Error('Agent Manager not available');
        }
        
        // Use the SocraticLearningAgent directly via AgentManager
        const response = await this.agentManager.handleChatRequest({
          message: args.question,
          mode: 'learn',
          ageGroup: args.ageGroup,
          context: args.context || [],
          subject: args.subject
        });
        
        return response;
      }
    });

    // Assessment and feedback tool
    await this.toolRegistry.registerTool({
      name: 'provide-feedback',
      description: 'Provide constructive, age-appropriate feedback on student work',
      inputSchema: {
        type: 'object',
        properties: {
          studentWork: { type: 'string', description: 'The student work to assess' },
          type: { type: 'string', description: 'Type of work (essay, math, art, etc.)' },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          criteria: { type: 'array', items: { type: 'string' }, description: 'Assessment criteria' }
        },
        required: ['studentWork', 'type', 'ageGroup']
      },
      handler: async (args) => {
        return await this.agentOrchestrator.provideFeedback(args);
      }
    });

    // Curriculum-based content tool
    await this.toolRegistry.registerTool({
      name: 'curriculum-content',
      description: 'Generate curriculum-specific educational content',
      inputSchema: {
        type: 'object',
        properties: {
          subject: { type: 'string', description: 'Subject area' },
          grade: { type: 'string', description: 'Grade level' },
          board: { type: 'string', enum: ['NCERT', 'CBSE', 'ICSE', 'IB', 'Cambridge'] },
          topic: { type: 'string', description: 'Specific topic or chapter' },
          contentType: { type: 'string', enum: ['summary', 'exercises', 'toc', 'explanation'] }
        },
        required: ['subject', 'grade', 'board', 'topic', 'contentType']
      },
      handler: async (args) => {
        return await this.agentOrchestrator.generateCurriculumContent(args);
      }
    });

    // Creative content generation tool
    await this.toolRegistry.registerTool({
      name: 'create-story',
      description: 'Create engaging, educational stories for children',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Story topic or theme' },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          duration: { type: 'string', enum: ['short', 'medium', 'long'] },
          characters: { type: 'array', items: { type: 'string' }, description: 'Preferred characters' },
          setting: { type: 'string', description: 'Story setting' }
        },
        required: ['topic', 'ageGroup']
      },
      handler: async (args) => {
        return await this.agentOrchestrator.createStory(args);
      }
    });

    // Exploration and discovery tool
    await this.toolRegistry.registerTool({
      name: 'explore-topic',
      description: 'Guide exploration and discovery of educational topics',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Topic or question to explore' },
          inputType: { type: 'string', enum: ['text', 'image'] },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          context: { type: 'array', items: { type: 'object' }, description: 'Previous conversation context as array of ChatMessage objects' }
        },
        required: ['input', 'ageGroup']
      },
      handler: async (args) => {
        if (!this.agentManager) {
          throw new Error('Agent Manager not available');
        }
        
        // Use the ExplorationAgent directly via AgentManager
        const response = await this.agentManager.handleChatRequest({
          message: args.input,
          mode: 'explore',
          ageGroup: args.ageGroup,
          context: args.context || []
        });
        
        return response;
      }
    });

    // Quiz generation tool
    await this.toolRegistry.registerTool({
      name: 'generate-quiz',
      description: 'Generate contextual quizzes with web-enhanced content',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Quiz topic' },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          questionCount: { type: 'number', minimum: 1, maximum: 20 },
          quizType: { type: 'string', enum: ['multiple-choice', 'true-false', 'short-answer', 'mixed'] },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'auto'] }
        },
        required: ['topic', 'ageGroup']
      },
      handler: async (args) => {
        return await this.agentOrchestrator.generateQuiz(args);
      }
    });

    // File analysis tool
    await this.toolRegistry.registerTool({
      name: 'analyze-files',
      description: 'Analyze uploaded educational files (PDFs, images) for learning content',
      inputSchema: {
        type: 'object',
        properties: {
          files: { 
            type: 'array', 
            items: { 
              type: 'object',
              properties: {
                filename: { type: 'string' },
                mimeType: { type: 'string' },
                content: { type: 'string', description: 'Base64 encoded file content' }
              },
              required: ['filename', 'mimeType', 'content']
            }
          },
          ageGroup: { type: 'string', enum: ['5-7', '8-10', '11-13', '14-17'] },
          analysisType: { type: 'string', enum: ['educational', 'summary', 'questions', 'activities'] }
        },
        required: ['files', 'ageGroup']
      },
      handler: async (args) => {
        return await this.agentOrchestrator.analyzeEducationalFiles(args);
      }
    });

    Logger.info('Core educational tools registered');
  }

  /**
   * Register core educational resources
   */
  async registerCoreResources() {
    // Curriculum data resource
    await this.resourceManager.registerResource({
      uri: 'curriculum://data/subjects',
      name: 'Educational Subjects Data',
      description: 'Comprehensive curriculum data for all educational boards',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agentOrchestrator.getCurriculumData();
      }
    });

    // Age group configurations
    await this.resourceManager.registerResource({
      uri: 'config://age-groups',
      name: 'Age Group Configurations',
      description: 'Age-specific learning configurations and guidelines',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agentOrchestrator.getAgeGroupConfigurations();
      }
    });

    // Learning objectives database
    await this.resourceManager.registerResource({
      uri: 'learning://objectives',
      name: 'Learning Objectives Database',
      description: 'Comprehensive database of learning objectives by subject and age',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agentOrchestrator.getLearningObjectives();
      }
    });

    // Educational standards
    await this.resourceManager.registerResource({
      uri: 'standards://educational',
      name: 'Educational Standards',
      description: 'Educational standards and benchmarks for different curricula',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agentOrchestrator.getEducationalStandards();
      }
    });

    // Safety guidelines
    await this.resourceManager.registerResource({
      uri: 'safety://guidelines',
      name: 'Content Safety Guidelines',
      description: 'Age-appropriate content safety guidelines and filters',
      mimeType: 'application/json',
      handler: async () => {
        return await this.agentOrchestrator.getSafetyGuidelines();
      }
    });

    Logger.info('Core educational resources registered');
  }

  /**
   * Register agents as microservices
   */
  async registerAgentServices() {
    const agents = await this.agentOrchestrator.getAllAgents();
    
    for (const [agentName, agent] of agents) {
      await this.serviceDiscovery.registerService({
        name: agentName,
        type: 'agent',
        capabilities: Array.from(agent.capabilities || []),
        health: agent.getHealth ? await agent.getHealth() : { status: 'unknown' },
        metadata: {
          version: agent.version || '1.0.0',
          description: agent.description || `${agentName} educational agent`
        }
      });
    }

    Logger.info(`Registered ${agents.size} agents as microservices`);
  }

  /**
   * Start the MCP server
   */
  async start() {
    try {
      await this.initialize();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      Logger.info('MCP server started successfully', {
        name: this.config.name,
        version: this.config.version,
        pid: process.pid
      });

      // Setup graceful shutdown
      process.on('SIGINT', () => this.shutdown('SIGINT'));
      process.on('SIGTERM', () => this.shutdown('SIGTERM'));

    } catch (error) {
      Logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Get server metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      services: this.serviceDiscovery.getServiceCount(),
      tools: this.toolRegistry.getToolCount(),
      resources: this.resourceManager.getResourceCount(),
      agents: this.agentOrchestrator.getAgentCount()
    };
  }

  /**
   * Get server health status
   */
  async getHealth() {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.metrics.uptime,
        services: await this.serviceDiscovery.getHealth(),
        agents: await this.agentOrchestrator.getHealth(),
        metrics: this.getMetrics()
      };

      return health;
    } catch (error) {
      Logger.error('Error checking health:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle WebSocket connection for MCP protocol
   */
  async handleConnection(ws) {
    Logger.info('🔌 Handling new MCP WebSocket connection');
    
    try {
      // Set up WebSocket message handling
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const response = await this.handleMessage(message);
          ws.send(JSON.stringify(response));
        } catch (error) {
          Logger.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            error: { code: -32603, message: 'Internal error' }
          }));
        }
      });

      ws.on('close', () => {
        Logger.info('🔌 MCP WebSocket connection closed');
      });

      ws.on('error', (error) => {
        Logger.error('🔌 WebSocket error:', error);
      });

      // Send initial capabilities
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 'init',
        result: {
          capabilities: this.getCapabilities(),
          serverInfo: this.getServerInfo()
        }
      }));

    } catch (error) {
      Logger.error('Failed to handle WebSocket connection:', error);
      throw error;
    }
  }

  /**
   * Handle MCP protocol message
   */
  async handleMessage(message) {
    const { method, params, id } = message;

    try {
      let result;

      switch (method) {
        case 'tools/list':
          result = await this.listTools();
          break;
        case 'tools/call':
          result = await this.callTool(params.name, params.arguments);
          break;
        case 'resources/list':
          result = await this.listResources();
          break;
        case 'resources/read':
          result = await this.readResource(params.uri);
          break;
        case 'prompts/list':
          result = await this.listPrompts();
          break;
        case 'prompts/get':
          result = await this.getPrompt(params.name, params.arguments);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      return {
        jsonrpc: '2.0',
        id,
        result
      };

    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(signal) {
    Logger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      // Cleanup components (only if they exist)
      if (this.agentOrchestrator && typeof this.agentOrchestrator.cleanup === 'function') {
        await this.agentOrchestrator.cleanup();
      }
      if (this.serviceDiscovery && typeof this.serviceDiscovery.cleanup === 'function') {
        await this.serviceDiscovery.cleanup();
      }
      if (this.resourceManager && typeof this.resourceManager.cleanup === 'function') {
        await this.resourceManager.cleanup();
      }
      if (this.toolRegistry && typeof this.toolRegistry.cleanup === 'function') {
        await this.toolRegistry.cleanup();
      }
      
      Logger.info('MCP server shutdown complete');
      process.exit(0);
    } catch (error) {
      Logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Export for programmatic use
export default MCPServer;

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MCPServer();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
