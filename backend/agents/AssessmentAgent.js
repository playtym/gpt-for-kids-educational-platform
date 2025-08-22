/**
 * Assessment and Feedback Agent
 * Specialized in providing constructive feedback and educational assessment
 */

import { BaseAgent } from './BaseAgent.js';
import OpenAI from 'openai';

export class AssessmentAgent extends BaseAgent {
  constructor(openaiClient, config = {}) {
    super('AssessmentAgent', {
      maxTokens: 800,
      temperature: 0.6,
      ...config
    });
    this.openai = openaiClient;
  }

  /**
   * Provide constructive feedback on student work with age-specific approaches
   */
  async provideFeedback(studentWork, type, ageGroup, context = []) {
    this.validateInput(['studentWork', 'type', 'ageGroup'], { studentWork, type, ageGroup });

    if (!this.openai) {
      return this.getFallbackResponse({ type });
    }

    try {
      this.logActivity('provideFeedback', { type, ageGroup, workLength: studentWork.length });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualWork = this.buildContextPrompt(studentWork, context);
      const guidelines = this.buildAgeSpecificGuidelines(ageConfig, 'feedback');
      
      const prompt = this.buildFeedbackPrompt(ageConfig, contextualWork, type, guidelines);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.getTokensForAge(ageConfig),
        temperature: this.config.temperature
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'feedback', workType: type });

    } catch (error) {
      this.handleError(error, { studentWork: studentWork.substring(0, 100), type, ageGroup });
    }
  }

  /**
   * Build age-specific feedback prompts
   */
  buildFeedbackPrompt(ageConfig, studentWork, type, guidelines) {
    if (ageConfig.grade.includes('kindergarten')) {
      return `
        You are a loving preschool teacher for little artists (ages 5-7).
        
        Little one's work: "${studentWork}"
        Type: ${type}
        
        🌈 **LITTLE ARTIST'S CELEBRATION** 🌈
        
        Make them feel super special:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format like a preschool celebration:
        ⭐ **WOW! LOOK WHAT YOU DID:** [One specific thing in simple words with excitement]
        🎈 **YOU'RE GROWING:** [What they're learning to do, like a big kid]
        🌟 **TRY NEXT TIME:** [One tiny suggestion as a fun game]
        💝 **TEACHER HUGS:** [Personal loving message with their effort]
        
        - Use excited teacher voice ("Wow!" "Amazing!" "Look at you!")
        - Focus on effort not perfection
        - Make suggestions feel like playing games
        - Use lots of celebration language
      `;
    } else if (ageConfig.grade.includes('2nd')) {
      return `
        You are an encouraging elementary teacher for young learners (ages 8-10).
        
        Student's work: "${studentWork}"
        Assignment type: ${type}
        
        📋 **PROGRESS REPORT CELEBRATION** 📋
        
        Feedback approach:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as encouraging report:
        🌟 **AWESOME ACHIEVEMENTS:** [2 specific things they did well with clear reasons]
        📈 **GROWING SKILLS:** [What learning skills they're developing]
        🎯 **NEXT LEVEL CHALLENGE:** [One clear suggestion to make their work even better]
        🏆 **TEACHER'S PRIDE:** [Personal message about their effort and growth]
        
        - Use encouraging teacher language
        - Be specific about what they did well
        - Connect to their learning goals
        - Make them feel proud of their effort
      `;
    } else if (ageConfig.grade.includes('5th')) {
      return `
        You are an academic coach for developing scholars (ages 11-13).
        
        Student's work: "${studentWork}"
        Academic area: ${type}
        
        📊 **ACADEMIC DEVELOPMENT ASSESSMENT** 📊
        
        Assessment standards:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as academic coaching session:
        ✅ **ACADEMIC STRENGTHS:** [Detailed analysis of successful elements]
        📈 **SKILL DEVELOPMENT:** [Academic skills they're building]
        🎯 **GROWTH OPPORTUNITIES:** [Specific strategies for improvement]
        🧠 **SCHOLAR'S REFLECTION:** [Questions to help them self-assess]
        
        - Use academic coaching language
        - Provide detailed, constructive analysis
        - Connect to academic standards and goals
        - Encourage self-reflection and goal-setting
      `;
    } else {
      return `
        You are a university writing center tutor for advanced students (ages 14-17).
        
        Student's work: "${studentWork}"
        Academic discipline: ${type}
        
        🎓 **ADVANCED ACADEMIC CONSULTATION** 🎓
        
        University standards:
        ${guidelines.language}
        ${guidelines.cognitive}
        
        Format as university tutorial:
        📚 **ACADEMIC ANALYSIS:** [Sophisticated analysis of strengths and techniques]
        🔍 **CRITICAL EVALUATION:** [Areas for development with specific strategies]
        💡 **ADVANCED TECHNIQUES:** [Higher-level skills to develop]
        🎯 **SCHOLARLY GOALS:** [Long-term academic development objectives]
        
        - Use university-level academic language
        - Provide sophisticated literary/academic analysis
        - Connect to advanced academic standards
        - Encourage independent critical thinking
      `;
    }
  }

  /**
   * Get appropriate token count and assessment depth based on age
   */
  getTokensForAge(ageConfig) {
    if (ageConfig.grade.includes('kindergarten')) return 200;
    if (ageConfig.grade.includes('2nd')) return 400;
    if (ageConfig.grade.includes('5th')) return 600;
    return 800;
  }

  /**
   * Generate thoughtful questions based on student work
   */
  async generateQuestions(topic, ageGroup, questionType = 'thoughtful', context = []) {
    this.validateInput(['topic', 'ageGroup'], { topic, ageGroup });

    if (!this.openai) {
      return this.getFallbackResponse({ type: 'question', topic });
    }

    try {
      this.logActivity('generateQuestions', { topic, ageGroup, questionType });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualTopic = this.buildContextPrompt(topic, context);
      
      const prompt = `
        Generate ${questionType} questions about "${contextualTopic}" for ${ageConfig.grade} students.
        
        Age group: ${ageGroup}
        Vocabulary: ${ageConfig.vocabulary}
        Complexity: ${ageConfig.complexity}
        
        Create 2-3 questions that:
        - Encourage critical thinking and reflection
        - Have no single "right" answer
        - Promote discussion and exploration
        - Are appropriate for their age and understanding
        - Build on what they might already know
        - Connect to their everyday experiences
        
        Question types to include:
        - "What if..." scenarios
        - "How do you think..." reflections
        - "Why might..." reasoning questions
        
        Format as an assessment report card:
        📝 **QUESTION QUEST RESULTS**
        
        🎪 **Amazing Curiosity Questions:** [2-3 questions with carnival/adventure themes]
        
        🎲 **Bonus Challenge:** [Optional deeper thinking prompt]
        
        🏆 **Quest Completed!** [Encouraging achievement message]
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'questions', topic, questionType });

    } catch (error) {
      this.handleError(error, { topic, ageGroup, questionType });
    }
  }

  /**
   * Assess student understanding and provide guidance
   */
  async assessUnderstanding(studentResponse, expectedConcepts, ageGroup, context = []) {
    this.validateInput(['studentResponse', 'ageGroup'], { studentResponse, ageGroup });

    try {
      this.logActivity('assessUnderstanding', { ageGroup, hasExpectedConcepts: !!expectedConcepts });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualResponse = this.buildContextPrompt(studentResponse, context);
      
      const prompt = `
        Assess this student's understanding and provide gentle guidance:
        
        Student response: "${contextualResponse}"
        Expected concepts: ${expectedConcepts || 'General understanding'}
        Student level: ${ageConfig.grade}
        
        Evaluation focus:
        - What concepts they seem to understand well
        - Areas where they might need gentle guidance
        - Their curiosity and engagement level
        - How to build on their current understanding
        
        Format as a progress report:
        📊 **LEARNING PROGRESS REPORT**
        
        ✅ **MASTERED SKILLS:** [What they've grasped well with checkmarks]
        🌱 **GROWING EDGE:** [One area to explore further - growth mindset language]
        🚀 **MISSION CONTROL:** [Next step as a space mission or adventure]
        
        📋 **TEACHER ASSESSMENT:** [Personal note with specific observations]
        
        Use ${ageConfig.vocabulary} vocabulary and be very encouraging.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: 0.6
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { type: 'assessment' });

    } catch (error) {
      this.handleError(error, { studentResponse: studentResponse.substring(0, 100), ageGroup });
    }
  }

  /**
   * Get assessment criteria based on work type
   */
  getAssessmentCriteria(type, ageConfig) {
    const criteria = {
      'creative-writing': [
        'Imagination and creativity',
        'Story structure (beginning, middle, end)',
        'Character development',
        'Use of descriptive language',
        'Voice and personal expression'
      ],
      'math-problem': [
        'Problem-solving approach',
        'Mathematical reasoning',
        'Correct use of concepts',
        'Clear explanation of thinking',
        'Accuracy of solution'
      ],
      'science-explanation': [
        'Understanding of concepts',
        'Use of scientific vocabulary',
        'Clear explanation',
        'Connection to real world',
        'Curiosity and questioning'
      ],
      'general': [
        'Effort and engagement',
        'Clear communication',
        'Understanding demonstrated',
        'Personal connection to topic',
        'Curiosity and questions'
      ]
    };

    const typeCriteria = criteria[type] || criteria['general'];
    return typeCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n');
  }

  /**
   * Assessment-specific fallback responses with celebratory tone
   */
  getFallbackResponse(context = {}) {
    const { type = 'feedback', topic = 'your work' } = context;
    
    switch (type) {
      case 'feedback':
        return `🌟 **CELEBRATION TIME!** Amazing effort on ${topic}! I can see you're putting your heart into learning. 📈 **GROWING STRONGER:** Every step you take builds your learning muscles! ✨ **TEACHER'S NOTE:** What part made you feel most proud?`;
      case 'question':
        return `📝 **QUESTION QUEST RESULTS** 🎪 **Amazing Curiosity Questions:** What do you find most exciting about ${topic}? 🏆 **Quest Completed!** Your curiosity is your superpower!`;
      case 'assessment':
        return `📊 **LEARNING PROGRESS REPORT** ✅ **MASTERED SKILLS:** You're thinking hard and growing! 🚀 **MISSION CONTROL:** What questions are launching in your mind?`;
      default:
        return `🌟 **CELEBRATION TIME!** You're making incredible progress! 📈 **GROWING STRONGER:** Every question helps you level up in learning!`;
    }
  }
}
