/**
 * Topic Generation Agent
 * Dynamically generates educational topics based on user history, preferences, and context
 */

import { BaseAgent } from './BaseAgent.js';
import { Logger } from '../utils/Logger.js';

export class TopicGenerationAgent extends BaseAgent {
  constructor(openaiClient, config = {}) {
    super('TopicGeneration', {
      maxTokens: 2000,
      temperature: 0.8,
      ...config
    });
    this.client = openaiClient;
  }

  /**
   * Generate personalized topics based on user context
   */
  async generateTopics({
    subject,
    ageGroup,
    mode,
    userHistory = [],
    userPreferences = {},
    currentContext = {},
    requestedCount = 6
  }) {
    try {
      this.validateInput(['subject', 'ageGroup', 'mode'], { subject, ageGroup, mode });

      const prompt = this.buildTopicGenerationPrompt({
        subject,
        ageGroup,
        mode,
        userHistory,
        userPreferences,
        currentContext,
        requestedCount
      });

      const response = await this.callLLM(prompt);
      const topics = await this.parseTopicResponse(response);
      
      // Apply safety check to all generated topics
      const safeTopics = await Promise.all(
        topics.map(topic => this.applySafetyCheck(topic, ageGroup))
      );

      return {
        success: true,
        topics: safeTopics.filter(topic => topic !== null),
        context: {
          subject,
          ageGroup,
          mode,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      Logger.error('Topic generation failed', { 
        error: error.message, 
        subject, 
        ageGroup, 
        mode 
      });
      
      return {
        success: false,
        error: error.message,
        topics: await this.getFallbackTopics(subject, ageGroup, mode)
      };
    }
  }

  /**
   * Build comprehensive prompt for topic generation
   */
  buildTopicGenerationPrompt({
    subject,
    ageGroup,
    mode,
    userHistory,
    userPreferences,
    currentContext,
    requestedCount
  }) {
    const ageGroupInfo = this.getAgeGroupInfo(ageGroup);
    const modeInfo = this.getModeInfo(mode);
    const subjectInfo = this.getSubjectInfo(subject);

    let prompt = `Generate ${requestedCount} personalized educational topics for ${subject} in ${mode} mode.

TARGET AUDIENCE:
- Age Group: ${ageGroup} (${ageGroupInfo.description})
- Cognitive Level: ${ageGroupInfo.cognitiveLevel}
- Learning Style: ${ageGroupInfo.learningStyle}

SUBJECT FOCUS:
${subjectInfo.description}
Key concepts for this age: ${subjectInfo.keyConcepts}

MODE REQUIREMENTS:
${modeInfo.description}
Activities should: ${modeInfo.activities}

USER CONTEXT:`;

    // Add user history analysis
    if (userHistory.length > 0) {
      const recentTopics = userHistory.slice(-10).map(h => h.topic || h.message).filter(Boolean);
      const preferredDifficulties = this.analyzePreferredDifficulty(userHistory);
      const engagementPatterns = this.analyzeEngagementPatterns(userHistory);

      prompt += `
RECENT LEARNING HISTORY:
- Recent topics explored: ${recentTopics.join(', ')}
- Preferred difficulty: ${preferredDifficulties}
- Engagement patterns: ${engagementPatterns}
- Avoid repeating: ${recentTopics.slice(-3).join(', ')}`;
    }

    // Add user preferences
    if (Object.keys(userPreferences).length > 0) {
      prompt += `
USER PREFERENCES:
- Favorite subjects: ${userPreferences.favoriteSubjects || 'Not specified'}
- Learning style preference: ${userPreferences.learningStyle || 'Mixed'}
- Interest areas: ${userPreferences.interests || 'General'}
- Difficulty preference: ${userPreferences.difficulty || 'Age-appropriate'}`;
    }

    // Add current context
    if (Object.keys(currentContext).length > 0) {
      prompt += `
CURRENT SESSION CONTEXT:
- Time of day: ${currentContext.timeOfDay || 'Unknown'}
- Session length: ${currentContext.sessionLength || 'Standard'}
- Previous mode: ${currentContext.previousMode || 'None'}
- Current mood indicators: ${currentContext.mood || 'Engaged'}`;
    }

    prompt += `

RESPONSE FORMAT:
Return a JSON array of exactly ${requestedCount} topics, each with this structure:
{
  "id": "unique-identifier",
  "title": "Engaging topic title (4-8 words)",
  "description": "Clear, age-appropriate description (15-25 words)",
  "difficulty": "beginner|intermediate|advanced|expert",
  "estimatedTime": "X min",
  "category": "specific-subcategory",
  "icon": "appropriate-icon-name",
  "questions": ["3-5 thought-provoking questions"],
  "adaptiveHints": ["2-3 adaptive learning hints"],
  "nextSteps": ["2-3 suggested follow-up activities"],
  "personalizedAspects": ["Why this matches user's profile"]
}

REQUIREMENTS:
1. Each topic must be unique and engaging
2. Difficulty should match cognitive development
3. Build on user's demonstrated interests
4. Avoid topics too similar to recent history
5. Include variety in activity types
6. Ensure age-appropriate language throughout
7. Make titles exciting and curiosity-driven
8. Questions should encourage critical thinking
9. Adaptive hints should provide scaffolding
10. Next steps should create learning progression

Generate topics that feel personally tailored to this specific learner.`;

    return prompt;
  }

  /**
   * Parse LLM response into structured topic objects
   */
  async parseTopicResponse(response) {
    try {
      // Clean the response to extract JSON
      let jsonStr = response.trim();
      
      // Remove any markdown code blocks
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON array in the response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const topics = JSON.parse(jsonStr);
      
      // Validate and enrich each topic
      return topics.map((topic, index) => ({
        id: topic.id || `generated-topic-${Date.now()}-${index}`,
        title: topic.title || 'Explore This Topic',
        description: topic.description || 'An interesting educational topic',
        difficulty: topic.difficulty || 'intermediate',
        estimatedTime: topic.estimatedTime || '15 min',
        category: topic.category || 'general',
        icon: this.mapIconName(topic.icon || 'star'),
        questions: Array.isArray(topic.questions) ? topic.questions : [],
        adaptiveHints: Array.isArray(topic.adaptiveHints) ? topic.adaptiveHints : [],
        nextSteps: Array.isArray(topic.nextSteps) ? topic.nextSteps : [],
        personalizedAspects: Array.isArray(topic.personalizedAspects) ? topic.personalizedAspects : [],
        generatedAt: new Date().toISOString(),
        source: 'llm-generated'
      }));

    } catch (error) {
      Logger.error('Failed to parse topic response', { error: error.message, response });
      throw new Error('Invalid topic response format');
    }
  }

  /**
   * Get age-specific information for prompt building
   */
  getAgeGroupInfo(ageGroup) {
    const ageGroupData = {
      '5-6': {
        description: 'Early Elementary - Beginning formal learning',
        cognitiveLevel: 'Concrete operational (early)',
        learningStyle: 'Hands-on, visual, play-based'
      },
      '7-8': {
        description: 'Late Elementary - Building foundational skills',
        cognitiveLevel: 'Concrete operational',
        learningStyle: 'Structured activities, beginning abstract concepts'
      },
      '9-10': {
        description: 'Upper Elementary - Developing independence',
        cognitiveLevel: 'Concrete to formal transition',
        learningStyle: 'Problem-solving, collaborative learning'
      },
      '11-13': {
        description: 'Middle School - Abstract thinking development',
        cognitiveLevel: 'Formal operational (early)',
        learningStyle: 'Critical thinking, hypothesis testing'
      },
      '14-17': {
        description: 'High School - Advanced reasoning',
        cognitiveLevel: 'Formal operational',
        learningStyle: 'Independent research, complex analysis'
      }
    };

    return ageGroupData[ageGroup] || ageGroupData['9-10'];
  }

  /**
   * Get mode-specific information for prompt building
   */
  getModeInfo(mode) {
    const modeData = {
      explore: {
        description: 'Discovery-based learning with open-ended exploration',
        activities: 'encourage curiosity, ask questions, investigate phenomena'
      },
      learn: {
        description: 'Structured learning with clear objectives',
        activities: 'provide explanations, practice skills, build understanding'
      },
      create: {
        description: 'Creative expression and project-based learning',
        activities: 'make, build, design, express ideas creatively'
      },
      study: {
        description: 'Focused practice and skill reinforcement',
        activities: 'review concepts, practice problems, prepare for assessments'
      }
    };

    return modeData[mode] || modeData['explore'];
  }

  /**
   * Get subject-specific information for prompt building
   */
  getSubjectInfo(subject) {
    const subjectData = {
      math: {
        description: 'Mathematical thinking, problem-solving, and numerical reasoning',
        keyConcepts: 'numbers, operations, patterns, geometry, measurement'
      },
      science: {
        description: 'Scientific inquiry, natural phenomena, and experimental thinking',
        keyConcepts: 'observation, hypothesis, experimentation, natural world'
      },
      language: {
        description: 'Communication, literacy, and language development',
        keyConcepts: 'reading, writing, speaking, listening, grammar'
      },
      social_studies: {
        description: 'History, geography, civics, and cultural understanding',
        keyConcepts: 'communities, cultures, historical events, geography'
      }
    };

    return subjectData[subject] || subjectData['science'];
  }

  /**
   * Analyze user's preferred difficulty from history
   */
  analyzePreferredDifficulty(userHistory) {
    const difficulties = userHistory
      .filter(h => h.difficulty)
      .map(h => h.difficulty);
    
    if (difficulties.length === 0) return 'age-appropriate';
    
    const counts = difficulties.reduce((acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  /**
   * Analyze engagement patterns from user history
   */
  analyzeEngagementPatterns(userHistory) {
    const recentSessions = userHistory.slice(-5);
    const avgDuration = recentSessions.reduce((sum, session) => 
      sum + (session.duration || 0), 0) / recentSessions.length;
    
    if (avgDuration > 20) return 'High engagement, prefers longer activities';
    if (avgDuration > 10) return 'Moderate engagement, standard activities';
    return 'Quick learner, prefers shorter focused activities';
  }

  /**
   * Map icon names to appropriate icons
   */
  mapIconName(iconName) {
    const iconMap = {
      star: 'Star',
      calculator: 'Calculator',
      beaker: 'Beaker',
      book: 'BookOpen',
      atom: 'Atom',
      brain: 'Brain',
      puzzle: 'Puzzle',
      rocket: 'Rocket',
      leaf: 'Leaf',
      globe: 'Globe'
    };

    return iconMap[iconName.toLowerCase()] || 'Star';
  }

  /**
   * Get fallback topics when LLM generation fails
   */
  async getFallbackTopics(subject, ageGroup, mode) {
    // Return a small set of safe, generic topics
    return [
      {
        id: `fallback-${subject}-1`,
        title: `Discover ${subject}`,
        description: `Explore the wonderful world of ${subject}`,
        difficulty: 'intermediate',
        estimatedTime: '15 min',
        category: 'general',
        icon: 'Star',
        questions: [`What interests you most about ${subject}?`],
        source: 'fallback'
      }
    ];
  }

  /**
   * Call LLM with the generated prompt
   */
  async callLLM(prompt) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      Logger.error('LLM call failed in TopicGenerationAgent', { error: error.message });
      throw new Error('Failed to generate topics from LLM');
    }
  }

  /**
   * Get fallback response when safety check fails
   */
  getFallbackResponse(context) {
    return {
      id: 'safe-fallback',
      title: 'Let\'s Learn Together',
      description: 'A safe and engaging learning activity',
      difficulty: 'intermediate',
      estimatedTime: '15 min',
      category: 'general',
      icon: 'Star',
      questions: ['What would you like to explore today?'],
      source: 'safety-fallback'
    };
  }
}

export default TopicGenerationAgent;
