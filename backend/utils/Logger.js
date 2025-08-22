/**
 * Enhanced Logger Utility
 * Provides structured logging with multiple levels and context tracking
 */

export class Logger {
  static logLevel = process.env.LOG_LEVEL || 'info';
  static logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  /**
   * Core logging method
   */
  static log(level, message, data = {}, context = {}) {
    const currentLevelValue = this.logLevels[this.logLevel] || 2;
    const messageLevelValue = this.logLevels[level] || 2;

    // Only log if message level is at or above current log level
    if (messageLevelValue > currentLevelValue) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data,
      ...context
    };

    // Format for console output
    const consoleMessage = this.formatConsoleMessage(timestamp, level, message, data);
    
    switch (level) {
      case 'error':
        console.error(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'debug':
        console.debug(consoleMessage, data);
        break;
      default:
        console.log(consoleMessage, data);
    }

    // In production, you might want to send logs to external service
    this.persistLog(logEntry);
  }

  /**
   * Format message for console output
   */
  static formatConsoleMessage(timestamp, level, message, data = {}) {
    const levelPrefix = `[${timestamp}] ${level.toUpperCase()}:`;
    const component = data.component || data.agent || '';
    const componentPrefix = component ? `[${component}]` : '';
    
    return `${levelPrefix} ${componentPrefix} ${message}`;
  }

  /**
   * Error logging with stack trace
   */
  static error(message, data = {}) {
    // Capture stack trace if error object is provided
    if (data.error && data.error.stack) {
      data.stack = data.error.stack;
    }
    
    this.log('error', message, data, { severity: 'high' });
  }

  /**
   * Warning logging
   */
  static warn(message, data = {}) {
    this.log('warn', message, data, { severity: 'medium' });
  }

  /**
   * Info logging
   */
  static info(message, data = {}) {
    this.log('info', message, data, { severity: 'low' });
  }

  /**
   * Debug logging
   */
  static debug(message, data = {}) {
    this.log('debug', message, data, { severity: 'trace' });
  }

  /**
   * Agent-specific logging
   */
  static agent(agentName, action, data = {}) {
    this.info(`Agent: ${agentName} - ${action}`, {
      agent: agentName,
      action,
      ...data
    });
  }

  /**
   * API request logging
   */
  static apiRequest(method, endpoint, data = {}) {
    this.info(`API: ${method} ${endpoint}`, {
      component: 'API',
      method,
      endpoint,
      ...data
    });
  }

  /**
   * Safety event logging
   */
  static safety(event, data = {}) {
    this.warn(`Safety: ${event}`, {
      component: 'Safety',
      event,
      ...data
    });
  }

  /**
   * Performance logging
   */
  static performance(operation, duration, data = {}) {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      component: 'Performance',
      operation,
      duration,
      ...data
    });
  }

  /**
   * User interaction logging
   */
  static user(action, data = {}) {
    this.info(`User: ${action}`, {
      component: 'User',
      action,
      ...data
    });
  }

  /**
   * Persist logs (implement based on your needs)
   */
  static persistLog(logEntry) {
    // In development, we just keep in memory
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // In production, you might want to:
    // - Write to file
    // - Send to logging service (e.g., Loggly, Papertrail)
    // - Store in database
    // - Send to monitoring service (e.g., DataDog, New Relic)
    
    // Example file logging (you'd want to add rotation, etc.)
    // fs.appendFileSync('app.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Set log level dynamically
   */
  static setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level)) {
      this.logLevel = level;
      this.info(`Log level set to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}. Valid levels: ${Object.keys(this.logLevels).join(', ')}`);
    }
  }

  /**
   * Create context logger with persistent context
   */
  static createContextLogger(context = {}) {
    return {
      error: (message, data = {}) => this.error(message, { ...context, ...data }),
      warn: (message, data = {}) => this.warn(message, { ...context, ...data }),
      info: (message, data = {}) => this.info(message, { ...context, ...data }),
      debug: (message, data = {}) => this.debug(message, { ...context, ...data })
    };
  }

  /**
   * Log system startup information
   */
  static startup(config = {}) {
    this.info('System starting up', {
      component: 'System',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      ...config
    });
  }

  /**
   * Log system shutdown
   */
  static shutdown(signal = 'UNKNOWN') {
    this.info('System shutting down', {
      component: 'System',
      signal,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  }

  /**
   * Log HTTP requests (middleware helper)
   */
  static httpRequest(req, res, duration) {
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    this.info(`HTTP: ${method} ${url}`, {
      component: 'HTTP',
      method,
      url,
      statusCode,
      ip,
      duration: duration ? `${duration}ms` : undefined,
      userAgent: req.get('User-Agent')
    });
  }
}
