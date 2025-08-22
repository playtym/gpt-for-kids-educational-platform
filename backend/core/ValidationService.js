/**
 * Validation Service - Reusable validation utilities
 * Provides consistent validation across all microservices
 */

import { Logger } from '../utils/Logger.js';

export class ValidationService {
  constructor(config = {}) {
    this.config = {
      strictMode: false,
      logValidationErrors: true,
      ...config
    };
    
    this.validationRules = new Map();
    this.setupDefaultRules();
    
    Logger.info('ValidationService initialized', { component: 'ValidationService' });
  }

  /**
   * Setup default validation rules
   */
  setupDefaultRules() {
    // Age group validation
    this.addRule('ageGroup', {
      validator: (value) => ['5-7', '8-10', '11-13', '14-17'].includes(value),
      message: 'Invalid age group. Must be one of: 5-7, 8-10, 11-13, 14-17'
    });

    // Mode validation
    this.addRule('mode', {
      validator: (value) => ['explore', 'learn', 'create', 'feedback', 'questions', 'quiz', 'curriculum', 'topics'].includes(value),
      message: 'Invalid mode. Must be one of: explore, learn, create, feedback, questions, quiz, curriculum, topics'
    });

    // Subject validation
    this.addRule('subject', {
      validator: (value) => ['math', 'science', 'language', 'history', 'geography', 'art', 'music', 'general'].includes(value.toLowerCase()),
      message: 'Invalid subject',
      optional: true
    });

    // Required string validation
    this.addRule('requiredString', {
      validator: (value) => typeof value === 'string' && value.trim().length > 0,
      message: 'Must be a non-empty string'
    });

    // Email validation
    this.addRule('email', {
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format'
    });

    // Number range validation
    this.addRule('numberRange', {
      validator: (value, min = 0, max = 100) => {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
      },
      message: 'Number out of valid range'
    });

    // Array validation
    this.addRule('array', {
      validator: (value) => Array.isArray(value),
      message: 'Must be an array'
    });

    // Object validation
    this.addRule('object', {
      validator: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
      message: 'Must be an object'
    });

    // Quiz type validation
    this.addRule('quizType', {
      validator: (value) => ['mcq', 'true-false', 'short-answer', 'mixed'].includes(value),
      message: 'Invalid quiz type',
      optional: true
    });

    // Learning style validation
    this.addRule('learningStyle', {
      validator: (value) => ['visual', 'auditory', 'kinesthetic', 'mixed'].includes(value),
      message: 'Invalid learning style',
      optional: true
    });
  }

  /**
   * Add a custom validation rule
   */
  addRule(name, rule) {
    this.validationRules.set(name, rule);
  }

  /**
   * Validate a single value against a rule
   */
  validateField(value, ruleName, ...args) {
    const rule = this.validationRules.get(ruleName);
    
    if (!rule) {
      throw new Error(`Validation rule not found: ${ruleName}`);
    }

    // Handle optional fields
    if (rule.optional && (value === undefined || value === null)) {
      return { valid: true };
    }

    const isValid = rule.validator(value, ...args);
    
    return {
      valid: isValid,
      message: isValid ? null : rule.message,
      value
    };
  }

  /**
   * Validate an object against a schema
   */
  validateSchema(data, schema) {
    const errors = [];
    const validatedData = {};

    for (const [field, fieldSchema] of Object.entries(schema)) {
      const value = data[field];
      
      try {
        // Handle required fields
        if (fieldSchema.required && (value === undefined || value === null)) {
          errors.push({
            field,
            message: `${field} is required`,
            value
          });
          continue;
        }

        // Skip validation if optional and not provided
        if (!fieldSchema.required && (value === undefined || value === null)) {
          continue;
        }

        // Validate against rule
        const result = this.validateField(value, fieldSchema.rule, ...(fieldSchema.args || []));
        
        if (!result.valid) {
          errors.push({
            field,
            message: result.message,
            value
          });
        } else {
          validatedData[field] = value;
        }

        // Custom validation function
        if (fieldSchema.customValidator) {
          const customResult = fieldSchema.customValidator(value, data);
          if (!customResult.valid) {
            errors.push({
              field,
              message: customResult.message,
              value
            });
          }
        }

      } catch (error) {
        errors.push({
          field,
          message: `Validation error: ${error.message}`,
          value
        });
      }
    }

    const isValid = errors.length === 0;
    
    if (!isValid && this.config.logValidationErrors) {
      Logger.warn('Validation failed', { 
        component: 'ValidationService',
        errors,
        data: this.sanitizeForLogging(data)
      });
    }

    return {
      valid: isValid,
      errors,
      data: validatedData
    };
  }

  /**
   * Common validation schemas
   */
  getSchema(schemaName) {
    const schemas = {
      chatRequest: {
        message: { required: true, rule: 'requiredString' },
        mode: { required: true, rule: 'mode' },
        ageGroup: { required: true, rule: 'ageGroup' },
        subject: { required: false, rule: 'subject' },
        context: { required: false, rule: 'array' }
      },

      quizRequest: {
        topic: { required: true, rule: 'requiredString' },
        ageGroup: { required: true, rule: 'ageGroup' },
        questionCount: { 
          required: false, 
          rule: 'numberRange', 
          args: [1, 20],
          customValidator: (value) => ({
            valid: value === undefined || (Number.isInteger(Number(value)) && Number(value) > 0),
            message: 'Question count must be a positive integer'
          })
        },
        quizType: { required: false, rule: 'quizType' },
        context: { required: false, rule: 'array' }
      },

      topicRequest: {
        subject: { required: true, rule: 'requiredString' },
        ageGroup: { required: true, rule: 'ageGroup' },
        modes: { required: false, rule: 'array' },
        userContext: { required: false, rule: 'object' }
      },

      userContext: {
        userId: { required: false, rule: 'requiredString' },
        preferences: { required: false, rule: 'object' },
        history: { required: false, rule: 'array' },
        currentSession: { required: false, rule: 'object' }
      },

      userPreferences: {
        favoriteSubjects: { required: false, rule: 'array' },
        learningStyle: { required: false, rule: 'learningStyle' },
        interests: { required: false, rule: 'array' },
        difficulty: { 
          required: false, 
          rule: 'requiredString',
          customValidator: (value) => ({
            valid: value === undefined || ['easy', 'normal', 'challenging'].includes(value),
            message: 'Difficulty must be easy, normal, or challenging'
          })
        }
      }
    };

    return schemas[schemaName];
  }

  /**
   * Validate common request types
   */
  validateChatRequest(data) {
    return this.validateSchema(data, this.getSchema('chatRequest'));
  }

  validateQuizRequest(data) {
    return this.validateSchema(data, this.getSchema('quizRequest'));
  }

  validateTopicRequest(data) {
    return this.validateSchema(data, this.getSchema('topicRequest'));
  }

  validateUserContext(data) {
    return this.validateSchema(data, this.getSchema('userContext'));
  }

  validateUserPreferences(data) {
    return this.validateSchema(data, this.getSchema('userPreferences'));
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeForLogging(data) {
    const sanitized = { ...data };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Truncate long messages
    if (sanitized.message && sanitized.message.length > 100) {
      sanitized.message = sanitized.message.substring(0, 100) + '...';
    }

    return sanitized;
  }

  /**
   * Create a validation middleware for Express
   */
  createMiddleware(schemaName) {
    return (req, res, next) => {
      const schema = this.getSchema(schemaName);
      
      if (!schema) {
        return res.status(500).json({
          error: 'Internal validation error',
          message: `Schema not found: ${schemaName}`
        });
      }

      const result = this.validateSchema(req.body, schema);
      
      if (!result.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.errors
        });
      }

      // Attach validated data to request
      req.validatedData = result.data;
      next();
    };
  }

  /**
   * Batch validation for multiple items
   */
  validateBatch(items, schemaName) {
    const results = [];
    const schema = this.getSchema(schemaName);
    
    if (!schema) {
      throw new Error(`Schema not found: ${schemaName}`);
    }

    for (let i = 0; i < items.length; i++) {
      const result = this.validateSchema(items[i], schema);
      results.push({
        index: i,
        ...result
      });
    }

    const allValid = results.every(r => r.valid);
    const errors = results.filter(r => !r.valid);

    return {
      valid: allValid,
      results,
      errors,
      validItems: results.filter(r => r.valid).map(r => r.data)
    };
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      totalRules: this.validationRules.size,
      availableSchemas: Object.keys(this.getSchema('chatRequest') ? {} : {}),
      config: this.config
    };
  }

  /**
   * Reset validation rules to defaults
   */
  resetToDefaults() {
    this.validationRules.clear();
    this.setupDefaultRules();
    Logger.info('Validation rules reset to defaults', { component: 'ValidationService' });
  }
}

export default ValidationService;
