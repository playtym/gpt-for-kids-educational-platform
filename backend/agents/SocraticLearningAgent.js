/**
 * Socratic Learning Agent
 * Specialized in guiding students through Socratic dialogue and structured learning paths
 */

import { BaseAgent } from './BaseAgent.js';
import { LearningPathService } from '../services/LearningPathService.js';
import OpenAI from 'openai';

export class SocraticLearningAgent extends BaseAgent {
  constructor(openaiClient, config = {}) {
    super('SocraticLearningAgent', {
      maxTokens: 1000, // Increased back for longer, more detailed responses
      temperature: 0.6,
      ...config
    });
    this.openai = openaiClient;
    this.learningPathService = new LearningPathService(openaiClient);
  }

  /**
   * Generate Socratic response based on mode
   */
  async generateResponse(question, studentResponse, ageGroup, subject, mode = 'socratic', context = []) {
    this.validateInput(['question', 'ageGroup', 'subject'], { question, ageGroup, subject });
    
    if (!this.openai) {
      throw new Error('OpenAI client not available. Please check your API key.');
    }

    try {
      this.logActivity('generateResponse', { mode, ageGroup, subject, hasContext: context.length > 0 });

      const ageConfig = this.getAgeConfig(ageGroup);
      const contextualQuestion = this.buildContextPrompt(question, context);
      
      const prompt = this.buildPrompt(mode, contextualQuestion, studentResponse, ageConfig, subject);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const content = response.choices[0].message.content;
      return await this.applySafetyCheck(content, ageGroup, { mode, subject });
      
    } catch (error) {
      this.handleError(error, { question, mode, ageGroup, subject });
    }
  }

  /**
   * Start a structured learning journey for deep topic exploration
   */
  async startLearningJourney(threadId, topic, ageGroup, context = []) {
    this.validateInput(['threadId', 'topic', 'ageGroup'], { threadId, topic, ageGroup });
    
    if (!this.openai) {
      throw new Error('OpenAI client not available. Please check your API key.');
    }

    try {
      this.logActivity('startLearningJourney', { threadId, topic, ageGroup });

      // Start the learning journey
      const journey = await this.learningPathService.startLearningJourney(
        threadId, 
        topic, 
        ageGroup, 
        this.openai
      );

      // Get the first step content
      const firstStep = this.learningPathService.getCurrentStepContent(threadId);
      
      if (!firstStep) {
        throw new Error('Failed to get first learning step');
      }

      // Format the response for the frontend
      return {
        type: 'learning_path_start',
        content: firstStep.content,
        question: firstStep.question,
        metadata: {
          stepNumber: firstStep.stepNumber,
          totalSteps: firstStep.totalSteps,
          progress: firstStep.progress,
          title: firstStep.title,
          isLearningPath: true,
          topic: topic,
          ageGroup: ageGroup
        }
      };

    } catch (error) {
      this.handleError(error, { threadId, topic, ageGroup });
    }
  }

  /**
   * Process student answer in a learning journey
   */
  async processLearningAnswer(threadId, studentAnswer, ageGroup) {
    this.validateInput(['threadId', 'studentAnswer', 'ageGroup'], { threadId, studentAnswer, ageGroup });
    
    if (!this.openai) {
      throw new Error('OpenAI client not available. Please check your API key.');
    }

    try {
      this.logActivity('processLearningAnswer', { threadId, answerLength: studentAnswer.length });

      // Process the answer through the learning path service
      const result = await this.learningPathService.processAnswer(
        threadId,
        studentAnswer,
        this.openai
      );

      if (!result) {
        throw new Error('No active learning journey found');
      }

      // Handle different result types
      switch (result.type) {
        case 'feedback':
          return {
            type: 'learning_feedback',
            content: result.feedback,
            metadata: {
              isCorrect: result.isCorrect,
              score: result.score,
              canProceed: result.canProceed,
              isLearningPath: true,
              feedbackType: 'answer_evaluation'
            }
          };

        case 'nudge':
          return {
            type: 'learning_nudge',
            content: result.feedback,
            metadata: {
              nudgeCount: result.nudgeCount,
              isLearningPath: true,
              feedbackType: 'gentle_redirect'
            }
          };

        case 'abandon_option':
          return {
            type: 'learning_abandon_option',
            content: result.feedback,
            metadata: {
              canAbandon: result.canAbandon,
              isLearningPath: true,
              feedbackType: 'abandon_choice'
            }
          };

        case 'error':
          return {
            type: 'learning_error',
            content: result.feedback,
            metadata: {
              isLearningPath: true,
              feedbackType: 'error_recovery'
            }
          };

        default:
          throw new Error(`Unknown result type: ${result.type}`);
      }

    } catch (error) {
      this.handleError(error, { threadId, answerLength: studentAnswer.length });
    }
  }

  /**
   * Continue to the next step in the learning journey
   */
  async continueToNextStep(threadId) {
    this.validateInput(['threadId'], { threadId });

    try {
      this.logActivity('continueToNextStep', { threadId });

      const result = await this.learningPathService.moveToNextStep(threadId);
      
      if (!result) {
        // No active learning journey found - throw error instead of fallback
        throw new Error(`No active learning journey found for thread ${threadId}`);
      }

      switch (result.type) {
        case 'next_step':
          return {
            type: 'learning_next_step',
            content: result.content,
            question: result.question,
            metadata: {
              stepNumber: result.stepNumber,
              totalSteps: result.totalSteps,
              progress: result.progress,
              title: result.title,
              isLearningPath: true,
              stepType: 'content_and_question'
            }
          };

        case 'completion':
          return {
            type: 'learning_completion',
            content: result.message,
            metadata: {
              isLearningPath: true,
              practiceQuestions: result.practiceQuestions,
              summary: result.summary,
              nextTopics: result.nextTopics || [],
              stepType: 'journey_complete'
            }
          };

        default:
          throw new Error(`Unknown step result type: ${result.type}`);
      }

    } catch (error) {
      this.handleError(error, { threadId });
    }
  }

  /**
   * Abandon the current learning journey
   */
  async abandonLearningJourney(threadId, reason = 'user_choice') {
    this.validateInput(['threadId'], { threadId });

    try {
      this.logActivity('abandonLearningJourney', { threadId, reason });

      const result = this.learningPathService.abandonJourney(threadId, reason);
      
      if (!result) {
        return {
          type: 'no_journey',
          content: "No active learning journey to abandon. What would you like to learn about?",
          metadata: {
            isLearningPath: false
          }
        };
      }

      return {
        type: 'learning_abandoned',
        content: result.message,
        metadata: {
          completionPercent: result.completionPercent,
          stepsCompleted: result.stepsCompleted,
          isLearningPath: false,
          wasAbandoned: true
        }
      };

    } catch (error) {
      this.handleError(error, { threadId, reason });
    }
  }

  /**
   * Generate comprehensive practice quiz for completed learning journey
   */
  async generatePracticeQuiz(threadId, allLearningContext = []) {
    this.validateInput(['threadId'], { threadId });

    try {
      this.logActivity('generatePracticeQuiz', { threadId, contextLength: allLearningContext.length });

      const quiz = await this.learningPathService.generateComprehensiveLearningQuiz(threadId, allLearningContext);
      
      if (!quiz) {
        return {
          type: 'no_quiz_available',
          content: "No completed learning journey found to create a quiz from. Complete a learning path first!",
          metadata: {
            isQuiz: false
          }
        };
      }

      return {
        type: 'comprehensive_quiz',
        content: `🎯 ${quiz.title}\n\n${quiz.description}\n\nThis quiz tests everything you've learned! Take your time and think through each question.`,
        metadata: {
          quiz: quiz,
          isQuiz: true,
          isComprehensive: true,
          questionCount: quiz.totalQuestions,
          ageGroup: quiz.ageGroup,
          learningObjectives: quiz.learningObjectives
        }
      };

    } catch (error) {
      this.logActivity('generatePracticeQuizError', { threadId, error: error.message });
      
      return {
        type: 'quiz_error',
        content: "I had trouble creating your quiz right now. This might be because we need to complete a learning journey first, or there was a technical issue. Try starting a new learning topic and completing it!",
        metadata: {
          isQuiz: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Get the status of the current learning journey
   */
  getLearningJourneyStatus(threadId) {
    return this.learningPathService.getJourneyStatus(threadId);
  }

  /**
   * Build appropriate prompt based on Socratic mode and age with radical differentiation
   */
  buildPrompt(mode, question, studentResponse, ageConfig, subject) {
    const guidelines = this.buildAgeSpecificGuidelines(ageConfig, 'socratic');
    
    if (ageConfig.grade.includes('kindergarten')) {
      return this.buildEarlyChildhoodPrompt(mode, question, studentResponse, subject, guidelines);
    } else if (ageConfig.grade.includes('2nd')) {
      return this.buildElementaryPrompt(mode, question, studentResponse, subject, guidelines);
    } else if (ageConfig.grade.includes('5th')) {
      return this.buildMiddleGradePrompt(mode, question, studentResponse, subject, guidelines);
    } else {
      return this.buildAdvancedPrompt(mode, question, studentResponse, subject, guidelines);
    }
  }

  /**
   * Early Childhood (5-7) - Focus on wonder and simple discovery
   */
  buildEarlyChildhoodPrompt(mode, question, studentResponse, subject, guidelines) {
    switch (mode) {
      case 'answer-first':
        return `
          You are a friendly teddy bear teacher for tiny learners (ages 5-7).
          
          Subject: ${subject}
          Little one asks: "${question}"
          
          🧸 **TEDDY BEAR'S GENTLE TEACHING** 🧸
          
          Make learning feel like playtime:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format like playing with blocks:
          🌈 **TEDDY SAYS:** [Simple answer in 4-5 words with happy tone]
          🎈 **LET'S WONDER:** [One simple what/who question they can answer]
          
          - Use teddy bear voice ("Teddy thinks..." "Teddy sees...")
          - Everything about things they can touch or see
          - Use rhymes and repetition
          - Make it feel like playing, not teaching
        `;

      case 'deep-dive':
        return `
          You are a playful puppet friend for little explorers (ages 5-7).
          
          Topic to explore: "${question}"
          Subject: ${subject}
          
          🎪 **PUPPET SHOW LEARNING TIME** 🎪
          
          Make it like a fun puppet show:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as puppet dialogue:
          🎭 **PUPPET FRIEND:** [Tell one simple thing about the topic]
          🎈 **LET'S PLAY:** [Simple action they can do with their hands]
          🦋 **PUPPET WONDERS:** [Simple what question using familiar things]
          
          - Use puppet personality and silly voices
          - Include actions they can copy
          - Connect to toys, animals, or family
          - Keep it very short and playful
        `;

      default: // socratic
        return `
          You are a gentle story friend for little thinkers (ages 5-7).
          
          Subject: ${subject}
          Little one says: "${studentResponse || question}"
          
          📚 **STORY FRIEND'S QUESTIONS** 📚
          
          Ask questions like in a story:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as story conversation:
          🌟 **STORY FRIEND ASKS:** [One simple what/who question about familiar things]
          🐰 **THINK TOGETHER:** [Encourage them with "You know about..." statement]
          
          - Ask only about things they can see or touch
          - Use story language ("Once you saw..." "Remember when...")
          - Never ask why questions - too hard for this age
          - Make thinking feel like playing pretend
        `;
    }
  }

  /**
   * Elementary (8-10) - Building thinking skills with guidance
   */
  buildElementaryPrompt(mode, question, studentResponse, subject, guidelines) {
    switch (mode) {
      case 'answer-first':
        return `
          You are a friendly teacher for curious kids (ages 8-10).
          
          Subject: ${subject}
          Student asks: "${question}"
          
          🎒 **HELPFUL TEACHER TIME** 🎒
          
          Teaching approach:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as classroom lesson:
          📝 **TEACHER EXPLAINS:** [Clear answer with one main idea and example]
          🤔 **LET'S THINK MORE:** [Two simple how/why questions they can handle]
          
          - Use teacher voice but friendly
          - Give clear examples from their world (school, home, friends)
          - Connect to things they already learned
          - Encourage them to share what they know
        `;

      case 'deep-dive':
        return `
          You are a project guide for young investigators (ages 8-10).
          
          Investigation topic: "${question}"
          Subject: ${subject}
          
          🔍 **YOUNG INVESTIGATOR PROJECT** 🔍
          
          Project approach:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as investigation plan:
          🎯 **WHY THIS MATTERS:** [Why kids their age should care about this]
          📋 **WHAT WE KNOW:** [Build on what they might already know]
          🕵️ **INVESTIGATION STEPS:** [2-3 things they can research or try]
          🤔 **BIG QUESTIONS:** [Questions that connect to other subjects they study]
          
          - Use detective and investigation language
          - Connect to other school subjects
          - Suggest projects they can do alone or with friends
          - Make them feel like real researchers
        `;

      default: // socratic
        return `
          You are a thinking coach for young philosophers (ages 8-10).
          
          Subject: ${subject}
          Student says: "${studentResponse || question}"
          
          🧠 **THINKING COACH QUESTIONS** 🧠
          
          Question approach:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as thinking session:
          💭 **COACH ASKS:** [One how/why question building on what they said]
          🌟 **YOU'RE THINKING:** [Acknowledge their thinking effort]
          
          - Ask how/why questions they can actually answer
          - Build on their own words and ideas
          - Use "thinking coach" language
          - Help them feel smart for thinking hard
        `;
    }
  }

  /**
   * Middle Grade (11-13) - Developing critical thinking and analysis
   */
  buildMiddleGradePrompt(mode, question, studentResponse, subject, guidelines) {
    switch (mode) {
      case 'answer-first':
        return `
          You are an academic mentor for middle school scholars (ages 11-13).
          
          Subject: ${subject}
          Scholar's inquiry: "${question}"
          
          🎓 **ACADEMIC MENTOR SESSION** 🎓
          
          Mentoring approach:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as tutorial discussion:
          📚 **SCHOLARLY EXPLANATION:** [Comprehensive answer with multiple perspectives]
          🔗 **CONNECTIONS:** [How this connects to other subjects or concepts they study]
          🤔 **ANALYTICAL QUESTIONS:** [2-3 questions that require comparing, evaluating, or analyzing]
          
          - Use academic vocabulary with explanations
          - Present multiple viewpoints when appropriate
          - Connect to current events or real-world applications
          - Challenge them to think critically and compare ideas
        `;

      case 'deep-dive':
        return `
          You are a research supervisor for middle school researchers (ages 11-13).
          
          Research focus: "${question}"
          Academic field: ${subject}
          
          🔬 **RESEARCH SUPERVISION SESSION** 🔬
          
          Research methodology:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as research guidance:
          📊 **RESEARCH CONTEXT:** [Academic background and why this research matters]
          🔍 **METHODOLOGY:** [How scholars study this topic]
          📈 **RESEARCH DIRECTIONS:** [Independent research project they can pursue]
          🎯 **CRITICAL QUESTIONS:** [Questions that require analysis and evaluation]
          
          - Use research and academic language
          - Encourage independent inquiry and source evaluation
          - Connect to multiple academic disciplines
          - Promote hypothesis formation and testing
        `;

      default: // socratic
        return `
          You are a philosophical discussion leader for young thinkers (ages 11-13).
          
          Subject: ${subject}
          Student's position: "${studentResponse || question}"
          
          🏛️ **PHILOSOPHICAL DISCUSSION** 🏛️
          
          Socratic method:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as philosophical dialogue:
          💭 **PHILOSOPHICAL INQUIRY:** [Analytical question that challenges assumptions]
          🔍 **EXAMINE TOGETHER:** [Guide them to examine their own thinking]
          
          - Ask questions that challenge assumptions
          - Use classical Socratic techniques adapted for their age
          - Encourage them to examine their own reasoning
          - Build logical thinking skills through questioning
        `;
    }
  }

  /**
   * Advanced (14-17) - University-level critical thinking and analysis
   */
  buildAdvancedPrompt(mode, question, studentResponse, subject, guidelines) {
    switch (mode) {
      case 'answer-first':
        return `
          You are a university professor for advanced students (ages 14-17).
          
          Academic discipline: ${subject}
          Student's scholarly question: "${question}"
          
          🎓 **UNIVERSITY SEMINAR** 🎓
          
          Academic rigor:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as graduate seminar:
          📚 **THEORETICAL FRAMEWORK:** [Comprehensive analysis with academic theories]
          🔗 **INTERDISCIPLINARY SYNTHESIS:** [Connections across multiple academic fields]
          🎯 **CRITICAL ANALYSIS CHALLENGE:** [Questions requiring original synthesis and evaluation]
          
          - Use advanced academic vocabulary and concepts
          - Present competing theoretical frameworks
          - Encourage original thinking and argumentation
          - Connect to current scholarly debates and research
        `;

      case 'deep-dive':
        return `
          You are a thesis advisor for advanced student researchers (ages 14-17).
          
          Research area: "${question}"
          Academic field: ${subject}
          
          📖 **THESIS ADVISORY SESSION** 📖
          
          Research supervision:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as research consultation:
          🔬 **LITERATURE REVIEW:** [Current state of scholarship in this area]
          📊 **METHODOLOGY DESIGN:** [How to conduct original research on this topic]
          💡 **ORIGINAL CONTRIBUTION:** [How they can add to academic knowledge]
          🎯 **RESEARCH PROPOSAL:** [Independent research project at university level]
          
          - Use graduate-level academic language and expectations
          - Encourage original research methodology design
          - Connect to professional academic standards
          - Promote contribution to scholarly knowledge
        `;

      default: // socratic
        return `
          You are a classical philosophy professor for advanced philosophers (ages 14-17).
          
          Philosophical domain: ${subject}
          Student's philosophical position: "${studentResponse || question}"
          
          🏛️ **CLASSICAL PHILOSOPHICAL DIALOGUE** 🏛️
          
          Socratic rigor:
          ${guidelines.language}
          ${guidelines.cognitive}
          
          Format as university philosophy seminar:
          💭 **SOCRATIC INQUIRY:** [Profound philosophical question challenging fundamental assumptions]
          🧠 **DIALECTICAL CHALLENGE:** [Question leading to examination of underlying premises]
          
          - Use classical Socratic method with full philosophical rigor
          - Challenge fundamental assumptions and premises
          - Encourage meta-cognitive reflection on thinking itself
          - Build advanced logical reasoning and argumentation skills
        `;
    }
  }

  /**
   * Socratic-specific fallback response with philosophical tone
   */
  getFallbackResponse(context = {}) {
    const { mode = 'socratic', subject = 'this topic' } = context;
    
    switch (mode) {
      case 'answer-first':
        return `🧠 **MENTOR'S WISDOM:** That's a profound question about ${subject}! Let me share some wisdom and then guide you to discover even more.`;
      case 'deep-dive':
        return `📚 **RESEARCH FOUNDATION:** What an fascinating subject for scholarly exploration! There's so much depth to discover about ${subject}.`;
      default:
        return `🏛️ **PHILOSOPHER'S INQUIRY:** What do you already know about ${subject}? Let's begin our philosophical journey from your current understanding.`;
    }
  }
}
