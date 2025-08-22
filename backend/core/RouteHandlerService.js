/**
 * Route Handler Service - Generic route handling with microservices pattern
 * Provides reusable route handling, validation, metrics, and response formatting
 */

import { Logger } from '../utils/Logger.js';

export class RouteHandlerService {
  constructor(validationService, metricsService, config = {}) {
    this.validation = validationService;
    this.metrics = metricsService;
    
    this.config = {
      enableMetrics: true,
      enableValidation: true,
      enableRateLimit: false,
      logRequests: true,
      corsEnabled: true,
      ...config
    };

    this.rateLimitStore = new Map();
    this.routeRegistry = new Map();
    
    Logger.info('RouteHandlerService initialized', { component: 'RouteHandlerService' });
  }

  /**
   * Create a generic route handler with validation, metrics, and error handling
   */
  createHandler(options = {}) {
    const {
      validationSchema,
      agentMethod,
      agentService,
      responseTransformer,
      rateLimit,
      cache,
      middleware = [],
      ...handlerOptions
    } = options;

    return async (req, res) => {
      let timerKey;
      const startTime = Date.now();
      
      try {
        // Start metrics tracking
        if (this.config.enableMetrics) {
          timerKey = this.metrics.trackRequest(req.path, req.method, {
            ageGroup: req.body?.ageGroup,
            mode: req.body?.mode
          });
        }

        // Log request
        if (this.config.logRequests) {
          Logger.apiRequest(req.method, req.path, {
            body: this.sanitizeRequestBody(req.body),
            query: req.query,
            headers: req.headers
          });
        }

        // Rate limiting
        if (rateLimit && this.config.enableRateLimit) {
          const rateLimitResult = this.checkRateLimit(req, rateLimit);
          if (!rateLimitResult.allowed) {
            return this.sendErrorResponse(res, 429, 'Rate limit exceeded', {
              retryAfter: rateLimitResult.retryAfter
            });
          }
        }

        // Validation
        let validatedData = req.body;
        if (validationSchema && this.config.enableValidation) {
          const validationResult = this.validation.validateSchema(req.body, validationSchema);
          
          if (!validationResult.valid) {
            if (timerKey) {
              this.metrics.trackResponse(timerKey, 400, false);
            }
            
            return this.sendErrorResponse(res, 400, 'Validation failed', {
              errors: validationResult.errors
            });
          }
          
          validatedData = validationResult.data;
        }

        // Execute middleware
        for (const middlewareFn of middleware) {
          const middlewareResult = await middlewareFn(req, res, validatedData);
          if (middlewareResult.stop) {
            return; // Middleware handled the response
          }
          if (middlewareResult.data) {
            validatedData = middlewareResult.data;
          }
        }

        // Check cache
        if (cache) {
          const cacheKey = this.generateCacheKey(req, validatedData);
          const cachedResult = await this.getCachedResult(cacheKey, cache);
          
          if (cachedResult) {
            if (timerKey) {
              this.metrics.trackResponse(timerKey, 200, true);
            }
            
            return this.sendSuccessResponse(res, cachedResult, {
              cached: true,
              ...handlerOptions
            });
          }
        }

        // Execute agent method
        if (!agentService || !agentMethod) {
          throw new Error('Agent service and method are required');
        }

        const agentResult = await this.executeAgentMethod(
          agentService, 
          agentMethod, 
          validatedData, 
          req
        );

        // Transform response
        const finalResult = responseTransformer 
          ? responseTransformer(agentResult, validatedData, req)
          : agentResult;

        // Cache result
        if (cache) {
          const cacheKey = this.generateCacheKey(req, validatedData);
          await this.setCachedResult(cacheKey, finalResult, cache);
        }

        // Track metrics and send response
        if (timerKey) {
          this.metrics.trackResponse(timerKey, 200, true);
        }

        this.sendSuccessResponse(res, finalResult, handlerOptions);

      } catch (error) {
        Logger.error('Route handler error', {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
          body: this.sanitizeRequestBody(req.body)
        });

        if (timerKey) {
          this.metrics.trackResponse(timerKey, 500, false);
        }

        this.sendErrorResponse(res, 500, error.message, {
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
    };
  }

  /**
   * Execute agent method with proper error handling
   */
  async executeAgentMethod(agentService, agentMethod, data, req) {
    const agent = typeof agentService === 'string' 
      ? this.getAgentByName(agentService)
      : agentService;

    if (!agent || typeof agent[agentMethod] !== 'function') {
      throw new Error(`Agent method not found: ${agentMethod}`);
    }

    // Track agent usage
    const agentStartTime = Date.now();
    let success = true;
    
    try {
      const result = await agent[agentMethod](data, req);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      if (this.config.enableMetrics) {
        const duration = Date.now() - agentStartTime;
        const agentName = agent.constructor.name || 'unknown';
        this.metrics.trackAgentUsage(agentName, agentMethod, duration, success);
      }
    }
  }

  /**
   * Get agent by name (should be implemented based on your service factory)
   */
  getAgentByName(agentName) {
    // This should integrate with your ServiceFactory
    throw new Error('getAgentByName not implemented - integrate with ServiceFactory');
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(req, rateLimit) {
    const key = this.getRateLimitKey(req, rateLimit);
    const now = Date.now();
    const windowMs = rateLimit.windowMs || 60000; // 1 minute default
    const maxRequests = rateLimit.max || 100;

    let requestLog = this.rateLimitStore.get(key) || [];
    
    // Remove old requests outside the window
    requestLog = requestLog.filter(timestamp => now - timestamp < windowMs);
    
    if (requestLog.length >= maxRequests) {
      const oldestRequest = Math.min(...requestLog);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return { allowed: false, retryAfter };
    }

    // Add current request
    requestLog.push(now);
    this.rateLimitStore.set(key, requestLog);

    return { allowed: true, remaining: maxRequests - requestLog.length };
  }

  /**
   * Generate rate limit key
   */
  getRateLimitKey(req, rateLimit) {
    const keyBy = rateLimit.keyBy || 'ip';
    
    switch (keyBy) {
      case 'ip':
        return `rateLimit:${req.ip}`;
      case 'user':
        return `rateLimit:${req.body?.userId || req.ip}`;
      case 'endpoint':
        return `rateLimit:${req.path}:${req.ip}`;
      default:
        return `rateLimit:${req.ip}`;
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(req, data) {
    const keyParts = [
      req.path,
      req.method,
      JSON.stringify(data)
    ];
    
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * Get cached result
   */
  async getCachedResult(cacheKey, cache) {
    if (cache.type === 'memory') {
      const cached = this.memoryCache?.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (cache.ttl || 300000)) {
        return cached.data;
      }
    }
    
    return null;
  }

  /**
   * Set cached result
   */
  async setCachedResult(cacheKey, data, cache) {
    if (cache.type === 'memory') {
      if (!this.memoryCache) {
        this.memoryCache = new Map();
      }
      
      this.memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Simple cleanup
      if (this.memoryCache.size > 1000) {
        const entries = Array.from(this.memoryCache.entries());
        entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
        
        // Remove oldest 20%
        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
          this.memoryCache.delete(entries[i][0]);
        }
      }
    }
  }

  /**
   * Send success response
   */
  sendSuccessResponse(res, data, options = {}) {
    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      ...options
    };

    res.json(response);
  }

  /**
   * Send error response
   */
  sendErrorResponse(res, statusCode, message, details = {}) {
    const response = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...details
    };

    res.status(statusCode).json(response);
  }

  /**
   * Sanitize request body for logging
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    
    // Truncate long text fields
    if (sanitized.message && sanitized.message.length > 200) {
      sanitized.message = sanitized.message.substring(0, 200) + '...';
    }
    
    // Remove sensitive data
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    return sanitized;
  }

  /**
   * Create route configuration
   */
  createRouteConfig(path, config) {
    this.routeRegistry.set(path, {
      ...config,
      createdAt: Date.now()
    });
    
    return this.createHandler(config);
  }

  /**
   * Get all registered routes
   */
  getRegisteredRoutes() {
    return Array.from(this.routeRegistry.entries()).map(([path, config]) => ({
      path,
      config: {
        validationSchema: config.validationSchema ? 'present' : 'none',
        agentMethod: config.agentMethod,
        hasCache: !!config.cache,
        hasRateLimit: !!config.rateLimit,
        middlewareCount: config.middleware?.length || 0,
        createdAt: config.createdAt
      }
    }));
  }

  /**
   * Create common middleware
   */
  createCommonMiddleware() {
    return {
      // User context middleware
      userContext: async (req, res, data) => {
        if (data.userId && !data.userContext) {
          // This would integrate with your user context service
          data.userContext = await this.getUserContext(data.userId);
        }
        return { data };
      },

      // Session tracking middleware
      sessionTracking: async (req, res, data) => {
        if (data.ageGroup && data.mode) {
          this.metrics.trackUserActivity(
            data.userId || 'anonymous', 
            data.ageGroup, 
            data.mode, 
            data.subject
          );
        }
        return { data };
      },

      // Content safety middleware
      contentSafety: async (req, res, data) => {
        if (data.message) {
          // This would integrate with your content safety service
          const safetyCheck = await this.checkContentSafety(data.message);
          if (!safetyCheck.safe) {
            res.status(400).json({
              success: false,
              error: 'Content safety check failed',
              details: safetyCheck.reason
            });
            return { stop: true };
          }
        }
        return { data };
      }
    };
  }

  /**
   * Placeholder methods for integration
   */
  async getUserContext(userId) {
    // Integrate with your user context service
    return {};
  }

  async checkContentSafety(content) {
    // Integrate with your content safety service
    return { safe: true };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      registeredRoutes: this.routeRegistry.size,
      rateLimitEntries: this.rateLimitStore.size,
      cacheEntries: this.memoryCache?.size || 0,
      config: this.config
    };
  }

  /**
   * Clear caches and reset
   */
  reset() {
    this.rateLimitStore.clear();
    this.memoryCache?.clear();
    
    Logger.info('RouteHandlerService reset', { component: 'RouteHandlerService' });
  }
}

export default RouteHandlerService;
