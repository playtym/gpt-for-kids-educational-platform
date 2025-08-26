/**
 * Topic Generation API Routes
 * Handles dynamic topic generation using existing agent infrastructure
 */

import express from 'express';
import { Logger } from '../utils/Logger.js';

const router = express.Router();

// Agent manager will be passed from main server
let agentManager;

export function initializeTopicRoutes(agentManagerInstance) {
  agentManager = agentManagerInstance;
  return router;
}

/**
 * Generate personalized topics based on user context
 * POST /api/topics/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      subject,
      ageGroup,
      userContext,
      modes = ['explore', 'learn', 'create', 'study'],
      topicsPerMode = 4
    } = req.body;

    // Validate required fields
    if (!subject || !ageGroup) {
      return res.status(400).json({
        success: false,
        error: 'Subject and ageGroup are required'
      });
    }

    // Extract user context for LLM generation
    const userHistory = userContext?.history || [];
    const userPreferences = userContext?.preferences || {};
    const currentSession = userContext?.currentSession || {};

    // Generate topics for each requested mode using the exploration agent
    const generatedTopics = {};
    
    for (const mode of modes) {
      try {
        // Use the exploration agent for topic generation
        const result = await agentManager.handleChatRequest({
          message: `Generate ${topicsPerMode} topic suggestions for ${subject}`,
          mode: 'explore',
          ageGroup,
          context: userHistory.slice(-3) // Use last 3 interactions as context
        });

        if (result.success && result.response) {
          // Extract topics from the response
          generatedTopics[mode] = extractTopicsFromResponse(result.response, topicsPerMode);
        } else {
          Logger.warn(`Failed to generate topics for mode ${mode}`, { error: result.error });
          generatedTopics[mode] = [];
        }
      } catch (error) {
        Logger.error(`Error generating topics for mode ${mode}`, { error: error.message });
        generatedTopics[mode] = [];
      }
    }

    res.json({
      success: true,
      topics: generatedTopics,
      metadata: {
        subject,
        ageGroup,
        modesGenerated: modes,
        totalTopics: Object.values(generatedTopics).reduce((sum, topics) => sum + topics.length, 0),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    Logger.error('Topic generation API error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate topics',
      details: error.message
    });
  }
});

/**
 * Enhance static topics with personalized suggestions
 * POST /api/topics/enhance
 */
router.post('/enhance', async (req, res) => {
  try {
    const {
      subject,
      ageGroup,
      staticTopics,
      userContext
    } = req.body;

    if (!subject || !ageGroup || !staticTopics) {
      return res.status(400).json({
        success: false,
        error: 'Subject, ageGroup, and staticTopics are required'
      });
    }

    // Generate enhancement suggestions for each topic
    const enhancements = {};
    
    for (const [mode, topics] of Object.entries(staticTopics)) {
      enhancements[mode] = [];
      
      for (const topic of topics) {
        try {
          // Generate personalized enhancements for this topic
          const enhancement = await generateTopicEnhancement(
            topic,
            subject,
            ageGroup,
            userContext
          );
          enhancements[mode].push(enhancement);
        } catch (error) {
          Logger.warn(`Failed to enhance topic ${topic.id}`, { error: error.message });
          enhancements[mode].push({}); // Empty enhancement
        }
      }
    }

    res.json({
      success: true,
      enhancements,
      metadata: {
        subject,
        ageGroup,
        enhancedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    Logger.error('Topic enhancement API error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to enhance topics',
      details: error.message
    });
  }
});

/**
 * Get topic suggestions based on current learning context
 * POST /api/topics/suggest
 */
router.post('/suggest', async (req, res) => {
  try {
    const {
      currentTopic,
      subject,
      ageGroup,
      userContext,
      count = 3
    } = req.body;

    if (!currentTopic || !subject || !ageGroup) {
      return res.status(400).json({
        success: false,
        error: 'currentTopic, subject, and ageGroup are required'
      });
    }

    // Generate contextual suggestions using exploration agent
    const suggestions = await agentManager.handleChatRequest({
      message: `Suggest ${count} follow-up topics related to: ${currentTopic}`,
      mode: 'explore',
      ageGroup,
      context: userContext?.history?.slice(-2) || [] // Use recent history as context
    });

    const extractedSuggestions = suggestions.success ? 
      extractTopicsFromResponse(suggestions.response, count) : [];

    res.json({
      success: true,
      suggestions: extractedSuggestions,
      metadata: {
        basedOn: currentTopic,
        subject,
        ageGroup,
        count: extractedSuggestions.length
      }
    });

  } catch (error) {
    Logger.error('Topic suggestion API error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      details: error.message
    });
  }
});

/**
 * Extract topic suggestions from agent response
 */
function extractTopicsFromResponse(response, requestedCount) {
  try {
    // If the response has structured topics, use them
    if (response.topics && Array.isArray(response.topics)) {
      return response.topics.slice(0, requestedCount);
    }

    // If response has suggestions, use them
    if (response.suggestions && Array.isArray(response.suggestions)) {
      return response.suggestions.slice(0, requestedCount).map((suggestion, index) => ({
        id: `topic_${Date.now()}_${index}`,
        title: suggestion.title || suggestion,
        description: suggestion.description || `Explore ${suggestion.title || suggestion}`,
        category: 'generated'
      }));
    }

    // Try to extract topics from text response
    if (typeof response === 'string') {
      const lines = response.split('\n').filter(line => line.trim());
      return lines.slice(0, requestedCount).map((line, index) => ({
        id: `topic_${Date.now()}_${index}`,
        title: line.replace(/^\d+\.?\s*/, '').trim(),
        description: `Learn about ${line.replace(/^\d+\.?\s*/, '').trim()}`,
        category: 'generated'
      }));
    }

    return [];
  } catch (error) {
    Logger.error('Error extracting topics from response', { error: error.message });
    return [];
  }
}

/**
 * Generate enhancement for a specific topic
 */
async function generateTopicEnhancement(topic, subject, ageGroup, userContext) {
  try {
    if (!agentManager) {
      Logger.warn('Agent manager not available for topic enhancement');
      return {};
    }

    // Use the exploration agent to enhance the topic
    const enhancement = await agentManager.handleChatRequest({
      message: `Enhance this topic for learning: ${topic.title} - ${topic.description}`,
      mode: 'explore',
      ageGroup,
      context: userContext?.history?.slice(-1) || []
    });

    if (enhancement.success && enhancement.response) {
      return {
        personalizedDescription: `Enhanced: ${topic.description}`,
        adaptiveHints: enhancement.response.suggestions || [`Try exploring ${topic.title} further`],
        nextSteps: enhancement.response.followUpQuestions || [`Learn more about ${topic.category}`, "Share what you discovered"],
        personalizedAspects: [`Matches your learning level for ${ageGroup}`]
      };
    }

    return {};
  } catch (error) {
    Logger.error('Topic enhancement generation failed', { error: error.message });
    return {};
  }
}

export default router;
