/**
 * Quiz Service Routes
 * Express routes for Quiz Generation functionality
 */

import express from 'express';
import { Logger } from '../utils/Logger.js';

export function createQuizRoutes(agentManager) {
  const router = express.Router();

  // Generate Quiz endpoint
  router.post('/generate', async (req, res) => {
    try {
      const { 
        topic, 
        ageGroup, 
        context = [], 
        questionCount = 5, 
        quizType = 'mcq',
        searchEnabled = true,
        includeSources = true,
        difficulty = 'auto'
      } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          error: 'Missing required field: topic'
        });
      }

      const contextString = Array.isArray(context) ? 
        context.map(c => c.content || c.message || '').join(' ') : '';

      const quiz = await agentManager.agents.quiz.generateContextualQuiz(
        topic,
        contextString,
        { grade: agentManager.mapAgeGroupToGrade(ageGroup) },
        {
          questionCount,
          quizType,
          searchEnabled,
          includeSources,
          difficulty
        }
      );

      Logger.info('Quiz generated successfully', { 
        topic, 
        ageGroup, 
        questionCount: quiz.questions?.length || 0,
        searchResultsUsed: quiz.sources?.length || 0
      });

      res.json({
        success: true,
        quiz,
        topic,
        ageGroup,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error('Quiz generation failed', { error: error.message });
      res.status(500).json({
        error: 'Failed to generate quiz',
        message: error.message
      });
    }
  });

  // Quick Quiz endpoint (for faster responses without search)
  router.post('/quick', async (req, res) => {
    try {
      const { topic, ageGroup, questionCount = 3 } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          error: 'Missing required field: topic'
        });
      }

      const quiz = await agentManager.agents.quiz.generateQuickQuiz(
        topic,
        { grade: agentManager.mapAgeGroupToGrade(ageGroup) },
        questionCount
      );

      Logger.info('Quick quiz generated successfully', { 
        topic, 
        ageGroup, 
        questionCount: quiz.questions?.length || 0 
      });

      res.json({
        success: true,
        quiz,
        topic,
        ageGroup,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error('Quick quiz generation failed', { error: error.message });
      res.status(500).json({
        error: 'Failed to generate quick quiz',
        message: error.message
      });
    }
  });

  // Comprehensive Quiz endpoint (with full search and mixed question types)
  router.post('/comprehensive', async (req, res) => {
    try {
      const { topic, ageGroup, context = [], questionCount = 10 } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          error: 'Missing required field: topic'
        });
      }

      const contextString = Array.isArray(context) ? 
        context.map(c => c.content || c.message || '').join(' ') : '';

      const quiz = await agentManager.agents.quiz.generateComprehensiveQuiz(
        topic,
        contextString,
        { grade: agentManager.mapAgeGroupToGrade(ageGroup) },
        questionCount
      );

      Logger.info('Comprehensive quiz generated successfully', { 
        topic, 
        ageGroup, 
        questionCount: quiz.questions?.length || 0,
        searchResultsUsed: quiz.sources?.length || 0
      });

      res.json({
        success: true,
        quiz,
        topic,
        ageGroup,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error('Comprehensive quiz generation failed', { error: error.message });
      res.status(500).json({
        error: 'Failed to generate comprehensive quiz',
        message: error.message
      });
    }
  });

  return router;
}
