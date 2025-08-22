/**
 * MCP Resource Manager - Dynamic Resource Management System
 * Manages educational resources, files, and data access for the MCP server
 */

import { Logger } from '../utils/Logger.js';
import path from 'path';
import fs from 'fs/promises';

export class MCPResourceManager {
  constructor(mcpServer) {
    this.mcpServer = mcpServer;
    // this.logger removed('MCPResourceManager');
    
    // Resource storage and management
    this.resources = new Map();
    this.resourceTypes = new Map();
    this.resourceCache = new Map();
    this.resourceMetrics = new Map();
    
    // Resource access tracking
    this.accessHistory = [];
    this.maxHistorySize = 1000;
    this.cacheSize = 100; // Maximum cached resources
    
    // Supported resource types
    this.supportedTypes = new Set([
      'curriculum',
      'config',
      'learning',
      'standards',
      'safety',
      'file',
      'data',
      'template',
      'asset'
    ]);
    
    Logger.info('MCP Resource Manager initialized');
  }

  /**
   * Register a new resource
   */
  async registerResource(resourceConfig) {
    try {
      const {
        uri,
        name,
        description,
        mimeType = 'application/json',
        handler = null,
        type = 'data',
        metadata = {},
        cacheable = true,
        ttl = 3600000 // 1 hour default TTL
      } = resourceConfig;

      if (!uri || !name || !description) {
        throw new Error('Resource registration requires uri, name, and description');
      }

      if (this.resources.has(uri)) {
        Logger.warn(`Resource ${uri} already exists, updating...`);
      }

      const resource = {
        uri,
        name,
        description,
        mimeType,
        handler,
        type,
        metadata: {
          ...metadata,
          registeredAt: new Date().toISOString(),
          lastAccessed: null,
          accessCount: 0
        },
        cacheable,
        ttl
      };

      this.resources.set(uri, resource);
      
      // Update type mapping
      if (!this.resourceTypes.has(type)) {
        this.resourceTypes.set(type, new Set());
      }
      this.resourceTypes.get(type).add(uri);

      // Initialize metrics
      this.resourceMetrics.set(uri, {
        accessCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalLoadTime: 0,
        averageLoadTime: 0,
        lastAccessTime: null,
        errors: []
      });

      Logger.info(`Resource registered: ${uri}`, { 
        type, 
        mimeType, 
        totalResources: this.resources.size 
      });

      return { success: true, resource: uri };

    } catch (error) {
      Logger.error('Error registering resource:', error);
      throw error;
    }
  }

  /**
   * List all available resources
   */
  async listResources() {
    try {
      const resources = [];

      for (const [uri, resource] of this.resources) {
        resources.push({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
          type: resource.type,
          metadata: {
            ...resource.metadata,
            metrics: this.resourceMetrics.get(uri)
          }
        });
      }

      return resources.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

    } catch (error) {
      Logger.error('Error listing resources:', error);
      throw error;
    }
  }

  /**
   * Read resource content
   */
  async readResource(uri) {
    const startTime = Date.now();

    try {
      const resource = this.resources.get(uri);
      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      // Update metrics - access count
      const metrics = this.resourceMetrics.get(uri);
      metrics.accessCount++;
      metrics.lastAccessTime = new Date().toISOString();

      // Update resource metadata
      resource.metadata.lastAccessed = new Date().toISOString();
      resource.metadata.accessCount++;

      // Check cache first
      if (resource.cacheable && this.resourceCache.has(uri)) {
        const cached = this.resourceCache.get(uri);
        if (Date.now() - cached.timestamp < resource.ttl) {
          metrics.cacheHits++;
          Logger.debug(`Cache hit for resource: ${uri}`);
          
          // Add to access history
          this.addAccessHistory({
            uri,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            cached: true,
            success: true
          });

          return cached.content;
        } else {
          // Remove expired cache
          this.resourceCache.delete(uri);
        }
      }

      metrics.cacheMisses++;
      Logger.info(`Loading resource: ${uri}`);

      let content;

      // Load content based on type
      if (resource.handler) {
        // Use custom handler
        content = await resource.handler();
      } else {
        // Load based on URI scheme
        content = await this.loadResourceByScheme(uri, resource);
      }

      // Cache if enabled
      if (resource.cacheable) {
        this.cacheResource(uri, content);
      }

      // Update load time metrics
      const duration = Date.now() - startTime;
      metrics.totalLoadTime += duration;
      metrics.averageLoadTime = metrics.totalLoadTime / metrics.accessCount;

      // Add to access history
      this.addAccessHistory({
        uri,
        timestamp: new Date().toISOString(),
        duration,
        cached: false,
        success: true
      });

      return {
        mimeType: resource.mimeType,
        text: typeof content === 'string' ? content : null,
        data: typeof content !== 'string' ? content : null
      };

    } catch (error) {
      const metrics = this.resourceMetrics.get(uri);
      if (metrics) {
        metrics.errors.push({
          timestamp: new Date().toISOString(),
          error: error.message
        });
        
        // Keep only last 10 errors
        if (metrics.errors.length > 10) {
          metrics.errors = metrics.errors.slice(-10);
        }
      }

      // Add error to access history
      this.addAccessHistory({
        uri,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        cached: false,
        success: false,
        error: error.message
      });

      Logger.error(`Resource load failed: ${uri}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Load resource based on URI scheme
   */
  async loadResourceByScheme(uri, resource) {
    const url = new URL(uri);
    const scheme = url.protocol.slice(0, -1); // Remove trailing ':'

    switch (scheme) {
      case 'file':
        return await this.loadFileResource(url.pathname);
      
      case 'curriculum':
        return await this.loadCurriculumResource(url.pathname);
      
      case 'config':
        return await this.loadConfigResource(url.pathname);
      
      case 'learning':
        return await this.loadLearningResource(url.pathname);
      
      case 'standards':
        return await this.loadStandardsResource(url.pathname);
      
      case 'safety':
        return await this.loadSafetyResource(url.pathname);
      
      case 'data':
        return await this.loadDataResource(url.pathname);
      
      default:
        throw new Error(`Unsupported URI scheme: ${scheme}`);
    }
  }

  /**
   * Load file resource
   */
  async loadFileResource(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load file resource: ${error.message}`);
    }
  }

  /**
   * Load curriculum resource
   */
  async loadCurriculumResource(path) {
    // This would integrate with your curriculum data system
    const curriculumData = {
      subjects: {
        mathematics: {
          boards: ['NCERT', 'CBSE', 'ICSE', 'IB'],
          grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
          topics: ['Number Systems', 'Algebra', 'Geometry', 'Statistics']
        },
        science: {
          boards: ['NCERT', 'CBSE', 'ICSE', 'IB'],
          grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
          topics: ['Physics', 'Chemistry', 'Biology', 'Environmental Science']
        },
        language: {
          boards: ['NCERT', 'CBSE', 'ICSE', 'IB'],
          grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
          topics: ['Grammar', 'Literature', 'Writing', 'Reading Comprehension']
        },
        social_studies: {
          boards: ['NCERT', 'CBSE', 'ICSE', 'IB'],
          grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
          topics: ['History', 'Geography', 'Civics', 'Economics']
        }
      }
    };

    switch (path) {
      case '/data/subjects':
        return curriculumData;
      default:
        throw new Error(`Unknown curriculum path: ${path}`);
    }
  }

  /**
   * Load configuration resource
   */
  async loadConfigResource(path) {
    const configs = {
      '/age-groups': {
        '5-7': {
          name: 'Early Elementary',
          description: 'Kindergarten to Grade 2',
          cognitiveLevel: 'concrete operational (early)',
          attentionSpan: '5-10 minutes',
          learningStyle: 'hands-on, visual, play-based',
          vocabulary: 'simple (500-2000 words)',
          complexity: 'basic concepts with concrete examples'
        },
        '8-10': {
          name: 'Late Elementary', 
          description: 'Grades 3-5',
          cognitiveLevel: 'concrete operational',
          attentionSpan: '10-20 minutes',
          learningStyle: 'structured activities, beginning abstract',
          vocabulary: 'elementary (2000-5000 words)',
          complexity: 'intermediate concepts with some abstraction'
        },
        '11-13': {
          name: 'Middle School',
          description: 'Grades 6-8',
          cognitiveLevel: 'formal operational (early)',
          attentionSpan: '20-30 minutes',
          learningStyle: 'analytical thinking, problem-solving',
          vocabulary: 'advanced (5000-10000 words)',
          complexity: 'abstract concepts with logical connections'
        },
        '14-17': {
          name: 'High School',
          description: 'Grades 9-12',
          cognitiveLevel: 'formal operational',
          attentionSpan: '30-45 minutes',
          learningStyle: 'independent research, critical analysis',
          vocabulary: 'sophisticated (10000+ words)',
          complexity: 'complex abstract and theoretical concepts'
        }
      }
    };

    if (configs[path]) {
      return configs[path];
    }
    
    throw new Error(`Unknown config path: ${path}`);
  }

  /**
   * Load learning resource
   */
  async loadLearningResource(path) {
    const learningData = {
      '/objectives': {
        mathematics: {
          'number-sense': 'Develop understanding of number relationships and operations',
          'problem-solving': 'Apply mathematical thinking to solve real-world problems',
          'reasoning': 'Use logical reasoning to analyze mathematical situations',
          'communication': 'Express mathematical ideas clearly and coherently'
        },
        science: {
          'inquiry': 'Develop scientific inquiry and investigation skills',
          'understanding': 'Build understanding of scientific concepts and principles',
          'application': 'Apply scientific knowledge to real-world situations',
          'thinking': 'Develop scientific thinking and reasoning abilities'
        }
      }
    };

    if (learningData[path]) {
      return learningData[path];
    }
    
    throw new Error(`Unknown learning path: ${path}`);
  }

  /**
   * Load standards resource
   */
  async loadStandardsResource(path) {
    const standards = {
      '/educational': {
        'NCERT': {
          focus: 'Holistic development with activity-based learning',
          assessment: 'Continuous and comprehensive evaluation',
          pedagogy: 'Constructivist approach with real-world connections'
        },
        'CBSE': {
          focus: 'Competency-based education with skill development',
          assessment: 'Multiple assessment methods including projects',
          pedagogy: 'Student-centered learning with technology integration'
        },
        'ICSE': {
          focus: 'Comprehensive education with analytical thinking',
          assessment: 'Detailed evaluation with emphasis on understanding',
          pedagogy: 'In-depth study with practical applications'
        }
      }
    };

    if (standards[path]) {
      return standards[path];
    }
    
    throw new Error(`Unknown standards path: ${path}`);
  }

  /**
   * Load safety resource
   */
  async loadSafetyResource(path) {
    const safetyData = {
      '/guidelines': {
        contentFiltering: {
          enabled: true,
          blockedTopics: ['violence', 'inappropriate content', 'harmful activities'],
          ageAppropriate: true,
          educationalFocus: true
        },
        privacyProtection: {
          noPersonalInfo: true,
          anonymizedData: true,
          parentalConsent: true
        },
        interactionGuidelines: {
          positiveReinforcement: true,
          constructiveFeedback: true,
          encourageExploration: true,
          respectDiversity: true
        }
      }
    };

    if (safetyData[path]) {
      return safetyData[path];
    }
    
    throw new Error(`Unknown safety path: ${path}`);
  }

  /**
   * Load data resource
   */
  async loadDataResource(path) {
    // This would load various data resources
    throw new Error(`Data resource not implemented: ${path}`);
  }

  /**
   * Cache resource content
   */
  cacheResource(uri, content) {
    // Remove oldest cache entries if at capacity
    if (this.resourceCache.size >= this.cacheSize) {
      const oldestUri = this.resourceCache.keys().next().value;
      this.resourceCache.delete(oldestUri);
    }

    this.resourceCache.set(uri, {
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Add access to history
   */
  addAccessHistory(access) {
    this.accessHistory.push(access);
    
    // Maintain history size
    if (this.accessHistory.length > this.maxHistorySize) {
      this.accessHistory = this.accessHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Clear cache
   */
  clearCache(uri = null) {
    if (uri) {
      this.resourceCache.delete(uri);
      Logger.info(`Cache cleared for resource: ${uri}`);
    } else {
      this.resourceCache.clear();
      Logger.info('All resource cache cleared');
    }
  }

  /**
   * Get resource by URI
   */
  getResource(uri) {
    return this.resources.get(uri);
  }

  /**
   * Get resources by type
   */
  getResourcesByType(type) {
    const resourceUris = this.resourceTypes.get(type) || new Set();
    const resources = [];
    
    for (const uri of resourceUris) {
      const resource = this.resources.get(uri);
      if (resource) {
        resources.push(resource);
      }
    }
    
    return resources;
  }

  /**
   * Get resource metrics
   */
  getResourceMetrics(uri = null) {
    if (uri) {
      return this.resourceMetrics.get(uri);
    }
    
    // Return all metrics
    const allMetrics = {};
    for (const [resourceUri, metrics] of this.resourceMetrics) {
      allMetrics[resourceUri] = metrics;
    }
    return allMetrics;
  }

  /**
   * Get access history
   */
  getAccessHistory(uri = null, limit = 100) {
    let history = this.accessHistory;
    
    if (uri) {
      history = history.filter(access => access.uri === uri);
    }
    
    return history.slice(-limit);
  }

  /**
   * Remove a resource
   */
  async removeResource(uri) {
    try {
      const resource = this.resources.get(uri);
      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      // Remove from type mapping
      const type = resource.type;
      if (this.resourceTypes.has(type)) {
        this.resourceTypes.get(type).delete(uri);
        if (this.resourceTypes.get(type).size === 0) {
          this.resourceTypes.delete(type);
        }
      }

      // Remove resource data
      this.resources.delete(uri);
      this.resourceMetrics.delete(uri);
      this.resourceCache.delete(uri);

      Logger.info(`Resource removed: ${uri}`);
      return { success: true };

    } catch (error) {
      Logger.error('Error removing resource:', error);
      throw error;
    }
  }

  /**
   * Search resources
   */
  searchResources(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [uri, resource] of this.resources) {
      const matchScore = this.calculateMatchScore(resource, searchTerm);
      if (matchScore > 0) {
        results.push({
          resource,
          score: matchScore
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.resource);
  }

  /**
   * Calculate match score for search
   */
  calculateMatchScore(resource, searchTerm) {
    let score = 0;

    // URI match
    if (resource.uri.toLowerCase().includes(searchTerm)) {
      score += 10;
    }

    // Name match (highest weight)
    if (resource.name.toLowerCase().includes(searchTerm)) {
      score += 8;
    }

    // Description match
    if (resource.description.toLowerCase().includes(searchTerm)) {
      score += 5;
    }

    // Type match
    if (resource.type.toLowerCase().includes(searchTerm)) {
      score += 3;
    }

    return score;
  }

  /**
   * Get resource count
   */
  getResourceCount() {
    return this.resources.size;
  }

  /**
   * Get resource manager health
   */
  getHealth() {
    const totalAccess = Array.from(this.resourceMetrics.values())
      .reduce((sum, metrics) => sum + metrics.accessCount, 0);
    
    const totalCacheHits = Array.from(this.resourceMetrics.values())
      .reduce((sum, metrics) => sum + metrics.cacheHits, 0);

    const cacheHitRate = totalAccess > 0 ? (totalCacheHits / totalAccess) * 100 : 0;

    return {
      status: 'healthy',
      resourceCount: this.resources.size,
      typeCount: this.resourceTypes.size,
      cacheSize: this.resourceCache.size,
      totalAccess,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      accessHistorySize: this.accessHistory.length
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    Logger.info('Cleaning up resource manager...');
    
    this.resources.clear();
    this.resourceTypes.clear();
    this.resourceCache.clear();
    this.resourceMetrics.clear();
    this.accessHistory = [];
    
    Logger.info('Resource manager cleanup complete');
  }
}

export default MCPResourceManager;
