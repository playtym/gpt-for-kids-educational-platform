/**
 * Service Factory - Microservices Architecture Core
 * Creates and manages reusable services, agents, and utilities
 * Follows dependency injection and factory patterns
 */

import { Logger } from '../utils/Logger.js';
import { ContentSafetyManager } from '../services/ContentSafetyManager.js';

// Import all agents
import { SocraticLearningAgent } from '../agents/SocraticLearningAgent.js';
import { CreativeContentAgent } from '../agents/CreativeContentAgent.js';
import { AssessmentAgent } from '../agents/AssessmentAgent.js';
import { ExplorationAgent } from '../agents/ExplorationAgent.js';
import { CurriculumAgent } from '../agents/CurriculumAgent.js';
import { QuizGenerationAgent } from '../agents/QuizGenerationAgent.js';
import { TopicGenerationAgent } from '../agents/TopicGenerationAgent.js';

// Import services
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
  },

  // Agent services
  socraticAgent: {
    class: SocraticLearningAgent,
    singleton: false,
    dependencies: ['openaiClient'],
    config: { type: 'educational', subject: 'general' }
  },
  creativeAgent: {
    class: CreativeContentAgent,
    singleton: false,
    dependencies: ['anthropicClient'],
    config: { type: 'creative', genre: 'educational' }
  },
  assessmentAgent: {
    class: AssessmentAgent,
    singleton: false,
    dependencies: ['openaiClient'],
    config: { type: 'assessment', mode: 'feedback' }
  },
  explorationAgent: {
    class: ExplorationAgent,
    singleton: false,
    dependencies: ['openaiClient'],
    config: { type: 'exploration', searchEnabled: true }
  },
  curriculumAgent: {
    class: CurriculumAgent,
    singleton: false,
    dependencies: ['openaiClient'],
    config: { type: 'curriculum', board: 'flexible' }
  },
  quizAgent: {
    class: QuizGenerationAgent,
    singleton: false,
    dependencies: ['openaiClient'],
    config: { type: 'quiz', searchEnabled: true }
  },
  topicAgent: {
    class: TopicGenerationAgent,
    singleton: false,
    dependencies: ['openaiClient'],
    config: { type: 'topics', personalized: true }
  }
};

/**
 * Agent capability mapping for dynamic routing
 */
const AGENT_CAPABILITIES = {
  socraticAgent: {
    capabilities: ['learn', 'explain', 'teach', 'question'],
    subjects: ['math', 'science', 'language', 'history', 'general'],
    modes: ['socratic', 'answer-first', 'question-first']
  },
  creativeAgent: {
    capabilities: ['create', 'story', 'creative-writing', 'imagination'],
    subjects: ['literature', 'creative-writing', 'art', 'general'],
    modes: ['story', 'poem', 'description', 'dialogue']
  },
  assessmentAgent: {
    capabilities: ['feedback', 'evaluate', 'assess', 'grade'],
    subjects: ['all'],
    modes: ['feedback', 'assessment', 'grading', 'suggestions']
  },
  explorationAgent: {
    capabilities: ['explore', 'discover', 'investigate', 'analyze'],
    subjects: ['all'],
    modes: ['exploration', 'discovery', 'investigation', 'visual-analysis']
  },
  curriculumAgent: {
    capabilities: ['curriculum', 'syllabus', 'lesson-plan', 'structured-learning'],
    subjects: ['all'],
    modes: ['lesson', 'curriculum', 'syllabus', 'structured']
  },
  quizAgent: {
    capabilities: ['quiz', 'test', 'questions', 'mcq'],
    subjects: ['all'],
    modes: ['quiz', 'test', 'practice', 'assessment']
  },
  topicAgent: {
    capabilities: ['topics', 'suggestions', 'recommendations', 'personalization'],
    subjects: ['all'],
    modes: ['generate', 'enhance', 'suggest', 'personalize']
  }
};

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

      // Initialize agent services
      await this.initializeAgentServices();

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
   * Initialize agent services
   */
  async initializeAgentServices() {
    const agentServices = Object.keys(SERVICE_REGISTRY).filter(s => s.endsWith('Agent'));
    
    for (const serviceName of agentServices) {
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
   */
  findAgentByCapability(capability, subject = 'general', mode = 'default') {
    for (const [agentName, agentInfo] of Object.entries(AGENT_CAPABILITIES)) {
      const hasCapability = agentInfo.capabilities.includes(capability);
      const supportsSubject = agentInfo.subjects.includes(subject) || agentInfo.subjects.includes('all');
      const supportsMode = agentInfo.modes.includes(mode) || agentInfo.modes.includes('default');

      if (hasCapability && supportsSubject && supportsMode) {
        return this.getService(agentName);
      }
    }

    throw new Error(`No agent found for capability: ${capability}, subject: ${subject}, mode: ${mode}`);
  }

  /**
   * Get all agents with a specific capability
   */
  getAgentsByCapability(capability) {
    const agents = [];
    
    for (const [agentName, agentInfo] of Object.entries(AGENT_CAPABILITIES)) {
      if (agentInfo.capabilities.includes(capability)) {
        agents.push({
          name: agentName,
          agent: this.getService(agentName),
          info: agentInfo
        });
      }
    }

    return agents;
  }

  /**
   * Create a dynamic agent for specific use case
   */
  async createDynamicAgent(agentType, config = {}) {
    const baseAgentName = `${agentType}Agent`;
    
    if (!SERVICE_REGISTRY[baseAgentName]) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // Create unique service name for dynamic agent
    const dynamicServiceName = `${baseAgentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create service with custom config
    const agent = await this.createService(baseAgentName, config);
    
    // Store with dynamic name
    this.services.set(dynamicServiceName, agent);
    
    return {
      name: dynamicServiceName,
      agent,
      destroy: () => this.services.delete(dynamicServiceName)
    };
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
      dependencies: Array.from(this.dependencies.keys()),
      agentCapabilities: AGENT_CAPABILITIES
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

    // Add capability mapping if it's an agent
    if (config.capabilities) {
      AGENT_CAPABILITIES[serviceName] = {
        capabilities: config.capabilities,
        subjects: config.subjects || ['general'],
        modes: config.modes || ['default']
      };
    }

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
   */
  getAgentCapabilities() {
    return { ...AGENT_CAPABILITIES };
  }
}

// Export singleton instance
export const serviceFactory = new ServiceFactory();
export default serviceFactory;
