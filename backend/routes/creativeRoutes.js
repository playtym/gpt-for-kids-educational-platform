/**
 * Creative Routes - New Creative Content Agent with redesigned functionality
 * Two main themes:
 * 1. Provide feedback and constructive next steps
 * 2. Step-by-step creation guidance
 */

import express from 'express';
import { CreativeContentAgent } from '../agents/CreativeContentAgent.js';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { ErrorHandler } from '../middleware/ErrorHandler.js';

const router = express.Router();

// Initialize Creative Content Agent (will be properly injected in main server)
let creativeAgent = null;

// Middleware to ensure agent is available
const ensureAgent = (req, res, next) => {
  if (!creativeAgent) {
    return res.status(503).json({
      error: 'Creative Content Agent not available',
      fallback: true
    });
  }
  next();
};

// Simple validation middleware for creative routes
const validateCreativeFeedback = () => {
  return (req, res, next) => {
    const { userInput, ageGroup } = req.body;
    
    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ error: 'userInput is required and must be a string' });
    }
    
    if (!ageGroup || typeof ageGroup !== 'number') {
      return res.status(400).json({ error: 'ageGroup is required and must be a number' });
    }
    
    next();
  };
};

const validateCreativeGuide = () => {
  return (req, res, next) => {
    const { medium, ageGroup } = req.body;
    
    if (!medium || typeof medium !== 'string') {
      return res.status(400).json({ error: 'medium is required and must be a string' });
    }
    
    if (!ageGroup || typeof ageGroup !== 'number') {
      return res.status(400).json({ error: 'ageGroup is required and must be a number' });
    }
    
    next();
  };
};

/**
 * THEME 1: Provide feedback on existing creative work
 * POST /api/creative/feedback
 */
router.post('/feedback', validateCreativeFeedback(), ensureAgent, async (req, res) => {
  try {
    const { userInput, ageGroup, medium } = req.body;

    const feedback = await creativeAgent.provideFeedback(userInput, ageGroup, medium);

    res.json({
      success: true,
      feedback,
      type: 'creative-feedback',
      metadata: {
        ageGroup,
        detectedMedium: medium || 'auto-detected',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    ErrorHandler.handleAgentError(error, res, 'CreativeContentAgent.provideFeedback');
  }
});

/**
 * THEME 2: Step-by-step creation guidance
 * POST /api/creative/guide
 */
router.post('/guide', validateCreativeGuide(), ensureAgent, async (req, res) => {
  try {
    const { medium, step = 1, ageGroup, previousSteps = [] } = req.body;

    const guidance = await creativeAgent.guideCreation(medium, step, ageGroup, previousSteps);

    res.json({
      success: true,
      guidance,
      type: 'creation-guidance',
      metadata: {
        medium,
        step,
        ageGroup,
        previousStepsCount: previousSteps.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    ErrorHandler.handleAgentError(error, res, 'CreativeContentAgent.guideCreation');
  }
});

/**
 * Get available creative mediums
 * GET /api/creative/mediums
 */
router.get('/mediums', (req, res) => {
  try {
    if (!creativeAgent) {
      return res.json({
        success: true,
        mediums: [
          { id: 'short-stories', name: 'Short Stories', steps: 5 },
          { id: 'poetry', name: 'Poetry', steps: 5 },
          { id: 'digital-art', name: 'Digital Art', steps: 5 }
        ],
        fallback: true
      });
    }

    const mediums = creativeAgent.getAvailableMediums();

    res.json({
      success: true,
      mediums,
      type: 'available-mediums'
    });

  } catch (error) {
    ErrorHandler.handleAgentError(error, res, 'CreativeContentAgent.getAvailableMediums');
  }
});

/**
 * Get specific medium information
 * GET /api/creative/mediums/:medium
 */
router.get('/mediums/:medium', (req, res) => {
  try {
    const { medium } = req.params;

    if (!creativeAgent) {
      return res.json({
        success: true,
        medium: { id: medium, name: medium, criteria: {} },
        fallback: true
      });
    }

    const mediumInfo = creativeAgent.getMediumInfo(medium);

    if (!mediumInfo) {
      return res.status(404).json({
        error: `Medium '${medium}' not found`,
        availableMedias: creativeAgent.getAvailableMediums().map(m => m.id)
      });
    }

    res.json({
      success: true,
      medium: {
        id: medium,
        ...mediumInfo
      },
      type: 'medium-info'
    });

  } catch (error) {
    ErrorHandler.handleAgentError(error, res, 'CreativeContentAgent.getMediumInfo');
  }
});

/**
 * Legacy support for old API endpoints
 */

// Legacy story generation (now redirects to feedback)
router.post('/story', ensureAgent, async (req, res) => {
  try {
    const { topic, ageGroup, duration = 'short' } = req.body;
    
    if (!topic || !ageGroup) {
      return res.status(400).json({ error: 'topic and ageGroup are required' });
    }
    
    const response = await creativeAgent.generateStory(topic, ageGroup, duration);

    res.json({
      success: true,
      story: response,
      type: 'legacy-story-feedback',
      note: 'This endpoint now provides creative feedback instead of generating complete stories'
    });

  } catch (error) {
    ErrorHandler.handleAgentError(error, res, 'CreativeContentAgent.generateStory');
  }
});

// Legacy writing prompt (now redirects to creation guidance)
router.post('/writing-prompt', ensureAgent, async (req, res) => {
  try {
    const { theme, ageGroup, type = 'story' } = req.body;
    
    if (!theme || !ageGroup) {
      return res.status(400).json({ error: 'theme and ageGroup are required' });
    }
    
    const response = await creativeAgent.generateWritingPrompt(theme, ageGroup, type);

    res.json({
      success: true,
      prompt: response,
      type: 'legacy-prompt-guidance',
      note: 'This endpoint now provides step-by-step creation guidance'
    });

  } catch (error) {
    ErrorHandler.handleAgentError(error, res, 'CreativeContentAgent.generateWritingPrompt');
  }
});

// Initialize agent (called from main server)
export const initializeCreativeAgent = (anthropicClient) => {
  creativeAgent = new CreativeContentAgent(anthropicClient);
  console.log('✨ Creative Content Agent initialized with new design');
  return creativeAgent;
};

export default router;
