/**
 * Error Handling Middleware
 * Provides centralized error handling with proper logging and user-friendly responses
 */

import { Logger } from '../utils/Logger.js';

export class ErrorHandler {
  /**
   * Async error wrapper to catch async errors in route handlers
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 404 Not Found Handler
   */
  static notFoundHandler(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  }

  /**
   * General error handler
   */
  static errorHandler(error, req, res, next) {
    const statusCode = error.status || error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log error details
    Logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode,
      body: req.body ? JSON.stringify(req.body).substring(0, 500) : undefined
    });

    // Security: Don't leak error details in production
    const response = {
      error: ErrorHandler.getErrorMessage(statusCode, error, isProduction),
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    // Add error details for development
    if (!isProduction) {
      response.details = error.message;
      response.stack = error.stack;
    }

    // Add request ID if available
    if (req.id) {
      response.requestId = req.id;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(statusCode, error, isProduction) {
    const errorMessages = {
      400: 'Bad Request - Invalid input provided',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Access denied',
      404: 'Not Found - Requested resource not found',
      422: 'Unprocessable Entity - Invalid data format',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Something went wrong',
      502: 'Bad Gateway - Upstream service error',
      503: 'Service Unavailable - Service temporarily unavailable',
      504: 'Gateway Timeout - Request timed out'
    };

    if (isProduction) {
      return errorMessages[statusCode] || 'An error occurred';
    }

    return error.message || errorMessages[statusCode] || 'An error occurred';
  }

  /**
   * Handle OpenAI API errors
   */
  static handleOpenAIError(error) {
    Logger.error('OpenAI API error', {
      error: error.message,
      type: error.type,
      code: error.code,
      status: error.status
    });

    if (error.status === 429) {
      const customError = new Error('AI service is currently busy. Please try again in a moment.');
      customError.status = 429;
      return customError;
    }

    if (error.status === 401) {
      const customError = new Error('AI service authentication failed.');
      customError.status = 500; // Don't expose auth issues to users
      return customError;
    }

    if (error.status >= 500) {
      const customError = new Error('AI service is temporarily unavailable.');
      customError.status = 503;
      return customError;
    }

    const customError = new Error('AI service request failed.');
    customError.status = 500;
    return customError;
  }

  /**
   * Handle Anthropic API errors
   */
  static handleAnthropicError(error) {
    Logger.error('Anthropic API error', {
      error: error.message,
      type: error.type,
      status: error.status
    });

    // Similar to OpenAI error handling
    if (error.status === 429) {
      const customError = new Error('AI service is currently busy. Please try again in a moment.');
      customError.status = 429;
      return customError;
    }

    const customError = new Error('AI service request failed.');
    customError.status = 500;
    return customError;
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error) {
    const customError = new Error('Invalid input provided');
    customError.status = 400;
    customError.details = error.details || error.message;
    return customError;
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error) {
    Logger.error('Database error', {
      error: error.message,
      code: error.code,
      constraint: error.constraint
    });

    const customError = new Error('Database operation failed');
    customError.status = 500;
    return customError;
  }

  /**
   * Handle file upload errors
   */
  static handleFileUploadError(error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const customError = new Error('File too large. Maximum size is 10MB.');
      customError.status = 413;
      return customError;
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      const customError = new Error('Too many files. Maximum is 5 files.');
      customError.status = 413;
      return customError;
    }

    if (error.code === 'INVALID_FILE_TYPE') {
      const customError = new Error('Invalid file type. Only images and PDFs are allowed.');
      customError.status = 415;
      return customError;
    }

    const customError = new Error('File upload failed');
    customError.status = 500;
    return customError;
  }

  /**
   * Create custom error
   */
  static createError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.status = statusCode;
    if (details) {
      error.details = details;
    }
    return error;
  }

  /**
   * Health check error handler
   */
  static handleHealthCheckError(error) {
    Logger.error('Health check failed', {
      error: error.message,
      component: 'HealthCheck'
    });

    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        ai: 'unknown',
        mcp: 'unknown'
      }
    };
  }

  /**
   * Rate limit error handler
   */
  static handleRateLimitError(req, res) {
    Logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      component: 'RateLimit'
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.get('Retry-After'),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * CORS error handler
   */
  static handleCORSError(error, req, res, next) {
    if (error.message && error.message.includes('CORS')) {
      Logger.warn('CORS error', {
        origin: req.headers.origin,
        method: req.method,
        path: req.path,
        component: 'CORS'
      });

      return res.status(403).json({
        error: 'CORS policy violation',
        message: 'Origin not allowed',
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
}
