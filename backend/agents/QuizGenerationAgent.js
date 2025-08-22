/**
 * Quiz Generation Agent
 * Specialized in generating contextual quizzes using LLM and Brave API for web search
 * This is a reusable component that can be used across different parts of the application
 */

import { BaseAgent } from './BaseAgent.js';
import OpenAI from 'openai';
import axios from 'axios';

export class QuizGenerationAgent extends BaseAgent {
  constructor(openaiClient, config = {}) {
    super('QuizGenerationAgent', {
      maxTokens: 1500,
      temperature: 0.7,
      braveApiKey: process.env.BRAVE_API_KEY,
      maxSearchResults: 5,
      ...config
    });
    this.client = openaiClient;
    this.braveApiUrl = 'https://api.search.brave.com/res/v1/web/search';
  }

  /**
   * Generate a contextual quiz based on a topic and context
   * Uses Brave API to search for current information
   * 
   * @param {string} topic - The main topic for the quiz
   * @param {string} context - Additional context or conversation history
   * @param {object} ageConfig - Age configuration for difficulty adjustment
   * @param {object} options - Additional options for quiz generation
   * @returns {Promise<object>} Generated quiz with questions and metadata
   */
  async generateContextualQuiz(topic, context, ageConfig, options = {}) {
    try {
      const {
        questionCount = 5,
        quizType = 'mcq', // 'mcq', 'true-false', 'short-answer', 'mixed'
        searchEnabled = true,
        includeSources = true,
        difficulty = 'auto' // 'easy', 'medium', 'hard', 'auto'
      } = options;

      // Step 1: Search for current information using Brave API
      let searchResults = [];
      if (searchEnabled && this.config.braveApiKey) {
        searchResults = await this.searchWithBrave(topic, context);
      }

      // Step 2: Generate quiz using LLM with search context
      const quiz = await this.generateQuizWithLLM(
        topic, 
        context, 
        searchResults, 
        ageConfig, 
        { questionCount, quizType, difficulty, includeSources }
      );

      // Step 3: Validate and format quiz
      const formattedQuiz = this.formatQuizResponse(quiz, searchResults, includeSources);

      return formattedQuiz;
    } catch (error) {
      console.error('Error generating contextual quiz:', error);
      return this.getFallbackQuiz(topic, ageConfig, options);
    }
  }

  /**
   * Search for information using Brave API
   */
  async searchWithBrave(topic, context) {
    try {
      if (!this.config.braveApiKey) {
        console.warn('Brave API key not configured, skipping search');
        return [];
      }

      // Construct search query from topic and context
      const searchQuery = this.buildSearchQuery(topic, context);
      
      const response = await axios.get(this.braveApiUrl, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.config.braveApiKey
        },
        params: {
          q: searchQuery,
          count: this.config.maxSearchResults,
          offset: 0,
          mkt: 'en-US',
          safesearch: 'strict', // Important for child safety
          freshness: 'pd', // Past day for current information
          text_decorations: false,
          spellcheck: true
        }
      });

      return this.parseSearchResults(response.data);
    } catch (error) {
      console.error('Error searching with Brave API:', error);
      return [];
    }
  }

  /**
   * Build an effective search query from topic and context
   */
  buildSearchQuery(topic, context) {
    // Extract key terms from context
    const contextTerms = context ? 
      context.split(' ')
        .filter(word => word.length > 3)
        .slice(-10) // Last 10 meaningful words
        .join(' ') : '';

    // Combine topic with recent context for better search
    const query = contextTerms ? 
      `${topic} ${contextTerms}` : 
      topic;

    return query.trim();
  }

  /**
   * Parse Brave API search results
   */
  parseSearchResults(data) {
    try {
      const results = data.web?.results || [];
      return results.map(result => ({
        title: result.title,
        snippet: result.description,
        url: result.url,
        published: result.age,
        relevance: result.profile?.name || 'general'
      })).slice(0, this.config.maxSearchResults);
    } catch (error) {
      console.error('Error parsing search results:', error);
      return [];
    }
  }

  /**
   * Generate quiz using LLM with search context
   */
  async generateQuizWithLLM(topic, context, searchResults, ageConfig, options) {
    try {
      const prompt = this.buildQuizPrompt(topic, context, searchResults, ageConfig, options);
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: `Generate a ${options.quizType} quiz about "${topic}" with ${options.questionCount} questions.`
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating quiz with LLM:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive quiz generation prompt
   */
  buildQuizPrompt(topic, context, searchResults, ageConfig, options) {
    const { questionCount, quizType, difficulty, includeSources } = options;
    
    // Determine difficulty based on age if auto
    const actualDifficulty = difficulty === 'auto' ? 
      this.determineDifficultyFromAge(ageConfig) : difficulty;

    let searchContext = '';
    if (searchResults.length > 0) {
      searchContext = `

**CURRENT INFORMATION FROM WEB SEARCH:**
${searchResults.map((result, index) => 
  `Source ${index + 1}: ${result.title}
  Content: ${result.snippet}
  URL: ${result.url}
  `).join('\n')}`;
    }

    const basePrompt = `You are an expert quiz generator creating educational assessments about "${topic}".

${searchContext}

**CONVERSATION CONTEXT:** 
${context || 'This is the beginning of our quiz session'}

Your response should be in this EXACT format:

**QUIZ_TITLE:** [Creative, engaging title for the quiz]

**QUIZ_DESCRIPTION:** [Brief description of what this quiz covers]

${this.getQuestionFormat(quizType, questionCount)}

**ANSWER_KEY:**
${this.getAnswerKeyFormat(quizType, questionCount)}

${includeSources && searchResults.length > 0 ? `
**SOURCES:**
[List the web sources you used to create current, accurate questions]
` : ''}

**LEARNING_OBJECTIVES:**
- [Objective 1]
- [Objective 2]
- [Objective 3]

Make sure to:
1. Use current, accurate information from the web search results when available
2. Create questions that test understanding, not just memorization
3. Include a mix of factual and analytical questions
4. Make questions age-appropriate for ${this.getAgeDescription(ageConfig)}
5. Ensure all questions relate directly to the topic "${topic}"
6. Difficulty level: ${actualDifficulty}`;

    return this.addAgeSpecificInstructions(basePrompt, ageConfig, actualDifficulty);
  }

  /**
   * Get question format based on quiz type
   */
  getQuestionFormat(quizType, questionCount) {
    switch (quizType) {
      case 'mcq':
        return Array.from({length: questionCount}, (_, i) => `
**Q${i + 1}:** [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]`).join('\n');

      case 'true-false':
        return Array.from({length: questionCount}, (_, i) => `
**Q${i + 1}:** [Statement to evaluate]
True / False`).join('\n');

      case 'short-answer':
        return Array.from({length: questionCount}, (_, i) => `
**Q${i + 1}:** [Question requiring 1-2 sentence answer]`).join('\n');

      case 'mixed':
        return `
**Q1-${Math.ceil(questionCount/2)}:** [Multiple Choice Questions - format as MCQ above]
**Q${Math.ceil(questionCount/2) + 1}-${questionCount}:** [True/False or Short Answer Questions]`;

      default:
        return this.getQuestionFormat('mcq', questionCount);
    }
  }

  /**
   * Get answer key format based on quiz type
   */
  getAnswerKeyFormat(quizType, questionCount) {
    switch (quizType) {
      case 'mcq':
        return Array.from({length: questionCount}, (_, i) => 
          `Q${i + 1}: [A/B/C/D] - [Brief explanation]`).join('\n');

      case 'true-false':
        return Array.from({length: questionCount}, (_, i) => 
          `Q${i + 1}: [True/False] - [Brief explanation]`).join('\n');

      case 'short-answer':
        return Array.from({length: questionCount}, (_, i) => 
          `Q${i + 1}: [Sample correct answer with key points]`).join('\n');

      case 'mixed':
        return `Q1-${Math.ceil(questionCount/2)}: [MCQ answers]
Q${Math.ceil(questionCount/2) + 1}-${questionCount}: [Other format answers]`;

      default:
        return this.getAnswerKeyFormat('mcq', questionCount);
    }
  }

  /**
   * Determine difficulty from age configuration
   */
  determineDifficultyFromAge(ageConfig) {
    if (ageConfig.grade.includes('K') || ageConfig.grade.includes('1st') || ageConfig.grade.includes('2nd')) {
      return 'easy';
    } else if (ageConfig.grade.includes('5th') || ageConfig.grade.includes('middle')) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Get age description for prompts
   */
  getAgeDescription(ageConfig) {
    if (ageConfig.grade.includes('K') || ageConfig.grade.includes('1st')) {
      return 'young children (ages 5-7)';
    } else if (ageConfig.grade.includes('2nd')) {
      return 'elementary students (ages 8-10)';
    } else if (ageConfig.grade.includes('5th')) {
      return 'middle school students (ages 11-13)';
    } else {
      return 'high school students (ages 14-17)';
    }
  }

  /**
   * Add age-specific instructions to the prompt
   */
  addAgeSpecificInstructions(basePrompt, ageConfig, difficulty) {
    if (ageConfig.grade.includes('K') || ageConfig.grade.includes('1st')) {
      return `${basePrompt}

🧸 Special instructions for young children (ages 5-7):
- Use simple vocabulary and short sentences
- Include colorful, visual concepts
- Make questions fun and playful
- Use familiar objects and experiences
- Avoid abstract concepts
- Include encouragement and positive reinforcement`;

    } else if (ageConfig.grade.includes('2nd')) {
      return `${basePrompt}

🎒 Special instructions for elementary students (ages 8-10):
- Use clear, straightforward language
- Connect to school and home experiences
- Include hands-on or observable examples
- Use step-by-step reasoning
- Make connections to things they can see and do
- Encourage curiosity and exploration`;

    } else if (ageConfig.grade.includes('5th')) {
      return `${basePrompt}

📚 Special instructions for middle school students (ages 11-13):
- Use more sophisticated vocabulary
- Include scientific reasoning and analysis
- Connect to current events and real-world applications
- Encourage critical thinking and hypothesis formation
- Include cause-and-effect relationships
- Challenge them to make connections across subjects`;

    } else {
      return `${basePrompt}

🎓 Special instructions for high school students (ages 14-17):
- Use academic terminology and complex concepts
- Include multiple perspectives and theoretical frameworks
- Connect to career paths and higher education
- Encourage critical analysis and evaluation
- Include philosophical and ethical considerations
- Challenge them to synthesize information from multiple sources`;
    }
  }

  /**
   * Format the quiz response into a structured object
   */
  formatQuizResponse(quizContent, searchResults, includeSources) {
    try {
      const sections = this.parseQuizSections(quizContent);
      
      return {
        type: 'quiz',
        title: sections.title || 'Generated Quiz',
        description: sections.description || 'Educational quiz based on your topic',
        questions: sections.questions || [],
        answerKey: sections.answerKey || [],
        sources: includeSources ? searchResults : [],
        learningObjectives: sections.learningObjectives || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          searchResultsUsed: searchResults.length,
          questionsCount: sections.questions?.length || 0
        }
      };
    } catch (error) {
      console.error('Error formatting quiz response:', error);
      return this.getFallbackQuiz('Generated Quiz', {}, {});
    }
  }

  /**
   * Parse quiz sections from LLM response
   */
  parseQuizSections(content) {
    const sections = {};
    
    // Extract title
    const titleMatch = content.match(/\*\*QUIZ_TITLE:\*\*(.*?)(?=\*\*|$)/s);
    sections.title = titleMatch ? titleMatch[1].trim() : null;
    
    // Extract description
    const descMatch = content.match(/\*\*QUIZ_DESCRIPTION:\*\*(.*?)(?=\*\*|$)/s);
    sections.description = descMatch ? descMatch[1].trim() : null;
    
    // Extract questions (this will need to be adapted based on question format)
    const questionsMatch = content.match(/\*\*Q\d+:\*\*(.*?)(?=\*\*ANSWER_KEY:|$)/s);
    sections.questions = questionsMatch ? this.parseQuestions(questionsMatch[1]) : [];
    
    // Extract answer key
    const answerMatch = content.match(/\*\*ANSWER_KEY:\*\*(.*?)(?=\*\*|$)/s);
    sections.answerKey = answerMatch ? this.parseAnswerKey(answerMatch[1]) : [];
    
    // Extract learning objectives
    const objectivesMatch = content.match(/\*\*LEARNING_OBJECTIVES:\*\*(.*?)(?=\*\*|$)/s);
    sections.learningObjectives = objectivesMatch ? 
      this.parseListItems(objectivesMatch[1]) : [];
    
    return sections;
  }

  /**
   * Parse questions from text
   */
  parseQuestions(questionsText) {
    // This is a simplified parser - would need to be enhanced for different question types
    const questions = [];
    const questionBlocks = questionsText.split(/\*\*Q\d+:\*\*/).filter(block => block.trim());
    
    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const questionText = lines[0].trim();
        const options = lines.slice(1).map(line => line.trim()).filter(line => line.match(/^[A-D]\)/));
        
        questions.push({
          id: index + 1,
          question: questionText,
          options: options.map(opt => ({
            letter: opt.charAt(0),
            text: opt.substring(2).trim()
          })),
          type: options.length > 0 ? 'mcq' : 'text'
        });
      }
    });
    
    return questions;
  }

  /**
   * Parse answer key from text
   */
  parseAnswerKey(answerText) {
    const answers = [];
    const answerLines = answerText.split('\n').filter(line => line.trim() && line.includes(':'));
    
    answerLines.forEach(line => {
      const match = line.match(/Q(\d+):\s*([A-D]|True|False|.*?)\s*-\s*(.*)/);
      if (match) {
        answers.push({
          questionId: parseInt(match[1]),
          correctAnswer: match[2].trim(),
          explanation: match[3].trim()
        });
      }
    });
    
    return answers;
  }

  /**
   * Parse list items (for learning objectives)
   */
  parseListItems(text) {
    return text.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
  }

  /**
   * Get fallback quiz when generation fails
   */
  getFallbackQuiz(topic, ageConfig, options) {
    return {
      type: 'quiz',
      title: `Quiz: ${topic}`,
      description: `A quiz about ${topic}`,
      questions: [
        {
          id: 1,
          question: `What is the main concept related to ${topic}?`,
          options: [
            { letter: 'A', text: 'Option A' },
            { letter: 'B', text: 'Option B' },
            { letter: 'C', text: 'Option C' },
            { letter: 'D', text: 'Option D' }
          ],
          type: 'mcq'
        }
      ],
      answerKey: [
        {
          questionId: 1,
          correctAnswer: 'A',
          explanation: 'This is a fallback explanation.'
        }
      ],
      sources: [],
      learningObjectives: [`Understand basic concepts of ${topic}`],
      metadata: {
        generatedAt: new Date().toISOString(),
        searchResultsUsed: 0,
        questionsCount: 1,
        fallback: true
      }
    };
  }

  /**
   * Generate a quick quiz without web search (for faster responses)
   */
  async generateQuickQuiz(topic, ageConfig, questionCount = 3) {
    return this.generateContextualQuiz(topic, '', ageConfig, {
      questionCount,
      quizType: 'mcq',
      searchEnabled: false,
      includeSources: false,
      difficulty: 'auto'
    });
  }

  /**
   * Generate a comprehensive quiz with full web search
   */
  async generateComprehensiveQuiz(topic, context, ageConfig, questionCount = 10) {
    return this.generateContextualQuiz(topic, context, ageConfig, {
      questionCount,
      quizType: 'mixed',
      searchEnabled: true,
      includeSources: true,
      difficulty: 'auto'
    });
  }
}
