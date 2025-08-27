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
import { body } from 'express-validator';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import compression from 'compression';

// Import MCP components
import { MCPServer } from './mcp-core/MCPServer.js';
import { MCPToolRegistry } from './mcp-core/MCPToolRegistry.js';
import { MCPResourceManager } from './mcp-core/MCPResourceManager.js';
import { MCPAgentOrchestrator } from './mcp-core/MCPAgentOrchestrator.js';
import { MCPServiceDiscovery } from './mcp-core/MCPServiceDiscovery.js';

// Import validation middleware
import { ValidationMiddleware } from './middleware/ValidationMiddleware.js';
import { ErrorHandler } from './middleware/ErrorHandler.js';

// Import existing services
import { AgentManager } from './services/AgentManager.js';
import { ContentSafetyManager } from './services/ContentSafetyManager.js';
import { getCacheService } from './services/CacheService.js';
import { Logger } from './utils/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Enhanced Configuration
const CONFIG = {
  server: {
    port: process.env.PORT || 3000,
    mcpPort: process.env.MCP_PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
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
    this.cacheService = null;
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
    // Initialize OpenAI (optional for deployment)
    if (CONFIG.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: CONFIG.openai.apiKey
      });
      Logger.info('✅ OpenAI client initialized');
    } else {
      Logger.warn('⚠️  OpenAI API key not provided - AI features will be limited');
    }

    // Initialize Anthropic (optional for deployment)
    if (CONFIG.anthropic.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: CONFIG.anthropic.apiKey
      });
      Logger.info('✅ Anthropic client initialized');
    } else {
      Logger.warn('⚠️  Anthropic API key not provided - AI features will be limited');
    }
  }

  async initializeServices() {
    // Initialize Cache Service first
    this.cacheService = getCacheService({
      defaultTTL: 600, // 10 minutes
      chatResponseTTL: 300, // 5 minutes for chat responses
      educationalContentTTL: 1800, // 30 minutes for educational content
      maxKeys: 1000
    });

    // Initialize Content Safety Manager (only if we have AI clients)
    if (this.openai || this.anthropic) {
      ContentSafetyManager.init(this.openai, this.anthropic);
      Logger.info('✅ Content Safety Manager initialized');
    }
    
    // Initialize Agent Manager with AI clients and cache service (only if we have AI clients)
    if (this.openai && this.anthropic) {
      this.agentManager = new AgentManager(this.openai, this.anthropic, this.cacheService);
      Logger.info('✅ Agent Manager initialized');
    } else {
      Logger.warn('⚠️  Agent Manager not initialized - missing AI clients');
    }

    Logger.info('✅ Core services initialized');
  }

  async initializeMCPServer() {
    try {
      // Only initialize MCP server if we have AI clients
      if (this.openai && this.anthropic) {
        // Initialize MCP server with simplified configuration
        this.mcpServer = new MCPServer({
          enableAgentOrchestrator: true  // Enable agent orchestrator for unified tool handling
        });
        
        // Pass AI clients to MCP server
        this.mcpServer.setOpenAIClient(this.openai);
        this.mcpServer.setAnthropicClient(this.anthropic);
        this.mcpServer.setAgentManager(this.agentManager);
        this.mcpServer.setCacheService(this.cacheService);

        // Initialize MCP server
        await this.mcpServer.initialize();
        
        Logger.info('✅ MCP Server initialized successfully');
      } else {
        Logger.warn('⚠️  MCP Server not initialized - missing AI clients');
      }
    } catch (error) {
      Logger.error('❌ Failed to initialize MCP server:', error);
      // Don't throw - continue without MCP server
    }
  }

  setupExpress() {
    // Security middleware - Secure CSP for production
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:", "ws:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        }
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: CONFIG.server.environment === 'production' ? 100 : 1000,
      message: {
        error: 'Too many requests from this IP',
        retryAfter: 15 * 60 // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Custom key generator to handle forwarded IPs
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      },
      // Skip successful requests to reduce false positives
      skipSuccessfulRequests: true
    });
    this.app.use('/api/', limiter);

    // Logging
    this.app.use(morgan('combined'));

    // CORS - Secure configuration for Railway deployment
    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
          ? [
              'https://plural-production.up.railway.app',
              process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
              ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
            ].filter(Boolean)
          : [
              'http://localhost:3000',
              'http://localhost:5173',
              'http://localhost:5174',
              'http://localhost:8080',
              'http://127.0.0.1:3000',
              'https://plural-production.up.railway.app'
            ];
        
        Logger.debug(`[CORS] Checking origin: ${origin}`);
        
        if (allowedOrigins.includes(origin)) {
          Logger.debug(`[CORS] Origin ${origin} is allowed`);
          callback(null, true);
        } else {
          Logger.warn(`[CORS] Origin ${origin} is NOT allowed`, { allowedOrigins });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      optionsSuccessStatus: 200
    };

    this.app.use(cors(corsOptions));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Response compression
    this.app.use(compression());

    // Serve static files from frontend build with better configuration
    const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
    this.app.use(express.static(frontendDistPath, {
      maxAge: '1d', // Cache static files for 1 day
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set proper MIME types for assets
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));
    Logger.info(`📁 Serving frontend static files from: ${frontendDistPath}`);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const cacheHealth = this.cacheService ? this.cacheService.healthCheck() : { status: 'unavailable' };
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          mcp: this.mcpServer ? 'active' : 'inactive',
          agents: this.agentManager ? 'active' : 'inactive',
          cache: cacheHealth.status,
          safety: 'active' // ContentSafetyManager is static
        },
        apiConnections: {
          openai: !!this.openai,
          anthropic: !!this.anthropic
        },
        cache: cacheHealth.stats
      });
    });

    // Cache statistics endpoint
    this.app.get('/cache/stats', (req, res) => {
      if (!this.cacheService) {
        return res.status(503).json({ error: 'Cache service not available' });
      }
      res.json(this.cacheService.getStats());
    });

    // Cache management endpoints
    this.app.post('/cache/clear', (req, res) => {
      if (!this.cacheService) {
        return res.status(503).json({ error: 'Cache service not available' });
      }
      const { type } = req.body;
      const cleared = this.cacheService.clear(type);
      res.json({ cleared, type: type || 'all' });
    });

    this.app.post('/cache/optimize', (req, res) => {
      if (!this.cacheService) {
        return res.status(503).json({ error: 'Cache service not available' });
      }
      const result = this.cacheService.optimize();
      res.json(result);
    });

    // Enhanced metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        },
        agents: this.agentManager ? this.agentManager.getEnhancedMetrics() : null,
        cache: this.cacheService ? this.cacheService.getStats() : null,
        mcp: this.mcpServer ? this.mcpServer.getMetrics() : null
      };
      res.json(metrics);
    });

    // Rate limit status endpoint
    this.app.get('/rate-limits', async (req, res) => {
      if (!this.agentManager) {
        return res.status(503).json({ error: 'Agent manager not available' });
      }
      const rateLimit = await this.agentManager.checkOpenAIRateLimit();
      res.json(rateLimit);
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
    this.app.get('/mcp/info', ErrorHandler.asyncHandler(async (req, res) => {
      const info = await this.mcpServer.getServerInfo();
      res.json(info);
    }));

    this.app.get('/mcp/tools', ErrorHandler.asyncHandler(async (req, res) => {
      const tools = await this.mcpServer.listTools();
      res.json(tools);
    }));

    this.app.get('/mcp/resources', ErrorHandler.asyncHandler(async (req, res) => {
      const resources = await this.mcpServer.listResources();
      res.json(resources);
    }));

    // OPTIONS handler for CORS preflight
    this.app.options('/api/chat', (req, res) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.sendStatus(200);
    });

    // Chat endpoint with MCP integration and caching
    this.app.post('/api/chat', 
      ValidationMiddleware.validateChatRequest(),
      ErrorHandler.asyncHandler(async (req, res) => {
        const { message, mode = 'explore', ageGroup = '8-10', context = [], subject, curriculumBoard, curriculumGrade } = req.body;

        // Generate cache key for this request
        const cacheParams = { message, mode, ageGroup, contextLength: context.length };
        
        // Try to get cached response first
        if (this.cacheService) {
          const cached = this.cacheService.get('chat_response', cacheParams);
          if (cached) {
            Logger.info('Serving cached chat response', { mode, ageGroup });
            return res.json({
              ...cached.data,
              cached: true,
              cacheTimestamp: cached.timestamp
            });
          }
        }

        // Content safety check
        const safetyResult = await ContentSafetyManager.doubleCheckSafety(message, ageGroup);
        if (!safetyResult.safe) {
          throw ErrorHandler.createError(`Content safety violation: ${safetyResult.reason}`, 400);
        }

        // Rate limiting check using cache service
        if (this.cacheService && !this.cacheService.checkRateLimit('chat', req.ip, 100, 3600000)) {
          throw ErrorHandler.createError('Rate limit exceeded. Please try again later.', 429);
        }

                // Select appropriate MCP tool based on mode
        let mcpTool, toolArgs;
        
        switch (mode) {
          case 'explore':
            mcpTool = 'generate-educational-content';
            toolArgs = { topic: message, ageGroup, contentType: 'explanation', context: context };
            break;
          case 'learn':
            mcpTool = 'socratic-dialogue';
            toolArgs = { question: message, ageGroup, subject: subject || 'general', context: context };
            break;
          case 'create':
            mcpTool = 'provide-feedback';
            toolArgs = { studentWork: message, type: 'creative', ageGroup, context: context };
            break;
          case 'curriculum':
            mcpTool = 'curriculum-content';
            toolArgs = { topic: message, ageGroup, subject: subject || 'general', curriculumBoard, curriculumGrade, context: context };
            break;
          default:
            mcpTool = 'generate-educational-content';
            toolArgs = { topic: message, ageGroup, contentType: 'explanation', context: context };
        }
        
        const response = await this.mcpServer.callTool(mcpTool, toolArgs);

        // Normalize the response structure
        let actualResponse = response;
        if (response?.response?.response) {
          actualResponse = response.response.response;
        } else if (response?.response) {
          actualResponse = response.response;
        } else if (response?.content) {
          actualResponse = response.content;
        }

        const responseData = {
          success: true,
          response: actualResponse,
          mode,
          ageGroup,
          agent: response?.source || 'mcp',
          contextLength: context?.length || 0,
          timestamp: new Date().toISOString(),
          suggestions: actualResponse?.suggestions || response?.suggestions || [],
          followUpQuestions: actualResponse?.followUpQuestions || response?.followUpQuestions || [],
          topics: actualResponse?.topics || response?.topics || [],
          skills: actualResponse?.skills || response?.skills || [],
          cached: false
        };

        // Cache the response
        if (this.cacheService) {
          this.cacheService.set('chat_response', cacheParams, responseData);
        }

        res.json(responseData);
      })
    );

    // Learning Path endpoint for structured learning journeys
    this.app.post('/api/chat/learning-path',
      ValidationMiddleware.validateLearningPathRequest(),
      ErrorHandler.asyncHandler(async (req, res) => {
        const { threadId, topic, ageGroup, action, studentAnswer, reason, context } = req.body;

        const agent = this.agentManager.getAgent('SocraticLearningAgent');
        if (!agent) {
          throw ErrorHandler.createError('SocraticLearningAgent not available', 500);
        }

        let response;
        switch (action) {
          case 'start':
            response = await agent.startLearningJourney(threadId, topic, ageGroup);
            break;
          case 'answer':
            response = await agent.processLearningAnswer(threadId, studentAnswer, ageGroup);
            break;
          case 'next':
            response = await agent.continueToNextStep(threadId);
            break;
          case 'abandon':
            response = await agent.abandonLearningJourney(threadId, reason);
            break;
          case 'quiz':
            response = await agent.generatePracticeQuiz(threadId, context || []);
            break;
          case 'follow-up':
            response = await agent.startLearningJourney(threadId, topic, ageGroup);
            break;
          default:
            throw ErrorHandler.createError(`Unknown action: ${action}`, 400);
        }

        res.json({
          success: true,
          response: response,
          type: response.type,
          metadata: response.metadata,
          mode: 'learn',
          ageGroup: ageGroup || 'unknown',
          agent: 'SocraticLearningAgent',
          timestamp: new Date().toISOString()
        });
      })
    );

    // Educational content generation endpoint with caching
    this.app.post('/api/generate-content',
      ValidationMiddleware.validateContentGeneration(),
      ErrorHandler.asyncHandler(async (req, res) => {
        const { topic, ageGroup, difficulty = 'beginner', contentType = 'explanation' } = req.body;

        // Try cache first
        if (this.cacheService) {
          const cacheParams = { topic, ageGroup, difficulty, contentType };
          const cached = await this.cacheService.getOrSet(
            'educational_content',
            cacheParams,
            async () => {
              return await this.mcpServer.callTool('generate-educational-content', {
                topic, ageGroup, difficulty, contentType
              });
            }
          );

          return res.json({
            content: cached,
            topic,
            ageGroup,
            difficulty,
            contentType,
            timestamp: new Date().toISOString(),
            cached: cached !== (await this.mcpServer.callTool('generate-educational-content', {
              topic, ageGroup, difficulty, contentType
            }))
          });
        }

        // Fallback without cache
        const content = await this.mcpServer.callTool('generate-educational-content', {
          topic, ageGroup, difficulty, contentType
        });

        res.json({
          content,
          topic,
          ageGroup,
          difficulty,
          contentType,
          timestamp: new Date().toISOString(),
          cached: false
        });
      })
    );

    // Quiz generation endpoint with caching
    this.app.post('/api/generate-quiz',
      ValidationMiddleware.validateQuizGeneration(),
      ErrorHandler.asyncHandler(async (req, res) => {
        const { topic, ageGroup, questionCount = 5, difficulty = 'medium' } = req.body;

        // Use cache service for quiz generation
        if (this.cacheService) {
          const cacheParams = { topic, ageGroup, questionCount, difficulty };
          const quiz = await this.cacheService.getOrSet(
            'quiz',
            cacheParams,
            async () => {
              return await this.mcpServer.callTool('generate-quiz', {
                topic, ageGroup, questionCount, difficulty
              });
            },
            this.cacheService.config.quizTTL // Use longer TTL for quizzes
          );

          return res.json({
            quiz,
            topic,
            ageGroup,
            questionCount,
            difficulty,
            timestamp: new Date().toISOString(),
            cached: true
          });
        }

        // Fallback without cache
        const quiz = await this.mcpServer.callTool('generate-quiz', {
          topic, ageGroup, questionCount, difficulty
        });

        res.json({
          quiz,
          topic,
          ageGroup,
          questionCount,
          difficulty,
          timestamp: new Date().toISOString(),
          cached: false
        });
      })
    );

    // Story creation endpoint with caching
    this.app.post('/api/create-story',
      ValidationMiddleware.validateStoryCreation(),
      ErrorHandler.asyncHandler(async (req, res) => {
        const { prompt, ageGroup, genre = 'adventure', length = 'medium' } = req.body;

        // Use cache service for story creation
        if (this.cacheService) {
          const cacheParams = { prompt, ageGroup, genre, length };
          const story = await this.cacheService.getOrSet(
            'story',
            cacheParams,
            async () => {
              return await this.mcpServer.callTool('create-story', {
                prompt, ageGroup, genre, length
              });
            },
            this.cacheService.config.storyTTL // Use longer TTL for stories
          );

          return res.json({
            story,
            prompt,
            ageGroup,
            genre,
            length,
            timestamp: new Date().toISOString(),
            cached: true
          });
        }

        // Fallback without cache
        const story = await this.mcpServer.callTool('create-story', {
          prompt, ageGroup, genre, length
        });

        res.json({
          story,
          prompt,
          ageGroup,
          genre,
          length,
          timestamp: new Date().toISOString(),
          cached: false
        });
      })
    );

    // Topic exploration endpoints with caching
    this.app.post('/api/topics/generate',
      ValidationMiddleware.validateTopicsGeneration(),
      ErrorHandler.asyncHandler(async (req, res) => {
        const { subject, ageGroup, mode = 'explore', userProfile, preferences } = req.body;

        // Use AgentManager's topic generation method with enhanced agent
        const result = await this.agentManager.generateTopics(
          { age: ageGroup, ...userProfile },
          { interests: subject ? [subject] : [], ...preferences },
          { mode, subject }
        );

        res.json({
          success: true,
          topics: result.topics || [],
          metadata: {
            subject,
            ageGroup,
            mode,
            generatedAt: new Date().toISOString(),
            agent: 'TopicGenerationAgentEnhanced',
            ...result.metadata
          }
        });
      })
    );

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
    this.app.post('/api/analyze-file', 
      upload.single('file'), 
      ErrorHandler.asyncHandler(async (req, res) => {
        if (!req.file) {
          throw ErrorHandler.createError('No file uploaded', 400);
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
      })
    );

    // Additional API endpoints for frontend compatibility
    
    // Metrics endpoint
    this.app.get('/api/metrics',
      ErrorHandler.asyncHandler(async (req, res) => {
        const metrics = {
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            version: process.version
          },
          services: {
            mcp: this.mcpServer ? 'active' : 'inactive',
            agents: this.agentManager ? 'active' : 'inactive',
            cache: this.cacheService ? 'healthy' : 'inactive'
          },
          timestamp: new Date().toISOString()
        };
        res.json(metrics);
      })
    );

    // Files health endpoint (for MCP health check)
    this.app.get('/api/files/health',
      ErrorHandler.asyncHandler(async (req, res) => {
        const health = {
          status: 'healthy',
          mcp: this.mcpServer ? 'active' : 'inactive',
          timestamp: new Date().toISOString()
        };
        res.json(health);
      })
    );

    // Safety check endpoint
    this.app.post('/api/safety-check',
      body('content').isString().trim().isLength({ min: 1, max: 5000 }),
      body('ageGroup').optional().isIn(['5-7', '8-10', '11-13', '14-17']),
      ValidationMiddleware.handleValidationErrors,
      ErrorHandler.asyncHandler(async (req, res) => {
        const { content, ageGroup = '8-10' } = req.body;
        
        const safetyResult = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
        
        res.json({
          safe: safetyResult.safe,
          reason: safetyResult.reason,
          ageGroup,
          timestamp: new Date().toISOString()
        });
      })
    );

    // Feedback endpoint
    this.app.post('/api/feedback',
      body('studentWork').isString().trim().isLength({ min: 1, max: 5000 }),
      body('type').optional().isIn(['general', 'creative', 'academic']),
      body('ageGroup').optional().isIn(['5-7', '8-10', '11-13', '14-17']),
      ValidationMiddleware.handleValidationErrors,
      ErrorHandler.asyncHandler(async (req, res) => {
        const { studentWork, type = 'general', ageGroup = '8-10' } = req.body;
        
        const feedback = await this.mcpServer.callTool('provide-feedback', {
          studentWork,
          type,
          ageGroup
        });
        
        res.json({
          success: true,
          feedback,
          type,
          ageGroup,
          timestamp: new Date().toISOString()
        });
      })
    );

    // Question generation endpoint
    this.app.post('/api/question',
      body('topic').isString().trim().isLength({ min: 1, max: 200 }),
      body('ageGroup').optional().isIn(['5-7', '8-10', '11-13', '14-17']),
      body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
      ValidationMiddleware.handleValidationErrors,
      ErrorHandler.asyncHandler(async (req, res) => {
        const { topic, ageGroup = '8-10', difficulty = 'medium' } = req.body;
        
        const question = await this.mcpServer.callTool('generate-quiz', {
          topic,
          ageGroup,
          questionCount: 1,
          difficulty
        });
        
        res.json({
          success: true,
          question: question?.questions?.[0] || question,
          topic,
          ageGroup,
          difficulty,
          timestamp: new Date().toISOString()
        });
      })
    );

    // Socratic learning endpoint
    this.app.post('/api/socratic',
      body('question').isString().trim().isLength({ min: 1, max: 500 }),
      body('ageGroup').optional().isIn(['5-7', '8-10', '11-13', '14-17']),
      body('subject').optional().isString().trim().isLength({ max: 100 }),
      ValidationMiddleware.handleValidationErrors,
      ErrorHandler.asyncHandler(async (req, res) => {
        const { question, ageGroup = '8-10', subject = 'general' } = req.body;
        
        const response = await this.mcpServer.callTool('socratic-dialogue', {
          question,
          ageGroup,
          subject
        });
        
        res.json({
          success: true,
          response,
          ageGroup,
          subject,
          timestamp: new Date().toISOString()
        });
      })
    );

    // Catch-all handler for frontend SPA routing (GET requests only)
    this.app.get('*', (req, res) => {
      // Don't serve index.html for API routes, assets, or other special paths
      if (req.path.startsWith('/api/') || 
          req.path.startsWith('/health') || 
          req.path.startsWith('/mcp') ||
          req.path.startsWith('/assets/') ||
          req.path.includes('.') && !req.path.endsWith('.html')) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          Logger.error('Error serving index.html:', err);
          res.status(500).json({ error: 'Frontend application not available' });
        }
      });
    });

    // Error handling middleware
    this.app.use(ErrorHandler.notFoundHandler);
    this.app.use(ErrorHandler.errorHandler);

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
