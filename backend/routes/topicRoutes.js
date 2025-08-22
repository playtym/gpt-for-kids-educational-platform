/**
 * Topic Generation API Routes
 * Handles dynamic topic generation using LLM agents
 */

import express from 'express';
import { TopicGenerationAgent } from '../agents/TopicGenerationAgent.js';
import { Logger } from '../utils/Logger.js';

const router = express.Router();

// Initialize the topic generation agent (will be passed from main server)
let topicAgent;

export function initializeTopicRoutes(openaiClient) {
  topicAgent = new TopicGenerationAgent(openaiClient);
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

    // Generate topics for each requested mode
    const generatedTopics = {};
    
    for (const mode of modes) {
      try {
        const result = await topicAgent.generateTopics({
          subject,
          ageGroup,
          mode,
          userHistory,
          userPreferences,
          currentContext: currentSession,
          requestedCount: topicsPerMode
        });

        if (result.success) {
          generatedTopics[mode] = result.topics;
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

    // Generate contextual suggestions
    const suggestions = await topicAgent.generateTopics({
      subject,
      ageGroup,
      mode: 'explore', // Use explore mode for suggestions
      userHistory: userContext?.history || [],
      userPreferences: userContext?.preferences || {},
      currentContext: {
        ...userContext?.currentSession,
        currentTopic,
        requestType: 'suggestions'
      },
      requestedCount: count
    });

    res.json({
      success: true,
      suggestions: suggestions.success ? suggestions.topics : [],
      metadata: {
        basedOn: currentTopic,
        subject,
        ageGroup,
        count: suggestions.success ? suggestions.topics.length : 0
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
 * Generate enhancement for a specific topic
 */
async function generateTopicEnhancement(topic, subject, ageGroup, userContext) {
  try {
    // Build a focused prompt for topic enhancement
    const prompt = `Enhance this educational topic for a ${ageGroup} year old learning ${subject}:

CURRENT TOPIC:
Title: ${topic.title}
Description: ${topic.description}
Category: ${topic.category}

USER CONTEXT:
${userContext?.preferences ? `Preferences: ${JSON.stringify(userContext.preferences)}` : ''}
${userContext?.history ? `Recent topics: ${userContext.history.slice(-3).map(h => h.topic || h.message).join(', ')}` : ''}

Provide enhancements in this JSON format:
{
  "personalizedDescription": "A description tailored to this user's interests",
  "adaptiveHints": ["hint1", "hint2"],
  "nextSteps": ["step1", "step2"],
  "personalizedAspects": ["why this matches the user"]
}

Keep it brief and relevant.`;

    // This would call the LLM - for now return basic enhancement
    return {
      personalizedDescription: `Personalized: ${topic.description}`,
      adaptiveHints: [`Try connecting this to your interests in ${userContext?.preferences?.interests?.[0] || 'learning'}`],
      nextSteps: [`Explore more about ${topic.category}`, "Share what you discovered"],
      personalizedAspects: [`Matches your learning style`]
    };

  } catch (error) {
    Logger.error('Topic enhancement generation failed', { error: error.message });
    return {};
  }
}

export default router;
