/**
 * Base Agent Class
 * Provides common functionality for all educational agents
 */

import { ContentSafetyManager } from '../services/ContentSafetyManager.js';
import { Logger } from '../utils/Logger.js';

export class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      maxTokens: 1000,
      temperature: 0.7,
      ...config
    };
  }

  /**
   * Validate input parameters common to all agents
   */
  validateInput(requiredFields, input) {
    const missing = requiredFields.filter(field => !input[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Apply safety checking to generated content
   */
  async applySafetyCheck(content, ageGroup, context = {}) {
    try {
      const safetyResult = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
      
      if (!safetyResult.safe) {
        Logger.warn(`${this.name} content flagged as unsafe`, {
          agent: this.name,
          ageGroup,
          reason: safetyResult.reason,
          context
        });
        return this.getFallbackResponse(context);
      }
      
      return content;
    } catch (error) {
      Logger.error(`Safety check failed for ${this.name}`, { error: error.message, context });
      return this.getFallbackResponse(context);
    }
  }

  /**
   * Get age-appropriate configuration with detailed differentiation
   */
  getAgeConfig(ageGroup) {
    const ageGroups = {
      '5-7': { 
        grade: 'kindergarten-1st', 
        vocabulary: 'simple', 
        complexity: 'basic',
        sentenceLength: 'short (5-8 words)',
        conceptDepth: 'concrete, tangible',
        questionStyle: 'what/where/who',
        explanationStyle: 'story-based with animals/characters',
        attention: 'very short bursts',
        examples: 'familiar everyday items',
        cognitiveLevel: 'concrete operational beginning'
      },
      '8-10': { 
        grade: '2nd-4th', 
        vocabulary: 'elementary', 
        complexity: 'intermediate',
        sentenceLength: 'medium (8-12 words)',
        conceptDepth: 'beginning abstract with concrete anchors',
        questionStyle: 'how/why basic',
        explanationStyle: 'adventure-based with clear steps',
        attention: 'short segments with interaction',
        examples: 'school and home experiences',
        cognitiveLevel: 'concrete operational'
      },
      '11-13': { 
        grade: '5th-7th', 
        vocabulary: 'middle', 
        complexity: 'advanced',
        sentenceLength: 'longer (12-16 words)',
        conceptDepth: 'abstract thinking with logical connections',
        questionStyle: 'analytical why/how',
        explanationStyle: 'problem-solving with multiple perspectives',
        attention: 'sustained focus with variety',
        examples: 'peer relationships and broader world',
        cognitiveLevel: 'formal operational beginning'
      },
      '14-17': { 
        grade: '8th-12th', 
        vocabulary: 'high-school', 
        complexity: 'complex',
        sentenceLength: 'complex (16+ words)',
        conceptDepth: 'abstract, theoretical, meta-cognitive',
        questionStyle: 'philosophical, evaluative',
        explanationStyle: 'analytical with nuanced reasoning',
        attention: 'extended engagement',
        examples: 'real-world applications and future planning',
        cognitiveLevel: 'formal operational'
      }
    };
    return ageGroups[ageGroup] || ageGroups['8-10'];
  }

  /**
   * Build context-aware prompt
   */
  buildContextPrompt(message, context = [], maxContextLength = 5) {
    if (!context || context.length === 0) return message;
    
    const recentContext = context.slice(-maxContextLength);
    const contextString = recentContext
      .map(ctx => `${ctx.type === 'user' ? 'Student' : 'Teacher'}: ${ctx.content}`)
      .join('\n');
    
    return `${message}\n\nPrevious conversation context:\n${contextString}\n\nContinue this conversation naturally, being aware of what we've already discussed.`;
  }

  /**
   * Build age-specific content guidelines
   */
  buildAgeSpecificGuidelines(ageConfig, contentType = 'general') {
    const guidelines = {
      '5-7': {
        language: `
          - Use ${ageConfig.sentenceLength} sentences
          - Choose simple, familiar words
          - Use repetition for emphasis
          - Include sensory descriptions (colors, sounds, textures)
          - Use "you can" instead of "you should"
        `,
        structure: `
          - Start with something exciting or familiar
          - Use lots of emojis and visual breaks
          - Keep each point very short
          - End with a simple, fun question
        `,
        cognitive: `
          - Focus on ${ageConfig.conceptDepth} concepts
          - Use concrete examples from their daily life
          - Tell mini-stories with characters they know
          - Ask ${ageConfig.questionStyle} questions only
        `
      },
      '8-10': {
        language: `
          - Use ${ageConfig.sentenceLength} sentences
          - Introduce some new vocabulary with explanations
          - Use cause-and-effect language
          - Include comparisons to things they know
        `,
        structure: `
          - Start with an interesting hook
          - Break into 2-3 clear sections
          - Use numbered steps when helpful
          - Include one hands-on activity suggestion
        `,
        cognitive: `
          - Mix ${ageConfig.conceptDepth} ideas
          - Connect to ${ageConfig.examples}
          - Ask ${ageConfig.questionStyle} questions
          - Encourage step-by-step thinking
        `
      },
      '11-13': {
        language: `
          - Use ${ageConfig.sentenceLength} sentences
          - Introduce subject-specific terminology
          - Use transitional phrases between ideas
          - Include analogies to complex concepts
        `,
        structure: `
          - Present multiple perspectives
          - Include cause-and-effect relationships
          - Connect to broader concepts
          - Suggest independent research
        `,
        cognitive: `
          - Develop ${ageConfig.conceptDepth}
          - Relate to ${ageConfig.examples}
          - Ask ${ageConfig.questionStyle} questions
          - Encourage critical thinking and debate
        `
      },
      '14-17': {
        language: `
          - Use ${ageConfig.sentenceLength} sentences with complex ideas
          - Include academic and professional terminology
          - Use sophisticated rhetorical structures
          - Present nuanced arguments
        `,
        structure: `
          - Present theoretical frameworks
          - Include multiple competing theories
          - Connect to real-world applications
          - Suggest research projects and analysis
        `,
        cognitive: `
          - Explore ${ageConfig.conceptDepth}
          - Connect to ${ageConfig.examples}
          - Ask ${ageConfig.questionStyle} questions
          - Encourage meta-cognitive reflection
        `
      }
    };

    const ageKey = ageConfig.grade.includes('kindergarten') ? '5-7' : 
                   ageConfig.grade.includes('2nd') ? '8-10' :
                   ageConfig.grade.includes('5th') ? '11-13' : '14-17';
    
    return guidelines[ageKey] || guidelines['8-10'];
  }

  /**
   * Default fallback response - should be overridden by subclasses
   */
  getFallbackResponse(context = {}) {
    return "I'd love to help you explore that topic! Let's think about it together.";
  }

  /**
   * Log agent activity
   */
  logActivity(action, data = {}) {
    Logger.info(`${this.name} - ${action}`, {
      agent: this.name,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Handle errors consistently
   */
  handleError(error, context = {}) {
    Logger.error(`${this.name} error`, {
      agent: this.name,
      error: error.message,
      stack: error.stack,
      context
    });
    throw new Error(`${this.name} failed: ${error.message}`);
  }
}
