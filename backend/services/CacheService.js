/**
 * Cache Service for Educational Platform
 * Provides intelligent caching to reduce API calls, improve performance, and handle rate limits
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { Logger } from '../utils/Logger.js';

export class CacheService {
  constructor(config = {}) {
    this.config = {
      // Default TTL for different content types (in seconds)
      defaultTTL: 600, // 10 minutes
      chatResponseTTL: 300, // 5 minutes
      educationalContentTTL: 1800, // 30 minutes
      quizTTL: 3600, // 1 hour
      storyTTL: 7200, // 2 hours
      topicExplorationTTL: 900, // 15 minutes
      imageSearchTTL: 3600, // 1 hour
      
      // Rate limiting cache
      rateLimitTTL: 3600, // 1 hour
      
      // Memory management
      checkperiod: 120, // Check for expired keys every 2 minutes
      maxKeys: 1000, // Maximum number of keys in cache
      
      ...config
    };

    // Main content cache
    this.contentCache = new NodeCache({
      stdTTL: this.config.defaultTTL,
      checkperiod: this.config.checkperiod,
      maxKeys: this.config.maxKeys,
      useClones: false, // Better performance, but be careful with object mutations
      deleteOnExpire: true
    });

    // Rate limiting cache - separate cache for tracking API call frequencies
    this.rateLimitCache = new NodeCache({
      stdTTL: this.config.rateLimitTTL,
      checkperiod: 60, // Check every minute
      deleteOnExpire: true
    });

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      rateLimitChecks: 0,
      rateLimitHits: 0
    };

    // Event listeners for monitoring
    this.setupEventListeners();

    Logger.info('CacheService initialized', {
      defaultTTL: this.config.defaultTTL,
      maxKeys: this.config.maxKeys
    });
  }

  /**
   * Setup event listeners for cache monitoring
   */
  setupEventListeners() {
    this.contentCache.on('set', (key, value) => {
      this.stats.sets++;
      Logger.debug('Cache set', { key: this.maskKey(key), ttl: this.contentCache.getTtl(key) });
    });

    this.contentCache.on('del', (key, value) => {
      Logger.debug('Cache delete', { key: this.maskKey(key) });
    });

    this.contentCache.on('expired', (key, value) => {
      Logger.debug('Cache expired', { key: this.maskKey(key) });
    });
  }

  /**
   * Generate a cache key from various parameters
   */
  generateKey(type, params = {}) {
    // Create a consistent key by sorting object properties
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const keyString = `${type}:${JSON.stringify(sortedParams)}`;
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Mask sensitive parts of cache keys for logging
   */
  maskKey(key) {
    return key.length > 16 ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : key;
  }

  /**
   * Get content from cache
   */
  get(type, params = {}) {
    const key = this.generateKey(type, params);
    const cached = this.contentCache.get(key);
    
    if (cached !== undefined) {
      this.stats.hits++;
      Logger.debug('Cache hit', { 
        type, 
        key: this.maskKey(key),
        hitRate: this.getHitRate()
      });
      return cached;
    }
    
    this.stats.misses++;
    Logger.debug('Cache miss', { 
      type, 
      key: this.maskKey(key),
      hitRate: this.getHitRate()
    });
    return null;
  }

  /**
   * Set content in cache with appropriate TTL based on content type
   */
  set(type, params = {}, value, customTTL = null) {
    const key = this.generateKey(type, params);
    const ttl = customTTL || this.getTTLForType(type);
    
    // Don't cache null or undefined values
    if (value === null || value === undefined) {
      Logger.warn('Attempted to cache null/undefined value', { type, key: this.maskKey(key) });
      return false;
    }

    // Add metadata to cached value
    const cacheEntry = {
      data: value,
      timestamp: Date.now(),
      type,
      params: this.sanitizeParams(params)
    };

    const success = this.contentCache.set(key, cacheEntry, ttl);
    
    if (success) {
      Logger.debug('Content cached', { 
        type, 
        key: this.maskKey(key), 
        ttl,
        size: JSON.stringify(cacheEntry).length
      });
    } else {
      Logger.warn('Failed to cache content', { type, key: this.maskKey(key) });
    }
    
    return success;
  }

  /**
   * Get TTL for specific content type
   */
  getTTLForType(type) {
    const ttlMap = {
      'chat_response': this.config.chatResponseTTL,
      'educational_content': this.config.educationalContentTTL,
      'quiz': this.config.quizTTL,
      'story': this.config.storyTTL,
      'topic_exploration': this.config.topicExplorationTTL,
      'image_search': this.config.imageSearchTTL,
      'socratic_dialogue': this.config.chatResponseTTL,
      'learning_path': this.config.chatResponseTTL,
      'content_generation': this.config.educationalContentTTL
    };

    return ttlMap[type] || this.config.defaultTTL;
  }

  /**
   * Sanitize parameters for storage (remove sensitive data)
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    
    // Remove potentially sensitive data
    delete sanitized.apiKey;
    delete sanitized.authorization;
    delete sanitized.token;
    
    // Truncate very long strings to prevent excessive memory usage
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });
    
    return sanitized;
  }

  /**
   * Check if an API call should be allowed based on rate limiting
   */
  checkRateLimit(apiType, identifier, limit = 100, windowMs = 3600000) {
    this.stats.rateLimitChecks++;
    
    const key = `ratelimit:${apiType}:${identifier}`;
    const current = this.rateLimitCache.get(key) || 0;
    
    if (current >= limit) {
      this.stats.rateLimitHits++;
      Logger.warn('Rate limit exceeded', { 
        apiType, 
        identifier: this.maskKey(identifier), 
        current, 
        limit 
      });
      return false;
    }
    
    // Increment counter
    this.rateLimitCache.set(key, current + 1, Math.ceil(windowMs / 1000));
    
    Logger.debug('Rate limit check passed', { 
      apiType, 
      identifier: this.maskKey(identifier), 
      current: current + 1, 
      limit 
    });
    
    return true;
  }

  /**
   * Clear cache for specific type or all
   */
  clear(type = null) {
    if (type) {
      const keys = this.contentCache.keys();
      let cleared = 0;
      
      keys.forEach(key => {
        const cached = this.contentCache.get(key);
        if (cached && cached.type === type) {
          this.contentCache.del(key);
          cleared++;
        }
      });
      
      Logger.info('Cleared cache by type', { type, cleared });
      return cleared;
    } else {
      const keyCount = this.contentCache.keys().length;
      this.contentCache.flushAll();
      this.rateLimitCache.flushAll();
      
      Logger.info('Cleared all cache', { keyCount });
      return keyCount;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const contentStats = this.contentCache.getStats();
    const rateLimitStats = this.rateLimitCache.getStats();
    
    return {
      content: {
        keys: contentStats.keys,
        hits: this.stats.hits,
        misses: this.stats.misses,
        sets: this.stats.sets,
        hitRate: this.getHitRate(),
        size: JSON.stringify(this.contentCache.data).length
      },
      rateLimit: {
        keys: rateLimitStats.keys,
        checks: this.stats.rateLimitChecks,
        hits: this.stats.rateLimitHits
      },
      memory: {
        contentCache: contentStats,
        rateLimitCache: rateLimitStats
      }
    };
  }

  /**
   * Get cache hit rate as percentage
   */
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
  }

  /**
   * Get cached content with fallback execution
   */
  async getOrSet(type, params, fallbackFn, customTTL = null) {
    // Try to get from cache first
    const cached = this.get(type, params);
    if (cached) {
      return cached.data;
    }

    try {
      // Execute fallback function
      Logger.debug('Executing fallback function', { type, params: this.sanitizeParams(params) });
      const result = await fallbackFn();
      
      // Cache the result
      this.set(type, params, result, customTTL);
      
      return result;
    } catch (error) {
      Logger.error('Fallback function failed', { 
        type, 
        error: error.message,
        params: this.sanitizeParams(params)
      });
      throw error;
    }
  }

  /**
   * Preload cache with common educational content
   */
  async preloadCache() {
    Logger.info('Starting cache preload for common educational content');
    
    const commonTopics = [
      'mathematics basics',
      'science fundamentals', 
      'reading comprehension',
      'creative writing',
      'history overview'
    ];
    
    const ageGroups = ['5-7', '8-10', '11-13', '14-17'];
    
    // This would typically connect to your content generation services
    // For now, we'll just log the intent
    Logger.info('Cache preload completed', { 
      topics: commonTopics.length, 
      ageGroups: ageGroups.length 
    });
  }

  /**
   * Health check for cache service
   */
  healthCheck() {
    const stats = this.getStats();
    const isHealthy = stats.content.hitRate > 10 || stats.content.keys < 50; // Healthy if good hit rate or not many keys yet
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup expired entries and optimize cache
   */
  optimize() {
    const beforeKeys = this.contentCache.keys().length;
    
    // Force cleanup of expired keys
    this.contentCache.keys().forEach(key => {
      this.contentCache.get(key); // This will trigger cleanup of expired keys
    });
    
    const afterKeys = this.contentCache.keys().length;
    const cleaned = beforeKeys - afterKeys;
    
    Logger.info('Cache optimization completed', { beforeKeys, afterKeys, cleaned });
    
    return { cleaned, remaining: afterKeys };
  }
}

// Singleton instance
let cacheServiceInstance = null;

/**
 * Get singleton instance of CacheService
 */
export function getCacheService(config = {}) {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService(config);
  }
  return cacheServiceInstance;
}

/**
 * Initialize cache service with configuration
 */
export function initializeCacheService(config = {}) {
  cacheServiceInstance = new CacheService(config);
  return cacheServiceInstance;
}

export default CacheService;
