/**
 * Service Factory - Microservices Architecture Core
 * Creates and manages reusable services, agents, and utilities
 * Follows dependency injection and factory patterns
 */

import { Logger } from '../utils/Logger.js';
import { ContentSafetyManager } from '../services/ContentSafetyManager.js';

// Import services (agents are now managed by MCP Agent Orchestrator)
import { ValidationService } from '../core/ValidationService.js';
import { MetricsService } from '../core/MetricsService.js';
import { RouteHandlerService } from '../core/RouteHandlerService.js';

/**
 * Service configuration registry
 */
const SERVICE_REGISTRY = {
  // Core services
  validation: {
    class: ValidationService,
    singleton: true,
    dependencies: []
  },
  metrics: {
    class: MetricsService,
    singleton: true,
    dependencies: []
  },
  routeHandler: {
    class: RouteHandlerService,
    singleton: true,
    dependencies: ['validation', 'metrics']
  },
  safety: {
    class: ContentSafetyManager,
    singleton: true,
    dependencies: []
  }

  // Note: Agent services are now managed by MCP Agent Orchestrator
  // All educational agents (socratic, creative, assessment, exploration, curriculum)
  // are handled through the unified MCP architecture
};

/**
 * Note: Agent capabilities are now managed by MCP Agent Orchestrator
 * See MCPAgentOrchestrator.js for agent capability mapping
 */

export class ServiceFactory {
  constructor() {
    this.services = new Map();
    this.dependencies = new Map();
    this.singletons = new Map();
    this.initialized = false;
    
    Logger.info('ServiceFactory initialized', { component: 'ServiceFactory' });
  }

  /**
   * Initialize the service factory with external dependencies
   */
  async initialize(externalDependencies = {}) {
    try {
      Logger.info('Initializing ServiceFactory...', { component: 'ServiceFactory' });

      // Store external dependencies (AI clients, etc.)
      Object.entries(externalDependencies).forEach(([key, value]) => {
        this.dependencies.set(key, value);
      });

      // Initialize core services first
      await this.initializeCoreServices();

      // Note: Agent services are now managed by MCP Agent Orchestrator
      // No longer initializing agents through ServiceFactory

      this.initialized = true;
      Logger.info('ServiceFactory initialization complete', { 
        component: 'ServiceFactory',
        servicesCount: this.services.size,
        singletonsCount: this.singletons.size
      });

    } catch (error) {
      Logger.error('ServiceFactory initialization failed', { 
        error: error.message,
        component: 'ServiceFactory' 
      });
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  async initializeCoreServices() {
    const coreServices = ['validation', 'metrics', 'routeHandler', 'safety'];
    
    for (const serviceName of coreServices) {
      await this.createService(serviceName);
    }
  }

  /**
   * Create a service instance with dependency injection
   */
  async createService(serviceName, config = {}) {
    const serviceConfig = SERVICE_REGISTRY[serviceName];
    
    if (!serviceConfig) {
      throw new Error(`Service not found in registry: ${serviceName}`);
    }

    // Check if singleton already exists
    if (serviceConfig.singleton && this.singletons.has(serviceName)) {
      return this.singletons.get(serviceName);
    }

    try {
      // Resolve dependencies
      const resolvedDependencies = await this.resolveDependencies(serviceConfig.dependencies);
      
      // Merge configuration
      const finalConfig = {
        ...serviceConfig.config,
        ...config
      };

      // Create service instance
      const ServiceClass = serviceConfig.class;
      let serviceInstance;

      if (resolvedDependencies.length === 0) {
        serviceInstance = new ServiceClass(finalConfig);
      } else if (resolvedDependencies.length === 1) {
        serviceInstance = new ServiceClass(resolvedDependencies[0], finalConfig);
      } else {
        serviceInstance = new ServiceClass(...resolvedDependencies, finalConfig);
      }

      // Store singleton if required
      if (serviceConfig.singleton) {
        this.singletons.set(serviceName, serviceInstance);
      }

      // Store in services map
      this.services.set(serviceName, serviceInstance);

      Logger.info(`Service created: ${serviceName}`, { 
        component: 'ServiceFactory',
        singleton: serviceConfig.singleton,
        dependenciesCount: resolvedDependencies.length
      });

      return serviceInstance;

    } catch (error) {
      Logger.error(`Failed to create service: ${serviceName}`, { 
        error: error.message,
        component: 'ServiceFactory' 
      });
      throw error;
    }
  }

  /**
   * Resolve service dependencies
   */
  async resolveDependencies(dependencies) {
    const resolved = [];

    for (const dep of dependencies) {
      if (this.dependencies.has(dep)) {
        // External dependency
        resolved.push(this.dependencies.get(dep));
      } else if (SERVICE_REGISTRY[dep]) {
        // Internal service dependency
        const service = await this.createService(dep);
        resolved.push(service);
      } else {
        throw new Error(`Dependency not found: ${dep}`);
      }
    }

    return resolved;
  }

  /**
   * Get a service instance
   */
  getService(serviceName) {
    if (!this.initialized) {
      throw new Error('ServiceFactory not initialized');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    return service;
  }

  /**
   * Get multiple services
   */
  getServices(serviceNames) {
    return serviceNames.map(name => this.getService(name));
  }

  /**
   * Find agent by capability
   * Note: Agent management moved to MCP Agent Orchestrator
   */
  findAgentByCapability(capability, subject = 'general', mode = 'default') {
    throw new Error('Agent management moved to MCP Agent Orchestrator. Use agentOrchestrator.executeAgentCapability() instead.');
  }

  /**
   * Get all agents with a specific capability
   * Note: Agent management moved to MCP Agent Orchestrator
   */
  getAgentsByCapability(capability) {
    throw new Error('Agent management moved to MCP Agent Orchestrator.');
  }

  /**
   * Create a dynamic agent for specific use case
   * Note: Dynamic agent creation moved to MCP Agent Orchestrator
   */
  async createDynamicAgent(agentType, config = {}) {
    throw new Error('Dynamic agent creation moved to MCP Agent Orchestrator. Use agentOrchestrator.createAgent() instead.');
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    const services = Array.from(this.services.keys());
    const singletons = Array.from(this.singletons.keys());
    
    return {
      initialized: this.initialized,
      totalServices: this.services.size,
      singletonServices: this.singletons.size,
      services,
      singletons,
      dependencies: Array.from(this.dependencies.keys())
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    Logger.info('Cleaning up ServiceFactory...', { component: 'ServiceFactory' });
    
    // Clear all services
    this.services.clear();
    this.singletons.clear();
    this.dependencies.clear();
    
    this.initialized = false;
    
    Logger.info('ServiceFactory cleanup complete', { component: 'ServiceFactory' });
  }

  /**
   * Register a new service dynamically
   */
  registerService(serviceName, serviceClass, config = {}) {
    SERVICE_REGISTRY[serviceName] = {
      class: serviceClass,
      singleton: config.singleton || false,
      dependencies: config.dependencies || [],
      config: config.config || {}
    };

    Logger.info(`Service registered: ${serviceName}`, { 
      component: 'ServiceFactory',
      singleton: config.singleton 
    });
  }

  /**
   * Get service registry
   */
  getServiceRegistry() {
    return { ...SERVICE_REGISTRY };
  }

  /**
   * Get agent capabilities
   * Note: Agent management moved to MCP Agent Orchestrator
   */
  getAgentCapabilities() {
    throw new Error('Agent capabilities moved to MCP Agent Orchestrator.');
  }
}

// Export singleton instance
export const serviceFactory = new ServiceFactory();
export default serviceFactory;
