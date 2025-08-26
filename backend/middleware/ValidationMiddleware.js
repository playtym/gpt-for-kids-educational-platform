/**
 * Input Validation Middleware
 * Provides comprehensive input validation and sanitization
 */

import { body, param, query, validationResult } from 'express-validator';
import { Logger } from '../utils/Logger.js';

export class ValidationMiddleware {
  /**
   * Handle validation errors
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Logger.warn('Validation failed', {
        component: 'ValidationMiddleware',
        errors: errors.array(),
        endpoint: req.path,
        method: req.method
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }

  /**
   * Chat request validation
   */
  static validateChatRequest() {
    return [
      body('message')
        .isString()
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message must be a string between 1 and 2000 characters'),
      
      body('mode')
        .isIn(['explore', 'learn', 'create', 'feedback', 'questions', 'quiz', 'curriculum'])
        .withMessage('Mode must be one of: explore, learn, create, feedback, questions, quiz, curriculum'),
      
      body('ageGroup')
        .isIn(['5-7', '8-10', '11-13', '14-17'])
        .withMessage('Age group must be one of: 5-7, 8-10, 11-13, 14-17'),
      
      body('context')
        .optional()
        .isArray()
        .withMessage('Context must be an array'),
      
      body('subject')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Subject must be a string with max 100 characters'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Learning path request validation
   */
  static validateLearningPathRequest() {
    return [
      body('threadId')
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Thread ID must be a string between 1 and 100 characters'),
      
      body('action')
        .isIn(['start', 'answer', 'next', 'abandon', 'quiz', 'follow-up'])
        .withMessage('Action must be one of: start, answer, next, abandon, quiz, follow-up'),
      
      body('topic')
        .if(body('action').isIn(['start', 'follow-up']))
        .isString()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Topic is required for start/follow-up actions and must be 1-200 characters'),
      
      body('ageGroup')
        .if(body('action').isIn(['start', 'answer', 'follow-up']))
        .isIn(['5-7', '8-10', '11-13', '14-17'])
        .withMessage('Age group is required for start/answer/follow-up actions'),
      
      body('studentAnswer')
        .if(body('action').equals('answer'))
        .isString()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Student answer is required for answer action and must be 1-1000 characters'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Content generation validation
   */
  static validateContentGeneration() {
    return [
      body('topic')
        .isString()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Topic must be a string between 1 and 200 characters'),
      
      body('ageGroup')
        .isIn(['5-7', '8-10', '11-13', '14-17'])
        .withMessage('Age group must be one of: 5-7, 8-10, 11-13, 14-17'),
      
      body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Difficulty must be one of: beginner, intermediate, advanced'),
      
      body('contentType')
        .optional()
        .isIn(['explanation', 'story', 'quiz', 'activity'])
        .withMessage('Content type must be one of: explanation, story, quiz, activity'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Quiz generation validation
   */
  static validateQuizGeneration() {
    return [
      body('topic')
        .isString()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Topic must be a string between 1 and 200 characters'),
      
      body('ageGroup')
        .isIn(['5-7', '8-10', '11-13', '14-17'])
        .withMessage('Age group must be one of: 5-7, 8-10, 11-13, 14-17'),
      
      body('questionCount')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Question count must be an integer between 1 and 20'),
      
      body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be one of: easy, medium, hard'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Story creation validation
   */
  static validateStoryCreation() {
    return [
      body('prompt')
        .isString()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Prompt must be a string between 1 and 500 characters'),
      
      body('ageGroup')
        .isIn(['5-7', '8-10', '11-13', '14-17'])
        .withMessage('Age group must be one of: 5-7, 8-10, 11-13, 14-17'),
      
      body('genre')
        .optional()
        .isIn(['adventure', 'fantasy', 'science', 'mystery', 'friendship'])
        .withMessage('Genre must be one of: adventure, fantasy, science, mystery, friendship'),
      
      body('length')
        .optional()
        .isIn(['short', 'medium', 'long'])
        .withMessage('Length must be one of: short, medium, long'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Topics generation validation
   */
  static validateTopicsGeneration() {
    return [
      body('subject')
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Subject must be a string between 1 and 100 characters'),
      
      body('ageGroup')
        .isIn(['5-7', '8-10', '11-13', '14-17'])
        .withMessage('Age group must be one of: 5-7, 8-10, 11-13, 14-17'),
      
      body('mode')
        .optional()
        .isIn(['explore', 'learn', 'create'])
        .withMessage('Mode must be one of: explore, learn, create'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeContent(content) {
    if (typeof content !== 'string') return content;
    
    // Remove script tags and event handlers
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  /**
   * Rate limit specific to endpoints
   */
  static createEndpointLimiter(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
      windowMs,
      max,
      message: {
        error: 'Too many requests to this endpoint',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return `${req.ip}-${req.path}`;
      }
    });
  }
}
