/**
 * Enhanced Topic Generation Agent
 * Uses the new microservices architecture with pluggable capabilities
 */

import { EnhancedBaseAgent } from '../core/EnhancedBaseAgent.js';
import OpenAI from 'openai';
import { Logger } from '../utils/Logger.js';

export class TopicGenerationAgent extends EnhancedBaseAgent {
  constructor(openaiClient, config = {}) {
    super('TopicGenerationAgent', {
      maxTokens: 1500,
      temperature: 0.7,
      model: 'gpt-4o',
      enableContentSafety: true,
      ...config
    });

    this.client = openaiClient;
    
    // Setup topic-specific capabilities
    this.setupTopicCapabilities();
    
    // Create methods for all capabilities
    this.createMethodsForAllCapabilities();
    
    Logger.info('TopicGenerationAgent enhanced initialization complete', { 
      component: this.name,
      capabilities: Array.from(this.capabilities)
    });
  }

  /**
   * Setup topic-specific capabilities
   */
  setupTopicCapabilities() {
    // Generate personalized topics
    this.addCapability('generatePersonalized', {
      promptTemplate: this.getPersonalizedTopicsPrompt.bind(this),
      responseProcessor: this.processTopicsResponse.bind(this),
      contextProcessor: this.processUserContext.bind(this)
    });

    // Enhance existing topics
    this.addCapability('enhanceTopics', {
      promptTemplate: this.getEnhanceTopicsPrompt.bind(this),
      responseProcessor: this.processEnhancedTopicsResponse.bind(this),
      contextProcessor: this.processUserContext.bind(this)
    });

    // Suggest related topics
    this.addCapability('suggestRelated', {
      promptTemplate: this.getRelatedTopicsPrompt.bind(this),
      responseProcessor: this.processTopicsResponse.bind(this),
      contextProcessor: this.processUserContext.bind(this)
    });

    // Generate topic variations
    this.addCapability('generateVariations', {
      promptTemplate: this.getVariationsPrompt.bind(this),
      responseProcessor: this.processTopicsResponse.bind(this),
      contextProcessor: this.processUserContext.bind(this)
    });

    // Analyze topic difficulty
    this.addCapability('analyzeDifficulty', {
      promptTemplate: this.getDifficultyAnalysisPrompt.bind(this),
      responseProcessor: this.processDifficultyResponse.bind(this),
      contextProcessor: this.processUserContext.bind(this)
    });
  }

  /**
   * Call OpenAI LLM
   */
  async callLLM(prompt, config) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.client.chat.completions.create({
      model: config.model || this.config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config.maxTokens || this.config.maxTokens,
      temperature: config.temperature || this.config.temperature
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Process user context for topic generation
   */
  async processUserContext(context) {
    const processed = await this.defaultContextProcessor(context);
    
    // Add topic-specific context processing
    processed.userPreferences = context.userPreferences || {};
    processed.userHistory = context.userHistory || [];
    processed.currentSession = context.currentSession || {};
    processed.learningStyle = context.userPreferences?.learningStyle || 'mixed';
    processed.interests = context.userPreferences?.interests || [];
    processed.favoriteSubjects = context.userPreferences?.favoriteSubjects || [];
    processed.difficulty = context.userPreferences?.difficulty || 'normal';
    
    // Analyze learning patterns
    if (processed.userHistory.length > 0) {
      processed.recentTopics = this.extractRecentTopics(processed.userHistory);
      processed.strongAreas = this.identifyStrongAreas(processed.userHistory);
      processed.growthAreas = this.identifyGrowthAreas(processed.userHistory);
    }
    
    return processed;
  }

  /**
   * Extract recent topics from user history
   */
  extractRecentTopics(history) {
    return history
      .slice(-10) // Last 10 activities
      .map(activity => activity.topic || activity.subject)
      .filter(Boolean);
  }

  /**
   * Identify strong areas from user history
   */
  identifyStrongAreas(history) {
    const subjectPerformance = {};
    
    history.forEach(activity => {
      if (activity.subject && activity.performance) {
        if (!subjectPerformance[activity.subject]) {
          subjectPerformance[activity.subject] = [];
        }
        subjectPerformance[activity.subject].push(activity.performance);
      }
    });

    const strongAreas = [];
    for (const [subject, performances] of Object.entries(subjectPerformance)) {
      const avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
      if (avgPerformance > 0.7) { // 70% threshold
        strongAreas.push(subject);
      }
    }

    return strongAreas;
  }

  /**
   * Identify growth areas from user history
   */
  identifyGrowthAreas(history) {
    const subjectPerformance = {};
    
    history.forEach(activity => {
      if (activity.subject && activity.performance) {
        if (!subjectPerformance[activity.subject]) {
          subjectPerformance[activity.subject] = [];
        }
        subjectPerformance[activity.subject].push(activity.performance);
      }
    });

    const growthAreas = [];
    for (const [subject, performances] of Object.entries(subjectPerformance)) {
      const avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
      if (avgPerformance < 0.5) { // 50% threshold
        growthAreas.push(subject);
      }
    }

    return growthAreas;
  }

  /**
   * Personalized topics prompt
   */
  getPersonalizedTopicsPrompt(input, context) {
    const { subject, ageGroup, mode, count = 6 } = input;
    
    return `You are an educational content specialist creating personalized learning topics.

STUDENT CONTEXT:
- Age Group: ${ageGroup}
- Learning Level: ${context.complexity}
- Subject: ${subject}
- Learning Mode: ${mode}
- Learning Style: ${context.learningStyle}
- Interests: ${context.interests.join(', ') || 'None specified'}
- Favorite Subjects: ${context.favoriteSubjects.join(', ') || 'None specified'}
- Difficulty Preference: ${context.difficulty}
- Recent Topics: ${context.recentTopics?.join(', ') || 'None'}
- Strong Areas: ${context.strongAreas?.join(', ') || 'None identified'}
- Growth Areas: ${context.growthAreas?.join(', ') || 'None identified'}

SESSION CONTEXT:
- Time of Day: ${context.currentSession?.timeOfDay || 'Unknown'}
- Session Length: ${context.currentSession?.sessionLength || 'Medium'}
- Current Mood: ${context.currentSession?.mood || 'Neutral'}

TASK:
Generate ${count} personalized ${subject} learning topics for ${mode} mode that:
1. Match the student's age and complexity level
2. Align with their learning style and interests
3. Avoid repeating recent topics
4. Build on strong areas while addressing growth areas
5. Are engaging for the current session context

RESPONSE FORMAT:
Return a JSON array of topics, each with:
{
  "title": "Topic title",
  "description": "Brief engaging description",
  "difficulty": "easy|medium|hard",
  "estimatedTime": "5-10 minutes",
  "personalizedReason": "Why this topic suits the student",
  "adaptations": ["How it's adapted for their learning style"],
  "prerequisites": ["Required knowledge"],
  "objectives": ["Learning objectives"],
  "tags": ["relevant", "tags"]
}

Generate topics now:`;
  }

  /**
   * Enhance topics prompt
   */
  getEnhanceTopicsPrompt(input, context) {
    const { topics } = input;
    
    return `You are an educational content specialist enhancing existing topics with personalization.

STUDENT CONTEXT:
- Age Group: ${context.ageGroup}
- Learning Style: ${context.learningStyle}
- Interests: ${context.interests.join(', ') || 'General'}
- Difficulty Preference: ${context.difficulty}
- Strong Areas: ${context.strongAreas?.join(', ') || 'None identified'}

EXISTING TOPICS:
${JSON.stringify(topics, null, 2)}

TASK:
Enhance each topic by adding personalization based on the student context:
1. Add "personalizedReason" explaining why this topic suits the student
2. Add "adaptations" array showing how it's adapted for their learning style
3. Adjust difficulty if needed based on their preference
4. Add connections to their interests where possible
5. Suggest modifications for their strong/weak areas

RESPONSE FORMAT:
Return a JSON array of enhanced topics with the same structure plus personalization fields.

Enhance topics now:`;
  }

  /**
   * Related topics prompt
   */
  getRelatedTopicsPrompt(input, context) {
    const { currentTopic, count = 4 } = input;
    
    return `You are an educational content specialist suggesting related topics.

CURRENT TOPIC: "${currentTopic}"

STUDENT CONTEXT:
- Age Group: ${context.ageGroup}
- Subject: ${context.subject}
- Learning Style: ${context.learningStyle}
- Interests: ${context.interests.join(', ') || 'General'}

TASK:
Suggest ${count} related topics that:
1. Naturally follow from or connect to the current topic
2. Match the student's age and complexity level
3. Align with their interests where possible
4. Provide logical learning progression

RESPONSE FORMAT:
Return a JSON array of related topics with full topic structure.

Suggest related topics now:`;
  }

  /**
   * Variations prompt
   */
  getVariationsPrompt(input, context) {
    const { baseTopic, count = 3 } = input;
    
    return `You are an educational content specialist creating topic variations.

BASE TOPIC: "${baseTopic}"

STUDENT CONTEXT:
- Age Group: ${context.ageGroup}
- Learning Style: ${context.learningStyle}
- Difficulty Preference: ${context.difficulty}

TASK:
Create ${count} variations of the base topic that:
1. Approach the same concept from different angles
2. Match different learning styles (visual, auditory, kinesthetic)
3. Offer different difficulty levels
4. Provide variety while maintaining educational value

RESPONSE FORMAT:
Return a JSON array of topic variations with full structure.

Create variations now:`;
  }

  /**
   * Difficulty analysis prompt
   */
  getDifficultyAnalysisPrompt(input, context) {
    const { topics } = input;
    
    return `You are an educational assessment specialist analyzing topic difficulty.

TOPICS TO ANALYZE:
${JSON.stringify(topics, null, 2)}

STUDENT CONTEXT:
- Age Group: ${context.ageGroup}
- Current Level: ${context.complexity}
- Strong Areas: ${context.strongAreas?.join(', ') || 'None identified'}
- Growth Areas: ${context.growthAreas?.join(', ') || 'None identified'}

TASK:
Analyze each topic's difficulty and appropriateness:
1. Rate difficulty on scale 1-10 for this age group
2. Identify prerequisites and potential challenges
3. Suggest difficulty adjustments if needed
4. Provide scaffolding recommendations

RESPONSE FORMAT:
Return a JSON object with analysis for each topic.

Analyze difficulty now:`;
  }

  /**
   * Process topics response
   */
  async processTopicsResponse(rawResponse, input, context) {
    try {
      // Clean and parse JSON response
      let cleanResponse = rawResponse.trim();
      
      // Remove any markdown formatting
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON array in response
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const topics = JSON.parse(cleanResponse);
      
      if (!Array.isArray(topics)) {
        throw new Error('Response is not an array');
      }

      // Validate and enhance each topic
      const processedTopics = topics.map((topic, index) => ({
        id: `topic_${Date.now()}_${index}`,
        title: topic.title || `Topic ${index + 1}`,
        description: topic.description || '',
        difficulty: topic.difficulty || 'medium',
        estimatedTime: topic.estimatedTime || '10-15 minutes',
        personalizedReason: topic.personalizedReason || '',
        adaptations: Array.isArray(topic.adaptations) ? topic.adaptations : [],
        prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
        objectives: Array.isArray(topic.objectives) ? topic.objectives : [],
        tags: Array.isArray(topic.tags) ? topic.tags : [],
        subject: input.subject || context.subject || 'general',
        ageGroup: context.ageGroup,
        mode: input.mode || context.mode || 'explore',
        generatedAt: new Date().toISOString(),
        agent: this.name
      }));

      return {
        topics: processedTopics,
        count: processedTopics.length,
        context: {
          ageGroup: context.ageGroup,
          subject: input.subject,
          mode: input.mode,
          personalized: true
        },
        metadata: {
          generated: true,
          personalized: true,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      Logger.error('Failed to process topics response', {
        error: error.message,
        rawResponse: rawResponse.substring(0, 500),
        component: this.name
      });

      // Return fallback response
      return {
        topics: [],
        count: 0,
        error: 'Failed to generate topics',
        fallback: true
      };
    }
  }

  /**
   * Process enhanced topics response
   */
  async processEnhancedTopicsResponse(rawResponse, input, context) {
    try {
      const result = await this.processTopicsResponse(rawResponse, input, context);
      
      return {
        ...result,
        enhanced: true,
        originalCount: input.topics?.length || 0
      };

    } catch (error) {
      Logger.error('Failed to process enhanced topics response', {
        error: error.message,
        component: this.name
      });

      // Return original topics if enhancement fails
      return {
        topics: input.topics || [],
        count: input.topics?.length || 0,
        enhanced: false,
        error: 'Enhancement failed, returning original topics'
      };
    }
  }

  /**
   * Process difficulty response
   */
  async processDifficultyResponse(rawResponse, input, context) {
    try {
      let cleanResponse = rawResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const analysis = JSON.parse(cleanResponse);

      return {
        analysis,
        topicsAnalyzed: Object.keys(analysis).length,
        context: {
          ageGroup: context.ageGroup,
          complexity: context.complexity
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      Logger.error('Failed to process difficulty response', {
        error: error.message,
        component: this.name
      });

      return {
        analysis: {},
        error: 'Failed to analyze difficulty',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Backward compatibility methods
   */
  async generateTopics(params) {
    return await this.generatePersonalized(params);
  }

  async enhanceStaticTopics(topics, userContext) {
    return await this.enhanceTopics({ topics }, userContext);
  }

  async suggestContextualTopics(currentTopic, userContext) {
    return await this.suggestRelated({ currentTopic }, userContext);
  }

  /**
   * Bulk processing capability
   */
  async processBulk(data) {
    const { items, context } = data;
    const results = [];

    for (const item of items) {
      try {
        const result = await this.generatePersonalized(item, context);
        results.push({
          success: true,
          data: result,
          item
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          item
        });
      }
    }

    return results;
  }

  /**
   * Get agent health with topic-specific metrics
   */
  getHealth() {
    const baseHealth = super.getHealth();
    
    return {
      ...baseHealth,
      specialization: 'topic-generation',
      features: {
        personalization: true,
        enhancement: true,
        relatedSuggestions: true,
        difficultyAnalysis: true,
        bulkProcessing: true
      }
    };
  }
}

export default TopicGenerationAgent;
