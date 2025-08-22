/**
 * Generic Route Factory - Creates routes for any agent/service
 * Eliminates duplication and provides consistent API patterns
 */

import express from 'express';
import { Logger } from '../utils/Logger.js';

export class RouteFactory {
  constructor(serviceFactory, routeHandlerService, validationService) {
    this.serviceFactory = serviceFactory;
    this.routeHandler = routeHandlerService;
    this.validation = validationService;
    
    this.routeConfigurations = new Map();
    this.generatedRoutes = new Map();
    
    Logger.info('RouteFactory initialized', { component: 'RouteFactory' });
  }

  /**
   * Create routes for an agent with automatic capability detection
   */
  createAgentRoutes(agentName, options = {}) {
    const {
      basePath = `/${agentName.toLowerCase().replace('agent', '')}`,
      customRoutes = [],
      enableBulkOperations = true,
      enableHealthCheck = true,
      rateLimit,
      cache,
      middleware = []
    } = options;

    const router = express.Router();
    const agent = this.serviceFactory.getService(agentName);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // Auto-generate routes for agent capabilities
    if (agent.capabilities) {
      for (const capability of agent.capabilities) {
        this.addCapabilityRoute(router, agentName, capability, {
          rateLimit,
          cache,
          middleware
        });
      }
    }

    // Add standard CRUD-style routes
    this.addStandardRoutes(router, agentName, {
      rateLimit,
      cache,
      middleware
    });

    // Add bulk operation routes
    if (enableBulkOperations) {
      this.addBulkRoutes(router, agentName, {
        rateLimit: rateLimit ? { ...rateLimit, max: Math.floor(rateLimit.max / 2) } : undefined,
        cache,
        middleware
      });
    }

    // Add health check route
    if (enableHealthCheck) {
      this.addHealthRoute(router, agentName);
    }

    // Add custom routes
    for (const customRoute of customRoutes) {
      this.addCustomRoute(router, agentName, customRoute);
    }

    // Store route configuration
    this.routeConfigurations.set(agentName, {
      basePath,
      capabilities: agent.capabilities ? Array.from(agent.capabilities) : [],
      routeCount: this.countRoutes(router),
      options
    });

    this.generatedRoutes.set(agentName, router);

    Logger.info(`Routes created for ${agentName}`, {
      component: 'RouteFactory',
      basePath,
      routeCount: this.countRoutes(router)
    });

    return router;
  }

  /**
   * Add a route for a specific agent capability
   */
  addCapabilityRoute(router, agentName, capability, options = {}) {
    const routePath = `/${capability}`;
    const validationSchema = this.getValidationSchema(agentName, capability);
    
    const handler = this.routeHandler.createHandler({
      validationSchema,
      agentService: agentName,
      agentMethod: capability,
      responseTransformer: this.createResponseTransformer(agentName, capability),
      ...options
    });

    router.post(routePath, handler);
    
    // Also create a GET route for simple queries
    if (['analyze', 'generate', 'explore'].includes(capability)) {
      router.get(routePath, this.createGetHandler(agentName, capability, options));
    }
  }

  /**
   * Add standard CRUD-style routes
   */
  addStandardRoutes(router, agentName, options = {}) {
    // POST / - Primary action
    const primaryHandler = this.routeHandler.createHandler({
      validationSchema: this.getValidationSchema(agentName, 'primary'),
      agentService: agentName,
      agentMethod: this.getPrimaryMethod(agentName),
      responseTransformer: this.createResponseTransformer(agentName, 'primary'),
      ...options
    });

    router.post('/', primaryHandler);

    // GET /capabilities - Get agent capabilities
    router.get('/capabilities', (req, res) => {
      const agent = this.serviceFactory.getService(agentName);
      res.json({
        success: true,
        data: {
          name: agentName,
          capabilities: agent.capabilities ? Array.from(agent.capabilities) : [],
          config: agent.getConfig ? agent.getConfig() : {},
          health: agent.getHealth ? agent.getHealth() : { status: 'unknown' }
        }
      });
    });

    // GET /metrics - Get agent metrics
    router.get('/metrics', (req, res) => {
      const agent = this.serviceFactory.getService(agentName);
      res.json({
        success: true,
        data: agent.getMetrics ? agent.getMetrics() : {}
      });
    });
  }

  /**
   * Add bulk operation routes
   */
  addBulkRoutes(router, agentName, options = {}) {
    // POST /bulk - Process multiple items
    const bulkHandler = this.routeHandler.createHandler({
      validationSchema: this.getBulkValidationSchema(agentName),
      agentService: agentName,
      agentMethod: 'processBulk',
      responseTransformer: this.createBulkResponseTransformer(agentName),
      ...options,
      middleware: [
        ...options.middleware || [],
        this.createBulkMiddleware(agentName)
      ]
    });

    router.post('/bulk', bulkHandler);
  }

  /**
   * Add health check route
   */
  addHealthRoute(router, agentName) {
    router.get('/health', (req, res) => {
      try {
        const agent = this.serviceFactory.getService(agentName);
        const health = agent.getHealth ? agent.getHealth() : { status: 'unknown' };
        
        res.json({
          success: true,
          data: health,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Add custom route
   */
  addCustomRoute(router, agentName, customRoute) {
    const {
      path,
      method = 'POST',
      agentMethod,
      validationSchema,
      middleware = [],
      ...options
    } = customRoute;

    const handler = this.routeHandler.createHandler({
      validationSchema: validationSchema || this.getValidationSchema(agentName, agentMethod),
      agentService: agentName,
      agentMethod,
      middleware,
      ...options
    });

    router[method.toLowerCase()](path, handler);
  }

  /**
   * Create GET handler for simple queries
   */
  createGetHandler(agentName, capability, options = {}) {
    return async (req, res) => {
      try {
        const { input, ...queryParams } = req.query;
        
        if (!input) {
          return res.status(400).json({
            success: false,
            error: 'Input parameter is required'
          });
        }

        // Convert query params to proper context
        const context = {
          ageGroup: queryParams.ageGroup || '8-10',
          subject: queryParams.subject || 'general',
          mode: queryParams.mode || 'explore',
          ...queryParams
        };

        const agent = this.serviceFactory.getService(agentName);
        const result = await agent.executeCapability(capability, input, context);

        res.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        Logger.error('GET handler error', {
          error: error.message,
          agentName,
          capability
        });

        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Create response transformer for specific agent/capability
   */
  createResponseTransformer(agentName, capability) {
    return (agentResult, validatedData, req) => {
      // Standard response format
      const transformed = {
        result: agentResult,
        agent: agentName,
        capability,
        context: {
          ageGroup: validatedData.ageGroup,
          subject: validatedData.subject,
          mode: validatedData.mode
        },
        metadata: {
          requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - (req.startTime || Date.now())
        }
      };

      // Agent-specific transformations
      if (agentName.includes('quiz') || agentName.includes('Quiz')) {
        transformed.quiz = agentResult;
        transformed.questionCount = agentResult.questions?.length || 0;
      }

      if (agentName.includes('topic') || agentName.includes('Topic')) {
        transformed.topics = Array.isArray(agentResult) ? agentResult : agentResult.topics || [];
        transformed.topicCount = transformed.topics.length;
      }

      return transformed;
    };
  }

  /**
   * Create bulk response transformer
   */
  createBulkResponseTransformer(agentName) {
    return (agentResult, validatedData) => {
      return {
        results: agentResult,
        agent: agentName,
        totalItems: validatedData.items?.length || 0,
        successCount: agentResult.filter(r => r.success).length,
        errorCount: agentResult.filter(r => !r.success).length,
        timestamp: new Date().toISOString()
      };
    };
  }

  /**
   * Create bulk processing middleware
   */
  createBulkMiddleware(agentName) {
    return async (req, res, data) => {
      // Validate bulk request
      if (!data.items || !Array.isArray(data.items)) {
        res.status(400).json({
          success: false,
          error: 'Items array is required for bulk operations'
        });
        return { stop: true };
      }

      if (data.items.length > 50) {
        res.status(400).json({
          success: false,
          error: 'Maximum 50 items allowed per bulk request'
        });
        return { stop: true };
      }

      return { data };
    };
  }

  /**
   * Get validation schema for agent/capability
   */
  getValidationSchema(agentName, capability) {
    // Common schemas based on agent type
    if (agentName.includes('quiz') || agentName.includes('Quiz')) {
      return this.validation.getSchema('quizRequest');
    }

    if (agentName.includes('topic') || agentName.includes('Topic')) {
      return this.validation.getSchema('topicRequest');
    }

    // Default chat-like schema
    return this.validation.getSchema('chatRequest');
  }

  /**
   * Get bulk validation schema
   */
  getBulkValidationSchema(agentName) {
    return {
      items: { required: true, rule: 'array' },
      context: { required: false, rule: 'object' }
    };
  }

  /**
   * Get primary method for agent
   */
  getPrimaryMethod(agentName) {
    // Map agent names to their primary methods
    const methodMap = {
      socraticAgent: 'generate',
      creativeAgent: 'create',
      assessmentAgent: 'assess',
      explorationAgent: 'explore',
      curriculumAgent: 'generate',
      quizAgent: 'generate',
      topicAgent: 'generate'
    };

    return methodMap[agentName] || 'generate';
  }

  /**
   * Count routes in router
   */
  countRoutes(router) {
    let count = 0;
    router.stack.forEach(layer => {
      if (layer.route) {
        count += Object.keys(layer.route.methods).length;
      }
    });
    return count;
  }

  /**
   * Create unified API router that combines all agent routes
   */
  createUnifiedRouter(options = {}) {
    const {
      enableCORS = true,
      enableLogging = true,
      basePath = '/api',
      agentConfigs = {}
    } = options;

    const unifiedRouter = express.Router();

    // Add global middleware
    if (enableCORS) {
      unifiedRouter.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    if (enableLogging) {
      unifiedRouter.use((req, res, next) => {
        req.startTime = Date.now();
        next();
      });
    }

    // Get all agent services
    const agentServices = Object.keys(this.serviceFactory.getServiceRegistry())
      .filter(name => name.endsWith('Agent'));

    // Create routes for each agent
    for (const agentName of agentServices) {
      try {
        const agentConfig = agentConfigs[agentName] || {};
        const agentRoutes = this.createAgentRoutes(agentName, agentConfig);
        const mountPath = agentConfig.basePath || `/${agentName.toLowerCase().replace('agent', '')}`;
        
        unifiedRouter.use(mountPath, agentRoutes);
        
        Logger.info(`Mounted routes for ${agentName}`, {
          component: 'RouteFactory',
          mountPath,
          routeCount: this.countRoutes(agentRoutes)
        });

      } catch (error) {
        Logger.error(`Failed to create routes for ${agentName}`, {
          error: error.message,
          component: 'RouteFactory'
        });
      }
    }

    // Add unified health check
    unifiedRouter.get('/health', (req, res) => {
      const serviceHealth = this.serviceFactory.getHealthStatus();
      const routeHealth = this.getRouteHealthStatus();
      
      res.json({
        success: true,
        data: {
          services: serviceHealth,
          routes: routeHealth,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Add route discovery endpoint
    unifiedRouter.get('/routes', (req, res) => {
      const routeInfo = Array.from(this.routeConfigurations.entries()).map(([agentName, config]) => ({
        agent: agentName,
        ...config
      }));

      res.json({
        success: true,
        data: routeInfo
      });
    });

    return unifiedRouter;
  }

  /**
   * Get route health status
   */
  getRouteHealthStatus() {
    return {
      totalAgents: this.routeConfigurations.size,
      totalRoutes: Array.from(this.routeConfigurations.values())
        .reduce((sum, config) => sum + config.routeCount, 0),
      configurations: Array.from(this.routeConfigurations.keys())
    };
  }

  /**
   * Get route configuration for an agent
   */
  getRouteConfiguration(agentName) {
    return this.routeConfigurations.get(agentName);
  }

  /**
   * Get all route configurations
   */
  getAllRouteConfigurations() {
    return Object.fromEntries(this.routeConfigurations);
  }

  /**
   * Remove routes for an agent
   */
  removeAgentRoutes(agentName) {
    this.routeConfigurations.delete(agentName);
    this.generatedRoutes.delete(agentName);
    
    Logger.info(`Routes removed for ${agentName}`, { component: 'RouteFactory' });
  }

  /**
   * Cleanup all routes
   */
  cleanup() {
    this.routeConfigurations.clear();
    this.generatedRoutes.clear();
    
    Logger.info('RouteFactory cleanup complete', { component: 'RouteFactory' });
  }
}

export default RouteFactory;
