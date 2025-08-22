/**
 * MCP Service Discovery - Dynamic Service Registration and Discovery
 * Manages service registration, discovery, health monitoring, and load balancing
 */

import { Logger } from '../utils/Logger.js';
import { EventEmitter } from 'events';

export class MCPServiceDiscovery extends EventEmitter {
  constructor(mcpServer) {
    super();
    this.mcpServer = mcpServer;
    // this.logger removed('MCPServiceDiscovery');
    
    // Service registry
    this.services = new Map();
    this.serviceTypes = new Map();
    this.serviceHealth = new Map();
    this.serviceMetrics = new Map();
    
    // Service monitoring
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
    this.maxRetries = 3;
    
    // Load balancing
    this.loadBalancers = new Map();
    this.serviceInstances = new Map();
    
    // Service discovery events
    this.eventHistory = [];
    this.maxEventHistory = 1000;
    
    Logger.info('MCP Service Discovery initialized');
  }

  /**
   * Initialize service discovery
   */
  async initialize() {
    try {
      Logger.info('Initializing service discovery...');
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      Logger.info('Service discovery initialization complete');

    } catch (error) {
      Logger.error('Failed to initialize service discovery:', error);
      throw error;
    }
  }

  /**
   * Register a service
   */
  async registerService(serviceConfig) {
    try {
      const {
        name,
        type = 'generic',
        version = '1.0.0',
        description = '',
        capabilities = [],
        health = { status: 'unknown' },
        metadata = {},
        endpoint = null,
        dependencies = [],
        tags = []
      } = serviceConfig;

      if (!name) {
        throw new Error('Service registration requires a name');
      }

      const serviceId = this.generateServiceId(name, type);
      
      const service = {
        id: serviceId,
        name,
        type,
        version,
        description,
        capabilities: new Set(capabilities),
        health,
        metadata: {
          ...metadata,
          registeredAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        },
        endpoint,
        dependencies: new Set(dependencies),
        tags: new Set(tags)
      };

      this.services.set(serviceId, service);
      
      // Update type mapping
      if (!this.serviceTypes.has(type)) {
        this.serviceTypes.set(type, new Set());
      }
      this.serviceTypes.get(type).add(serviceId);

      // Initialize health tracking
      this.serviceHealth.set(serviceId, {
        status: health.status || 'unknown',
        lastHealthCheck: new Date().toISOString(),
        healthHistory: [],
        retryCount: 0
      });

      // Initialize metrics
      this.serviceMetrics.set(serviceId, {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        responseTime: 0,
        lastRequestTime: null,
        uptime: Date.now()
      });

      // Setup load balancer if multiple instances
      this.setupLoadBalancer(name, type);

      // Emit service registration event
      this.emitEvent('service:registered', {
        serviceId,
        name,
        type,
        capabilities
      });

      Logger.info(`Service registered: ${name} (${serviceId})`, { 
        type, 
        version,
        capabilities: Array.from(service.capabilities),
        totalServices: this.services.size 
      });

      return { success: true, serviceId };

    } catch (error) {
      Logger.error('Error registering service:', error);
      throw error;
    }
  }

  /**
   * Discover services by various criteria
   */
  async discoverServices(criteria = {}) {
    try {
      const {
        name = null,
        type = null,
        capability = null,
        tag = null,
        healthStatus = null,
        includeMetrics = false
      } = criteria;

      let services = Array.from(this.services.values());

      // Filter by name
      if (name) {
        services = services.filter(service => 
          service.name.toLowerCase().includes(name.toLowerCase())
        );
      }

      // Filter by type
      if (type) {
        services = services.filter(service => service.type === type);
      }

      // Filter by capability
      if (capability) {
        services = services.filter(service => 
          service.capabilities.has(capability)
        );
      }

      // Filter by tag
      if (tag) {
        services = services.filter(service => 
          service.tags.has(tag)
        );
      }

      // Filter by health status
      if (healthStatus) {
        services = services.filter(service => {
          const health = this.serviceHealth.get(service.id);
          return health && health.status === healthStatus;
        });
      }

      // Add metrics if requested
      if (includeMetrics) {
        services = services.map(service => ({
          ...service,
          capabilities: Array.from(service.capabilities),
          tags: Array.from(service.tags),
          dependencies: Array.from(service.dependencies),
          currentHealth: this.serviceHealth.get(service.id),
          metrics: this.serviceMetrics.get(service.id)
        }));
      } else {
        services = services.map(service => ({
          ...service,
          capabilities: Array.from(service.capabilities),
          tags: Array.from(service.tags),
          dependencies: Array.from(service.dependencies)
        }));
      }

      return services;

    } catch (error) {
      Logger.error('Error discovering services:', error);
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  getService(serviceId) {
    return this.services.get(serviceId);
  }

  /**
   * Get services by type
   */
  getServicesByType(type) {
    const serviceIds = this.serviceTypes.get(type) || new Set();
    const services = [];
    
    for (const serviceId of serviceIds) {
      const service = this.services.get(serviceId);
      if (service) {
        services.push(service);
      }
    }
    
    return services;
  }

  /**
   * Get services by capability
   */
  getServicesByCapability(capability) {
    const services = [];
    
    for (const [serviceId, service] of this.services) {
      if (service.capabilities.has(capability)) {
        services.push(service);
      }
    }
    
    return services;
  }

  /**
   * Update service health
   */
  async updateServiceHealth(serviceId, healthData) {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        throw new Error(`Service not found: ${serviceId}`);
      }

      const health = this.serviceHealth.get(serviceId);
      if (!health) {
        throw new Error(`Health tracking not found for service: ${serviceId}`);
      }

      const previousStatus = health.status;
      health.status = healthData.status || health.status;
      health.lastHealthCheck = new Date().toISOString();
      
      // Add to history
      health.healthHistory.push({
        timestamp: new Date().toISOString(),
        status: health.status,
        details: healthData.details || {}
      });

      // Keep only last 24 hours of history (assuming checks every 30 seconds = 2880 entries)
      if (health.healthHistory.length > 2880) {
        health.healthHistory = health.healthHistory.slice(-2880);
      }

      // Reset retry count on successful health check
      if (health.status === 'healthy') {
        health.retryCount = 0;
      }

      // Update service metadata
      service.metadata.lastSeen = new Date().toISOString();
      service.health = healthData;

      // Emit health change event
      if (previousStatus !== health.status) {
        this.emitEvent('service:health:changed', {
          serviceId,
          previousStatus,
          currentStatus: health.status,
          service: service.name
        });
      }

      return { success: true };

    } catch (error) {
      Logger.error('Error updating service health:', error);
      throw error;
    }
  }

  /**
   * Record service metrics
   */
  async recordServiceMetrics(serviceId, metricsData) {
    try {
      const metrics = this.serviceMetrics.get(serviceId);
      if (!metrics) {
        throw new Error(`Metrics tracking not found for service: ${serviceId}`);
      }

      const {
        requestCount = 0,
        responseTime = 0,
        success = true
      } = metricsData;

      metrics.requestCount += requestCount;
      metrics.lastRequestTime = new Date().toISOString();

      if (success) {
        metrics.successCount += requestCount;
      } else {
        metrics.errorCount += requestCount;
      }

      // Update average response time
      if (responseTime > 0) {
        const totalRequests = metrics.successCount + metrics.errorCount;
        metrics.responseTime = (metrics.responseTime * (totalRequests - requestCount) + responseTime * requestCount) / totalRequests;
      }

      return { success: true };

    } catch (error) {
      Logger.error('Error recording service metrics:', error);
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);

    Logger.info('Health monitoring started', { 
      interval: this.healthCheckInterval 
    });
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks() {
    const healthCheckPromises = [];

    for (const [serviceId, service] of this.services) {
      healthCheckPromises.push(this.checkServiceHealth(serviceId, service));
    }

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check individual service health
   */
  async checkServiceHealth(serviceId, service) {
    try {
      const health = this.serviceHealth.get(serviceId);
      if (!health) return;

      let healthStatus = 'unknown';
      let healthDetails = {};

      // For agents, check if they have a getHealth method
      if (service.type === 'agent') {
        try {
          const agent = this.mcpServer.agentOrchestrator?.getAgent(service.name);
          if (agent && agent.getHealth) {
            const agentHealth = await agent.getHealth();
            healthStatus = agentHealth.status;
            healthDetails = agentHealth;
          } else {
            healthStatus = 'healthy'; // Assume healthy if no method available
          }
        } catch (error) {
          healthStatus = 'unhealthy';
          healthDetails = { error: error.message };
          health.retryCount++;
        }
      } else {
        // For other service types, implement custom health checks
        healthStatus = 'healthy'; // Default assumption
      }

      // Update health status
      await this.updateServiceHealth(serviceId, {
        status: healthStatus,
        details: healthDetails,
        timestamp: new Date().toISOString()
      });

      // Handle unhealthy services
      if (healthStatus === 'unhealthy' && health.retryCount >= this.maxRetries) {
        this.emitEvent('service:health:critical', {
          serviceId,
          service: service.name,
          retryCount: health.retryCount
        });
      }

    } catch (error) {
      Logger.error(`Health check failed for service ${serviceId}:`, error);
    }
  }

  /**
   * Setup load balancer for service
   */
  setupLoadBalancer(serviceName, serviceType) {
    const key = `${serviceName}:${serviceType}`;
    
    if (!this.loadBalancers.has(key)) {
      this.loadBalancers.set(key, {
        strategy: 'round-robin', // round-robin, least-connections, random
        currentIndex: 0,
        instances: []
      });
    }

    // Add service instance to load balancer
    const loadBalancer = this.loadBalancers.get(key);
    const instances = Array.from(this.services.values())
      .filter(service => service.name === serviceName && service.type === serviceType);
    
    loadBalancer.instances = instances;
  }

  /**
   * Get next service instance using load balancing
   */
  getServiceInstance(serviceName, serviceType) {
    const key = `${serviceName}:${serviceType}`;
    const loadBalancer = this.loadBalancers.get(key);
    
    if (!loadBalancer || loadBalancer.instances.length === 0) {
      return null;
    }

    let selectedInstance;

    switch (loadBalancer.strategy) {
      case 'round-robin':
        selectedInstance = loadBalancer.instances[loadBalancer.currentIndex];
        loadBalancer.currentIndex = (loadBalancer.currentIndex + 1) % loadBalancer.instances.length;
        break;

      case 'random':
        const randomIndex = Math.floor(Math.random() * loadBalancer.instances.length);
        selectedInstance = loadBalancer.instances[randomIndex];
        break;

      case 'least-connections':
        // Find instance with least active connections (simplified)
        selectedInstance = loadBalancer.instances.reduce((least, current) => {
          const leastMetrics = this.serviceMetrics.get(least.id);
          const currentMetrics = this.serviceMetrics.get(current.id);
          return (currentMetrics?.requestCount || 0) < (leastMetrics?.requestCount || 0) ? current : least;
        });
        break;

      default:
        selectedInstance = loadBalancer.instances[0];
    }

    return selectedInstance;
  }

  /**
   * Remove a service
   */
  async removeService(serviceId) {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        throw new Error(`Service not found: ${serviceId}`);
      }

      // Remove from type mapping
      const type = service.type;
      if (this.serviceTypes.has(type)) {
        this.serviceTypes.get(type).delete(serviceId);
        if (this.serviceTypes.get(type).size === 0) {
          this.serviceTypes.delete(type);
        }
      }

      // Remove service data
      this.services.delete(serviceId);
      this.serviceHealth.delete(serviceId);
      this.serviceMetrics.delete(serviceId);

      // Update load balancers
      this.setupLoadBalancer(service.name, service.type);

      // Emit service removal event
      this.emitEvent('service:removed', {
        serviceId,
        name: service.name,
        type: service.type
      });

      Logger.info(`Service removed: ${service.name} (${serviceId})`);
      return { success: true };

    } catch (error) {
      Logger.error('Error removing service:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('service:registered', (event) => {
      this.addEventToHistory('service:registered', event);
    });

    this.on('service:health:changed', (event) => {
      this.addEventToHistory('service:health:changed', event);
      
      if (event.currentStatus === 'unhealthy') {
        Logger.warn(`Service health degraded: ${event.service}`, event);
      } else if (event.currentStatus === 'healthy' && event.previousStatus === 'unhealthy') {
        Logger.info(`Service health recovered: ${event.service}`, event);
      }
    });

    this.on('service:health:critical', (event) => {
      this.addEventToHistory('service:health:critical', event);
      Logger.error(`Service in critical state: ${event.service}`, event);
    });

    this.on('service:removed', (event) => {
      this.addEventToHistory('service:removed', event);
    });
  }

  /**
   * Emit and track events
   */
  emitEvent(eventType, data) {
    this.emit(eventType, data);
    this.addEventToHistory(eventType, data);
  }

  /**
   * Add event to history
   */
  addEventToHistory(eventType, data) {
    this.eventHistory.push({
      timestamp: new Date().toISOString(),
      type: eventType,
      data
    });

    // Maintain history size
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxEventHistory);
    }
  }

  /**
   * Generate unique service ID
   */
  generateServiceId(name, type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}:${name}:${timestamp}:${random}`;
  }

  /**
   * Get service count
   */
  getServiceCount() {
    return this.services.size;
  }

  /**
   * Get service discovery health
   */
  getHealth() {
    const healthyServices = Array.from(this.serviceHealth.values())
      .filter(health => health.status === 'healthy').length;
    
    const totalServices = this.services.size;
    const healthRate = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

    return {
      status: 'healthy',
      serviceCount: totalServices,
      healthyServices,
      unhealthyServices: totalServices - healthyServices,
      healthRate: Math.round(healthRate * 100) / 100,
      eventHistorySize: this.eventHistory.length,
      monitoringActive: !!this.healthCheckTimer
    };
  }

  /**
   * Get service discovery statistics
   */
  getStatistics() {
    const stats = {
      totalServices: this.services.size,
      servicesByType: {},
      healthStats: {
        healthy: 0,
        unhealthy: 0,
        unknown: 0
      },
      totalRequests: 0,
      totalErrors: 0
    };

    // Count services by type
    for (const [type, serviceIds] of this.serviceTypes) {
      stats.servicesByType[type] = serviceIds.size;
    }

    // Count health statuses and aggregate metrics
    for (const [serviceId, health] of this.serviceHealth) {
      stats.healthStats[health.status] = (stats.healthStats[health.status] || 0) + 1;
      
      const metrics = this.serviceMetrics.get(serviceId);
      if (metrics) {
        stats.totalRequests += metrics.requestCount;
        stats.totalErrors += metrics.errorCount;
      }
    }

    return stats;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    Logger.info('Cleaning up service discovery...');
    
    // Stop health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Clear all data
    this.services.clear();
    this.serviceTypes.clear();
    this.serviceHealth.clear();
    this.serviceMetrics.clear();
    this.loadBalancers.clear();
    this.eventHistory = [];
    
    // Remove all event listeners
    this.removeAllListeners();
    
    Logger.info('Service discovery cleanup complete');
  }
}

export default MCPServiceDiscovery;
