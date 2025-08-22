/**
 * Metrics Service - Centralized metrics collection and analysis
 * Provides reusable metrics functionality across all microservices
 */

import { Logger } from '../utils/Logger.js';

export class MetricsService {
  constructor(config = {}) {
    this.config = {
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      maxMetricPoints: 10000,
      enableDetailedMetrics: true,
      ...config
    };

    this.metrics = new Map();
    this.counters = new Map();
    this.timers = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    
    this.startTime = Date.now();
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    Logger.info('MetricsService initialized', { component: 'MetricsService' });
  }

  /**
   * Increment a counter
   */
  incrementCounter(name, tags = {}, value = 1) {
    const key = this.createMetricKey(name, tags);
    const current = this.counters.get(key) || { value: 0, tags, lastUpdated: Date.now() };
    
    current.value += value;
    current.lastUpdated = Date.now();
    
    this.counters.set(key, current);
    
    if (this.config.enableDetailedMetrics) {
      this.recordMetricPoint('counter', name, current.value, tags);
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name, value, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const gauge = {
      value,
      tags,
      lastUpdated: Date.now()
    };
    
    this.gauges.set(key, gauge);
    
    if (this.config.enableDetailedMetrics) {
      this.recordMetricPoint('gauge', name, value, tags);
    }
  }

  /**
   * Start a timer
   */
  startTimer(name, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const timer = {
      startTime: Date.now(),
      tags
    };
    
    this.timers.set(key, timer);
    return key;
  }

  /**
   * End a timer and record the duration
   */
  endTimer(timerKey) {
    const timer = this.timers.get(timerKey);
    
    if (!timer) {
      Logger.warn('Timer not found', { timerKey, component: 'MetricsService' });
      return 0;
    }

    const duration = Date.now() - timer.startTime;
    this.timers.delete(timerKey);

    // Extract metric name from key
    const [name] = timerKey.split('|');
    
    // Record histogram
    this.recordHistogram(name, duration, timer.tags);
    
    return duration;
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name, value, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const histogram = this.histograms.get(key) || {
      values: [],
      tags,
      lastUpdated: Date.now()
    };

    histogram.values.push({
      value,
      timestamp: Date.now()
    });

    // Keep only recent values to prevent memory issues
    if (histogram.values.length > this.config.maxMetricPoints) {
      histogram.values = histogram.values.slice(-this.config.maxMetricPoints);
    }

    histogram.lastUpdated = Date.now();
    this.histograms.set(key, histogram);

    if (this.config.enableDetailedMetrics) {
      this.recordMetricPoint('histogram', name, value, tags);
    }
  }

  /**
   * Record a metric point for detailed analytics
   */
  recordMetricPoint(type, name, value, tags = {}) {
    const key = `${type}:${name}`;
    const points = this.metrics.get(key) || [];
    
    points.push({
      value,
      tags,
      timestamp: Date.now()
    });

    // Cleanup old points
    const cutoff = Date.now() - this.config.retentionPeriod;
    const recentPoints = points.filter(p => p.timestamp > cutoff);

    this.metrics.set(key, recentPoints);
  }

  /**
   * Create a unique metric key
   */
  createMetricKey(name, tags = {}) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return `${name}|${tagString}`;
  }

  /**
   * Get counter value
   */
  getCounter(name, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const counter = this.counters.get(key);
    return counter ? counter.value : 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const gauge = this.gauges.get(key);
    return gauge ? gauge.value : null;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const histogram = this.histograms.get(key);
    
    if (!histogram || histogram.values.length === 0) {
      return null;
    }

    const values = histogram.values.map(v => v.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / count;

    const p50 = this.percentile(values, 0.5);
    const p90 = this.percentile(values, 0.9);
    const p95 = this.percentile(values, 0.95);
    const p99 = this.percentile(values, 0.99);

    return {
      count,
      sum,
      mean,
      min: values[0],
      max: values[count - 1],
      p50,
      p90,
      p95,
      p99,
      lastUpdated: histogram.lastUpdated
    };
  }

  /**
   * Calculate percentile
   */
  percentile(sortedValues, p) {
    if (sortedValues.length === 0) return 0;
    
    const index = (sortedValues.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Get all metrics summary
   */
  getAllMetrics() {
    const summary = {
      counters: this.getCountersSummary(),
      gauges: this.getGaugesSummary(),
      histograms: this.getHistogramsSummary(),
      uptime: Date.now() - this.startTime,
      timestamp: Date.now()
    };

    return summary;
  }

  /**
   * Get counters summary
   */
  getCountersSummary() {
    const summary = {};
    
    for (const [key, counter] of this.counters.entries()) {
      const [name, tagString] = key.split('|');
      const tags = this.parseTagString(tagString);
      
      if (!summary[name]) {
        summary[name] = [];
      }
      
      summary[name].push({
        value: counter.value,
        tags,
        lastUpdated: counter.lastUpdated
      });
    }

    return summary;
  }

  /**
   * Get gauges summary
   */
  getGaugesSummary() {
    const summary = {};
    
    for (const [key, gauge] of this.gauges.entries()) {
      const [name, tagString] = key.split('|');
      const tags = this.parseTagString(tagString);
      
      if (!summary[name]) {
        summary[name] = [];
      }
      
      summary[name].push({
        value: gauge.value,
        tags,
        lastUpdated: gauge.lastUpdated
      });
    }

    return summary;
  }

  /**
   * Get histograms summary
   */
  getHistogramsSummary() {
    const summary = {};
    
    for (const [key, histogram] of this.histograms.entries()) {
      const [name, tagString] = key.split('|');
      const tags = this.parseTagString(tagString);
      
      if (!summary[name]) {
        summary[name] = [];
      }
      
      const stats = this.getHistogramStats(name, tags);
      summary[name].push({
        stats,
        tags,
        lastUpdated: histogram.lastUpdated
      });
    }

    return summary;
  }

  /**
   * Parse tag string back to object
   */
  parseTagString(tagString) {
    if (!tagString) return {};
    
    const tags = {};
    for (const pair of tagString.split(',')) {
      if (pair) {
        const [key, value] = pair.split('=');
        tags[key] = value;
      }
    }
    
    return tags;
  }

  /**
   * Track API request
   */
  trackRequest(endpoint, method = 'POST', tags = {}) {
    const requestTags = { endpoint, method, ...tags };
    
    this.incrementCounter('api.requests', requestTags);
    return this.startTimer('api.request_duration', requestTags);
  }

  /**
   * Track API response
   */
  trackResponse(timerKey, statusCode, success = true) {
    const duration = this.endTimer(timerKey);
    
    // Extract tags from timer key
    const [, tagString] = timerKey.split('|');
    const tags = this.parseTagString(tagString);
    
    this.incrementCounter('api.responses', { ...tags, status: statusCode, success });
    
    if (!success) {
      this.incrementCounter('api.errors', tags);
    }
    
    return duration;
  }

  /**
   * Track agent usage
   */
  trackAgentUsage(agentName, operation, duration, success = true) {
    const tags = { agent: agentName, operation };
    
    this.incrementCounter('agent.requests', tags);
    this.recordHistogram('agent.duration', duration, tags);
    
    if (!success) {
      this.incrementCounter('agent.errors', tags);
    }
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId, ageGroup, mode, subject = 'general') {
    const tags = { ageGroup, mode, subject };
    
    this.incrementCounter('user.activities', tags);
    this.setGauge('user.last_activity', Date.now(), { userId });
  }

  /**
   * Get service health metrics
   */
  getHealthMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate error rates
    const totalRequests = this.getCounter('api.requests');
    const totalErrors = this.getCounter('api.errors');
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    // Get average response time
    const responseTimes = this.getHistogramStats('api.request_duration');
    const avgResponseTime = responseTimes ? responseTimes.mean : 0;
    
    return {
      uptime,
      totalRequests,
      totalErrors,
      errorRate,
      avgResponseTime,
      memoryUsage: this.getMemoryMetrics(),
      timestamp: now
    };
  }

  /**
   * Get memory usage metrics
   */
  getMemoryMetrics() {
    return {
      counters: this.counters.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      timers: this.timers.size,
      metricPoints: Array.from(this.metrics.values())
        .reduce((sum, points) => sum + points.length, 0)
    };
  }

  /**
   * Start cleanup interval to remove old metrics
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  /**
   * Cleanup old metrics
   */
  cleanup() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    let cleaned = 0;

    // Cleanup detailed metrics
    for (const [key, points] of this.metrics.entries()) {
      const recentPoints = points.filter(p => p.timestamp > cutoff);
      if (recentPoints.length !== points.length) {
        this.metrics.set(key, recentPoints);
        cleaned += points.length - recentPoints.length;
      }
    }

    // Cleanup histograms
    for (const [key, histogram] of this.histograms.entries()) {
      const recentValues = histogram.values.filter(v => v.timestamp > cutoff);
      if (recentValues.length !== histogram.values.length) {
        histogram.values = recentValues;
        cleaned += histogram.values.length - recentValues.length;
      }
    }

    if (cleaned > 0) {
      Logger.info(`Cleaned up ${cleaned} old metric points`, { 
        component: 'MetricsService' 
      });
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.counters.clear();
    this.timers.clear();
    this.gauges.clear();
    this.histograms.clear();
    
    this.startTime = Date.now();
    
    Logger.info('All metrics reset', { component: 'MetricsService' });
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format = 'json') {
    const metrics = this.getAllMetrics();
    
    if (format === 'prometheus') {
      return this.exportPrometheusFormat(metrics);
    }
    
    return metrics;
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusFormat(metrics) {
    let output = '';
    
    // Export counters
    for (const [name, entries] of Object.entries(metrics.counters)) {
      output += `# TYPE ${name} counter\n`;
      for (const entry of entries) {
        const labels = Object.entries(entry.tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        output += `${name}{${labels}} ${entry.value}\n`;
      }
    }
    
    // Export gauges
    for (const [name, entries] of Object.entries(metrics.gauges)) {
      output += `# TYPE ${name} gauge\n`;
      for (const entry of entries) {
        const labels = Object.entries(entry.tags)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        output += `${name}{${labels}} ${entry.value}\n`;
      }
    }
    
    return output;
  }
}

export default MetricsService;
