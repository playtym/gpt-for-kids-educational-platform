/**
 * Exploration and Discovery Agent
 * Specialized in helping students explore topics and make discoveries
 */

import { BaseAgent } from './BaseAgent.js';
import { ImageService } from '../services/ImageService.js';
import OpenAI from 'openai';

export class ExplorationAgent extends BaseAgent {
  constructor(openaiClient, config = {}) {
    super('ExplorationAgent', {
      maxTokens: 1000,
      temperature: 0.7,
      ...config
    });
    this.client = openaiClient;
    this.imageService = new ImageService();
  }

  /**
   * Generate an exploration response with structured content
   * Supports both text and image inputs
   */
  async generateExplorationResponse(input, context, ageConfig, userId, inputType = 'text') {
    try {
      let prompt, userMessage;
      
      if (inputType === 'image') {
        // Handle image input
        prompt = this.buildImageExplorationPrompt(context, ageConfig);
        userMessage = {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and provide an exploration response about what you see.`
            },
            {
              type: 'image_url',
              image_url: {
                url: input // input should be base64 data URL or image URL
              }
            }
          ]
        };
      } else {
        // Handle text input
        prompt = this.buildExplorationPrompt(input, context, ageConfig);
        userMessage = {
          role: 'user',
          content: `Explore the topic: ${input}`
        };
      }
      
      const completion = await this.client.chat.completions.create({
        model: inputType === 'image' ? 'gpt-4-vision-preview' : 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          userMessage
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const rawContent = completion.choices[0]?.message?.content || '';
      
      // Parse the response to extract structured content
      const parsedResponse = await this.parseExplorationResponse(rawContent, ageConfig, input, inputType);
      
      await this.logInteraction(userId, 'exploration', input, parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('Error generating exploration response:', error);
      return this.getFallbackExplorationResponse();
    }
  }

  /**
   * Build an age-appropriate exploration prompt for text input
   */
  buildExplorationPrompt(topic, context, ageConfig) {
    const basePrompt = `You are an expert exploration guide helping students discover and learn about "${topic}". 

Your response should be in this EXACT format:

**SHORT_ANSWER:**
[Provide a concise, engaging 2-3 sentence answer about the topic]

**FOLLOW_UP_QUESTIONS:**
1. [First follow-up question that encourages deeper exploration]
2. [Second follow-up question from a different angle] 
3. [Third follow-up question that connects to broader concepts]

**RELATED_TOPICS:**
[Topic 1] | [Topic 2] | [Topic 3] | [Topic 4] | [Topic 5]

Make sure to:
1. Keep the short answer brief but informative
2. Make follow-up questions engaging and age-appropriate
3. Choose related topics that naturally connect to the main topic
4. Use language appropriate for the age group

Context from previous conversation: ${context || 'This is the beginning of our exploration'}`;

    return this.addAgeSpecificInstructions(basePrompt, ageConfig);
  }

  /**
   * Build an age-appropriate exploration prompt for image input
   */
  buildImageExplorationPrompt(context, ageConfig) {
    const basePrompt = `You are an expert exploration guide helping students discover and learn from images. 

Analyze the image and provide your response in this EXACT format:

**SHORT_ANSWER:**
[Provide a concise, engaging 2-3 sentence description of what you see and its significance]

**FOLLOW_UP_QUESTIONS:**
1. [First follow-up question about what they observed in the image]
2. [Second follow-up question that encourages them to think deeper about the subject] 
3. [Third follow-up question that connects the image to broader concepts]

**RELATED_TOPICS:**
[Topic 1] | [Topic 2] | [Topic 3] | [Topic 4] | [Topic 5]

Make sure to:
1. Describe what you see clearly and concisely
2. Make follow-up questions based on the visual content
3. Choose related topics that connect to what's shown in the image
4. Use language appropriate for the age group

Context from previous conversation: ${context || 'This is the beginning of our exploration'}`;

    return this.addAgeSpecificInstructions(basePrompt, ageConfig);
  }

  /**
   * Add age-specific instructions to the prompt
   */
  addAgeSpecificInstructions(basePrompt, ageConfig) {
    if (ageConfig.grade.includes('K') || ageConfig.grade.includes('1st')) {
      return `${basePrompt}

🐻 Special instructions for tiny explorers (ages 5-7):
- Use simple words and friendly language
- Make it feel like a fun discovery game
- Include references to colors, sounds, and familiar things
- Follow-up questions should be simple "what", "where", or "how" questions
- Connect to toys, family, pets, or playground experiences`;
    } else if (ageConfig.grade.includes('2nd') || ageConfig.grade.includes('3rd')) {
      return `${basePrompt}

🗺️ Special instructions for young explorers (ages 8-10):
- Use adventure language and exploration metaphors
- Include step-by-step thinking
- Connect to school, home, friends, or nature
- Follow-up questions should encourage hands-on discovery
- Make connections to things they can see, touch, or experience`;
    } else if (ageConfig.grade.includes('4th') || ageConfig.grade.includes('5th')) {
      return `${basePrompt}

🔬 Special instructions for middle-grade explorers (ages 11-13):
- Use scientific reasoning and research language
- Include cause-and-effect relationships
- Connect to current events and global topics
- Follow-up questions should encourage hypothesis formation
- Make connections to multiple academic subjects`;
    } else {
      return `${basePrompt}

🎓 Special instructions for advanced researchers (ages 14-17):
- Use academic terminology and complex concepts
- Present multiple perspectives and viewpoints
- Connect to career paths and real-world applications
- Follow-up questions should encourage critical analysis
- Make connections to philosophical and ethical implications`;
    }
  }

  /**
   * Parse the structured response from the AI to extract components
   */
  async parseExplorationResponse(content, ageConfig, originalInput, inputType) {
    try {
      // Ensure content is a string
      if (!content || typeof content !== 'string') {
        console.warn('parseExplorationResponse: content is not a valid string:', content);
        return this.getFallbackExplorationResponse();
      }

      // Extract short answer
      const shortAnswerMatch = content.match(/\*\*SHORT_ANSWER:\*\*([\s\S]*?)(?=\*\*FOLLOW_UP_QUESTIONS:\*\*|$)/);
      const shortAnswer = shortAnswerMatch ? shortAnswerMatch[1].trim() : content;

      // Extract follow-up questions
      const followUpMatch = content.match(/\*\*FOLLOW_UP_QUESTIONS:\*\*([\s\S]*?)(?=\*\*RELATED_TOPICS:\*\*|$)/);
      const followUpQuestions = this.parseFollowUpQuestions(followUpMatch ? followUpMatch[1] : '');

      // Extract related topics
      const relatedTopicsMatch = content.match(/\*\*RELATED_TOPICS:\*\*([\s\S]*?)$/);
      const relatedTopics = this.parseRelatedTopics(relatedTopicsMatch ? relatedTopicsMatch[1] : '');

      // Get relevant image for the topic (pass age group for better targeting)
      const relevantImage = await this.fetchRelevantImage(originalInput, inputType, ageConfig);

      return {
        type: 'exploration',
        shortAnswer: shortAnswer,
        followUpQuestions: followUpQuestions,
        relatedTopics: relatedTopics,
        relevantImage: relevantImage,
        ageGroup: ageConfig.grade,
        inputType: inputType
      };
    } catch (error) {
      console.error('Error parsing exploration response:', error);
      return this.getFallbackExplorationResponse();
    }
  }

  /**
   * Parse follow-up questions from the response
   */
  parseFollowUpQuestions(text) {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const questions = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Match numbered questions (1., 2., 3.)
        const match = trimmed.match(/^\d+\.\s*(.+)$/);
        if (match) {
          questions.push(match[1].trim());
        }
      }
      
      // Ensure we have exactly 3 questions
      while (questions.length < 3) {
        questions.push(`Tell me more about this topic!`);
      }
      
      return questions.slice(0, 3);
    } catch (error) {
      console.error('Error parsing follow-up questions:', error);
      return ['What else would you like to know?', 'How does this connect to other topics?', 'Why is this important?'];
    }
  }

  /**
   * Parse related topics from the response
   */
  parseRelatedTopics(text) {
    try {
      const topics = text.split('|').map(topic => topic.trim()).filter(topic => topic.length > 0);
      
      // Ensure we have at least 3 and at most 5 topics
      while (topics.length < 3) {
        topics.push('Related concepts');
      }
      
      return topics.slice(0, 5);
    } catch (error) {
      console.error('Error parsing related topics:', error);
      return ['Science', 'Nature', 'Discovery'];
    }
  }

  /**
   * Fetch a relevant image for the topic using ImageService
   * With graceful error handling to prevent system crashes
   */
  async fetchRelevantImage(topic, inputType, ageConfig) {
    try {
      // If input was already an image, don't fetch another one
      if (inputType === 'image') {
        return null;
      }

      // Use ImageService to find relevant image with age group targeting
      // Wrapped in try-catch to prevent system crashes from API errors
      try {
        const relevantImage = await this.imageService.getRelevantImage(topic, {
          ageGroup: ageConfig?.ageGroup || '8-10',
          maxResults: 1
        });
        return relevantImage;
      } catch (imageError) {
        console.warn('Image service unavailable, continuing without images:', imageError.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching relevant image:', error);
      return null;
    }
  }

  /**
   * Get a fallback response when parsing fails
   */
  getFallbackExplorationResponse() {
    return {
      type: 'exploration',
      shortAnswer: "Let's explore this topic together! I'm here to help you discover new and exciting things.",
      followUpQuestions: [
        "What would you like to know more about?",
        "How does this connect to other topics?", 
        "Why is this important?"
      ],
      relatedTopics: ['Science', 'Nature', 'Discovery', 'Learning', 'Exploration'],
      relevantImage: null,
      ageGroup: 'general',
      inputType: 'text'
    };
  }

  /**
   * Log the interaction for analytics and improvement
   */
  async logInteraction(userId, interactionType, topic, response) {
    try {
      // Implementation depends on your logging system
      console.log(`ExplorationAgent: ${userId} - ${interactionType} - ${topic}`);
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }
}
