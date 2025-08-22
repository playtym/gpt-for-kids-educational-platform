#!/usr/bin/env node

/**
 * GPT for Kids - Educational AI Platform Server with MCP Integration
 * 
 * This server integrates the Model Context Protocol (MCP) with the existing
 * educational platform, providing both HTTP API endpoints and MCP protocol support.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import MCP components
import { MCPServer } from './mcp-core/MCPServer.js';
import { MCPToolRegistry } from './mcp-core/MCPToolRegistry.js';
import { MCPResourceManager } from './mcp-core/MCPResourceManager.js';
import { MCPAgentOrchestrator } from './mcp-core/MCPAgentOrchestrator.js';
import { MCPServiceDiscovery } from './mcp-core/MCPServiceDiscovery.js';

// Import existing services
import { AgentManager } from './services/AgentManager.js';
import { ContentSafetyManager } from './services/ContentSafetyManager.js';
import { Logger } from './utils/Logger.js';

// Import routes
import topicRoutes from './routes/topicRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Enhanced Configuration
const CONFIG = {
  server: {
    port: process.env.PORT || 3000,
    mcpPort: process.env.MCP_PORT || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxTokens: 1000
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1000
  },
  safety: {
    enabled: true,
    strictMode: process.env.NODE_ENV === 'production'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

class EducationalPlatformServer {
  constructor() {
    this.app = express();
    this.httpServer = null;
    this.wsServer = null;
    this.mcpServer = null;
    this.agentManager = null;
    this.openai = null;
    this.anthropic = null;
  }

  async initialize() {
    try {
      Logger.info('🚀 Initializing Educational Platform Server with MCP...');

      // Initialize AI clients
      await this.initializeAIClients();

      // Initialize services
      await this.initializeServices();

      // Initialize MCP server
      await this.initializeMCPServer();

      // Setup Express app
      await this.setupExpress();

      // Setup HTTP and WebSocket servers
      await this.setupServers();

      // Setup routes
      await this.setupRoutes();

      Logger.info('✅ Educational Platform Server initialized successfully');

    } catch (error) {
      Logger.error('❌ Failed to initialize server:', error);
      throw error;
    }
  }

  async initializeAIClients() {
    // Initialize OpenAI
    if (CONFIG.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: CONFIG.openai.apiKey
      });
      Logger.info('✅ OpenAI client initialized');
    } else {
      Logger.warn('⚠️  OpenAI API key not provided');
    }

    // Initialize Anthropic
    if (CONFIG.anthropic.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: CONFIG.anthropic.apiKey
      });
      Logger.info('✅ Anthropic client initialized');
    } else {
      Logger.warn('⚠️  Anthropic API key not provided');
    }
  }

  async initializeServices() {
    // Initialize Content Safety Manager (static class)
    ContentSafetyManager.init(this.openai, this.anthropic);
    
    // Initialize Agent Manager with AI clients
    this.agentManager = new AgentManager(this.openai, this.anthropic);

    Logger.info('✅ Core services initialized');
  }

  async initializeMCPServer() {
    try {
      // Initialize MCP server with simplified configuration
      this.mcpServer = new MCPServer({
        enableAgentOrchestrator: false  // Use direct agent integration instead
      });
      
      // Pass AI clients to MCP server
      if (this.openai) {
        this.mcpServer.setOpenAIClient(this.openai);
      }
      if (this.anthropic) {
        this.mcpServer.setAnthropicClient(this.anthropic);
      }
      
      // Pass AgentManager to MCP server for direct tool execution
      if (this.agentManager) {
        this.mcpServer.setAgentManager(this.agentManager);
      }
      
      await this.mcpServer.initialize();

      Logger.info('✅ MCP Server initialized');
    } catch (error) {
      Logger.error('❌ Failed to initialize MCP server:', error);
      throw error;
    }
  }

  setupExpress() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"]
        }
      }
    }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082'
    ];
    
    console.log(`[CORS] Checking origin: ${origin}`);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      console.log(`[CORS] Origin ${origin} is NOT allowed`);
      console.log(`[CORS] Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: CONFIG.server.environment === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Logging
    this.app.use(morgan('combined'));

    // CORS configuration
    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          mcp: this.mcpServer ? 'active' : 'inactive',
          agents: this.agentManager ? 'active' : 'inactive',
          safety: 'active' // ContentSafetyManager is static
        }
      });
    });

    Logger.info('✅ Express middleware configured');
  }

  async setupServers() {
    // Create HTTP server
    this.httpServer = createServer(this.app);

    // Create WebSocket server for MCP
    this.wsServer = new WebSocketServer({ 
      server: this.httpServer,
      path: '/mcp'
    });

    // Handle WebSocket connections for MCP
    this.wsServer.on('connection', async (ws, request) => {
      Logger.info('🔌 New MCP WebSocket connection');
      
      try {
        // Handle MCP protocol over WebSocket
        await this.mcpServer.handleConnection(ws);
      } catch (error) {
        Logger.error('❌ MCP WebSocket error:', error);
        ws.close();
      }
    });

    Logger.info('✅ HTTP and WebSocket servers configured');
  }

  async setupRoutes() {
    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        name: 'GPT for Kids - Educational AI Platform',
        version: '2.0.0',
        description: 'MCP-powered educational AI platform for children',
        endpoints: {
          health: '/health',
          mcp: {
            info: '/mcp/info',
            tools: '/mcp/tools',
            resources: '/mcp/resources',
            websocket: '/mcp'
          },
          api: {
            chat: '/api/chat',
            generateContent: '/api/generate-content',
            generateQuiz: '/api/generate-quiz',
            createStory: '/api/create-story',
            analyzeFile: '/api/analyze-file',
            topics: '/api/topics'
          }
        },
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });

    // MCP Server endpoints
    this.app.get('/mcp/info', async (req, res) => {
      try {
        const info = await this.mcpServer.getServerInfo();
        res.json(info);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mcp/tools', async (req, res) => {
      try {
        const tools = await this.mcpServer.listTools();
        res.json(tools);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/mcp/resources', async (req, res) => {
      try {
        const resources = await this.mcpServer.listResources();
        res.json(resources);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // OPTIONS handler for CORS preflight
    this.app.options('/api/chat', (req, res) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.sendStatus(200);
    });

    // Chat endpoint with MCP integration
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message, mode = 'explore', ageGroup = '8-10', context = [] } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Content safety check using static method
        const safetyResult = await ContentSafetyManager.doubleCheckSafety(message, ageGroup);
        if (!safetyResult.safe) {
          return res.status(400).json({ 
            error: 'Content safety violation',
            details: safetyResult.reason 
          });
        }

        // Use MCP server for enhanced processing
        let response;
        
        try {
          // Select appropriate MCP tool based on mode
          let toolName;
          let toolArgs;
          
          switch(mode) {
            case 'explore':
              toolName = 'explore-topic';
              toolArgs = {
                input: message,
                inputType: 'text',
                ageGroup,
                context: context
              };
              break;
              
            case 'learn':
              toolName = 'socratic-dialogue';
              toolArgs = {
                question: message,
                subject: 'General', // Default subject, could be enhanced
                ageGroup,
                mode: 'socratic',
                context: context
              };
              break;
              
            case 'create':
              toolName = 'create-story';
              toolArgs = {
                topic: message,
                ageGroup,
                duration: 'medium',
                context: context
              };
              break;
              
            case 'assess':
              toolName = 'provide-feedback';
              toolArgs = {
                content: message,
                ageGroup,
                feedbackType: 'constructive'
              };
              break;
              
            case 'curriculum':
              toolName = 'curriculum-content';
              toolArgs = {
                subject: message,
                ageGroup,
                board: 'General',
                grade: 'Age-appropriate'
              };
              break;
              
            default:
              toolName = 'explore-topic';
              toolArgs = {
                input: message,
                inputType: 'text',
                ageGroup,
                context: context
              };
          }
          
          // Try MCP tool execution with appropriate tool and parameters
          response = await this.mcpServer.callTool(toolName, toolArgs);
        } catch (mcpError) {
          Logger.error('MCP tool execution failed:', mcpError.message);
          return res.status(500).json({ 
            success: false,
            error: 'Educational tool processing failed',
            details: mcpError.message 
          });
        }

        // Extract the actual response content from nested structure
        let actualResponse = response;
        if (response && response.response && response.response.response) {
          // Handle double-nested response from MCP tools
          actualResponse = response.response.response;
        } else if (response && response.response) {
          // Handle single-nested response
          actualResponse = response.response;
        } else if (response && response.content) {
          // Handle content field
          actualResponse = response.content;
        }

        res.json({
          success: true,
          response: actualResponse,
          mode,
          ageGroup,
          agent: (response && response.response && response.response.agent) || response.source || 'mcp',
          contextLength: context ? context.length : 0,
          timestamp: new Date().toISOString(),
          suggestions: actualResponse.suggestions || response.suggestions || [],
          followUpQuestions: actualResponse.followUpQuestions || response.followUpQuestions || [],
          topics: actualResponse.topics || response.topics || [],
          skills: actualResponse.skills || response.skills || []
        });

      } catch (error) {
        Logger.error('Chat endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Learning Path endpoint for structured learning journeys
    this.app.post('/api/chat/learning-path', async (req, res) => {
      try {
        const { threadId, topic, ageGroup, action, studentAnswer, reason, context } = req.body;

        if (!threadId || !action) {
          return res.status(400).json({ error: 'ThreadId and action are required' });
        }

        const agent = this.agentManager.getAgent('SocraticLearningAgent');
        if (!agent) {
          return res.status(500).json({ error: 'SocraticLearningAgent not available' });
        }

        let response;

        switch (action) {
          case 'start':
            if (!topic || !ageGroup) {
              return res.status(400).json({ error: 'Topic and ageGroup are required for starting a journey' });
            }
            response = await agent.startLearningJourney(threadId, topic, ageGroup);
            break;

          case 'answer':
            if (!studentAnswer || !ageGroup) {
              return res.status(400).json({ error: 'StudentAnswer and ageGroup are required for processing answers' });
            }
            response = await agent.processLearningAnswer(threadId, studentAnswer, ageGroup);
            break;

          case 'next':
            response = await agent.continueToNextStep(threadId);
            break;

          case 'abandon':
            response = await agent.abandonLearningJourney(threadId, reason);
            break;

          case 'quiz':
            // Pass learning context for comprehensive quiz generation
            response = await agent.generatePracticeQuiz(threadId, context || []);
            break;

          case 'follow-up':
            if (!topic || !ageGroup) {
              return res.status(400).json({ error: 'Topic and ageGroup are required for follow-up journey' });
            }
            // Start a new learning journey for the follow-up topic
            response = await agent.startLearningJourney(threadId, topic, ageGroup);
            break;

          default:
            return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        // Format response for frontend
        res.json({
          success: true,
          response: response, // Return the full response object to preserve structure
          type: response.type,
          metadata: response.metadata,
          mode: 'learn',
          ageGroup: ageGroup || 'unknown',
          agent: 'SocraticLearningAgent',
          contextLength: 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        Logger.error('Learning path endpoint error:', error);
        res.status(500).json({ 
          success: false,
          error: 'Learning path processing failed',
          details: error.message 
        });
      }
    });

    // Educational content generation endpoint
    this.app.post('/api/generate-content', async (req, res) => {
      try {
        const { topic, ageGroup, difficulty = 'beginner', contentType = 'explanation' } = req.body;

        if (!topic || !ageGroup) {
          return res.status(400).json({ error: 'Topic and ageGroup are required' });
        }

        // Use MCP tool for content generation
        const content = await this.mcpServer.callTool('generate-educational-content', {
          topic,
          ageGroup,
          difficulty,
          contentType
        });

        res.json({
          content,
          topic,
          ageGroup,
          difficulty,
          contentType,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        Logger.error('Content generation error:', error);
        res.status(500).json({ error: 'Failed to generate content' });
      }
    });

    // Quiz generation endpoint
    this.app.post('/api/generate-quiz', async (req, res) => {
      try {
        const { topic, ageGroup, questionCount = 5, difficulty = 'medium' } = req.body;

        if (!topic || !ageGroup) {
          return res.status(400).json({ error: 'Topic and ageGroup are required' });
        }

        const quiz = await this.mcpServer.callTool('generate-quiz', {
          topic,
          ageGroup,
          questionCount,
          difficulty
        });

        res.json({
          quiz,
          topic,
          ageGroup,
          questionCount,
          difficulty,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        Logger.error('Quiz generation error:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
      }
    });

    // Story creation endpoint
    this.app.post('/api/create-story', async (req, res) => {
      try {
        const { prompt, ageGroup, genre = 'adventure', length = 'medium' } = req.body;

        if (!prompt || !ageGroup) {
          return res.status(400).json({ error: 'Prompt and ageGroup are required' });
        }

        const story = await this.mcpServer.callTool('create-story', {
          prompt,
          ageGroup,
          genre,
          length
        });

        res.json({
          story,
          prompt,
          ageGroup,
          genre,
          length,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        Logger.error('Story creation error:', error);
        res.status(500).json({ error: 'Failed to create story' });
      }
    });

    // Topic exploration endpoints
    this.app.post('/api/topics/generate', async (req, res) => {
      try {
        const { subject, ageGroup, mode = 'explore' } = req.body;
        
        if (!subject || !ageGroup) {
          return res.status(400).json({ 
            success: false, 
            error: 'Subject and ageGroup are required' 
          });
        }

        // Use MCP tool for topic generation
        const topics = await this.mcpServer.callTool('explore-topic', {
          topic: subject,
          ageGroup,
          mode,
          depth: 'beginner'
        });

        res.json({
          success: true,
          topics: topics.topics || [],
          metadata: {
            subject,
            ageGroup,
            mode,
            generatedAt: new Date().toISOString()
          }
        });

      } catch (error) {
        Logger.error('Topic generation error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to generate topics' 
        });
      }
    });

    // File upload configuration
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      }
    });

    // File analysis endpoint
    this.app.post('/api/analyze-file', upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { ageGroup = '8-10', analysisType = 'general' } = req.body;

        const analysis = await this.mcpServer.callTool('analyze-files', {
          file: {
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
            content: req.file.buffer.toString('base64')
          },
          ageGroup,
          analysisType
        });

        res.json({
          analysis,
          fileName: req.file.originalname,
          ageGroup,
          analysisType,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        Logger.error('File analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze file' });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      Logger.error('Unhandled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    Logger.info('✅ Routes configured');
  }

  async start() {
    try {
      await this.initialize();

      // Start the server
      this.httpServer.listen(CONFIG.server.port, CONFIG.server.host, () => {
        Logger.info(`🚀 Educational Platform Server running on http://${CONFIG.server.host}:${CONFIG.server.port}`);
        Logger.info(`🔌 MCP WebSocket available at ws://${CONFIG.server.host}:${CONFIG.server.port}/mcp`);
        Logger.info(`🛠️  MCP Tools: ${this.mcpServer ? 'Available' : 'Unavailable'}`);
        Logger.info(`📚 Educational Resources: ${this.mcpServer ? 'Available' : 'Unavailable'}`);
        Logger.info(`🤖 AI Agents: ${this.agentManager ? 'Available' : 'Unavailable'}`);
      });

    } catch (error) {
      Logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    Logger.info('🛑 Shutting down Educational Platform Server...');

    if (this.wsServer) {
      this.wsServer.close();
    }

    if (this.httpServer) {
      this.httpServer.close();
    }

    if (this.mcpServer) {
      await this.mcpServer.shutdown();
    }

    Logger.info('✅ Server shutdown complete');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (global.server) {
    await global.server.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (global.server) {
    await global.server.stop();
  }
  process.exit(0);
});

// Start the server
const server = new EducationalPlatformServer();
global.server = server;

server.start().catch(error => {
  console.error('❌ Failed to start Educational Platform Server:', error);
  process.exit(1);
});

export { EducationalPlatformServer };
