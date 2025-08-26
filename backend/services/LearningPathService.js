/**
 * Learning Path Service
 * Manages structured learning journeys for deep topic exploration
 */

import { Logger } from '../utils/Logger.js';

export class LearningPathService {
  constructor(openaiClient = null) {
    this.activePaths = new Map(); // threadId -> learningPath
    this.openaiClient = openaiClient;
  }

  /**
   * Generate a structured learning path for a topic
   */
  async generateLearningPath(topic, ageGroup, openaiClient) {
    try {
      Logger.info('Generating learning path', { topic, ageGroup });

      const ageConfig = this.getDetailedAgeConfig(ageGroup);
      const prompt = this.buildAgeSpecificLearningPrompt(topic, ageGroup, ageConfig);

      Logger.info('Using age-specific learning configuration', { 
        ageGroup, 
        steps: ageConfig.stepsCount,
        complexity: ageConfig.complexity,
        approach: ageConfig.learningApproach
      });

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational curriculum designer specializing in age-differentiated learning paths. 

AGE GROUP: ${ageGroup} - ${ageConfig.description}
LEARNING APPROACH: ${ageConfig.learningApproach}
COMPLEXITY LEVEL: ${ageConfig.complexity}
ATTENTION SPAN: ${ageConfig.attentionSpan}

Create content that matches their cognitive development stage. Always respond with valid JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: ageConfig.creativity,
        max_tokens: ageConfig.responseLength
      });

      const pathData = JSON.parse(completion.choices[0].message.content);
      
      Logger.info('Learning path generated successfully', { 
        topic, 
        stepsCount: pathData.steps.length 
      });

      return pathData;

    } catch (error) {
      Logger.error('Error generating learning path:', error);
      throw new Error('Failed to generate learning path');
    }
  }

  /**
   * Start a new learning journey for a thread
   */
  async startLearningJourney(threadId, topic, ageGroup, openaiClient) {
    try {
      // Create a quick first step immediately without generating the full path
      const quickFirstStep = this.generateQuickFirstStep(topic, ageGroup);
      
      const journey = {
        threadId,
        topic,
        ageGroup,
        title: quickFirstStep.title,
        steps: [quickFirstStep], // Start with just the first step
        currentStep: 0,
        startedAt: new Date(),
        status: 'active',
        studentResponses: [],
        nudgeCount: 0,
        fullPathGenerated: false, // Flag to track if full path is ready
        openaiClient // Store client for later use
      };

      this.activePaths.set(threadId, journey);
      
      // Generate the full learning path in the background (non-blocking)
      this.generateFullPathInBackground(threadId, topic, ageGroup, openaiClient)
        .catch(error => {
          Logger.error('Background path generation failed:', error);
          // Fallback: journey continues with on-demand step generation
        });
      
      Logger.info('Learning journey started with quick first step', { 
        threadId, 
        topic, 
        quickStart: true 
      });
      
      return journey;

    } catch (error) {
      Logger.error('Error starting learning journey:', error);
      throw error;
    }
  }

  /**
   * Generate a quick first step immediately without full path generation
   */
  generateQuickFirstStep(topic, ageGroup) {
    const ageConfig = this.getDetailedAgeConfig(ageGroup);
    
    // Pre-defined engaging starter questions by age group
    const starterTemplates = {
      '5-7': {
        questions: [
          `What do you already know about this topic?`,
          `Have you ever seen this before? Where?`,
          `What makes you curious about this?`
        ],
        content: `Let's explore this topic together! We'll discover amazing things step by step.`
      },
      '8-10': {
        questions: [
          `What comes to mind when you think about this topic?`,
          `Can you think of any examples of this in your daily life?`,
          `What would you like to discover about this topic?`
        ],
        content: `Welcome to our learning adventure! We'll explore this topic through interesting questions and discoveries.`
      },
      '11-13': {
        questions: [
          `What do you think you already know about this topic?`,
          `What questions do you have about this topic?`,
          `How do you think this topic might connect to other things you've learned?`
        ],
        content: `Let's begin our exploration. We'll build understanding through guided discovery and critical thinking.`
      },
      '14-17': {
        questions: [
          `What assumptions might you have about this topic?`,
          `How do you think this topic relates to real-world applications?`,
          `What would you hypothesize about this topic based on your current knowledge?`
        ],
        content: `We're starting a structured investigation. We'll examine this topic analytically and build comprehensive understanding.`
      }
    };

    const template = starterTemplates[ageGroup] || starterTemplates['8-10'];
    const randomQuestion = template.questions[Math.floor(Math.random() * template.questions.length)];
    
    return {
      stepNumber: 1,
      totalSteps: ageConfig.stepsCount, // Estimated total steps
      title: `Exploring: ${topic}`,
      content: `${template.content} Today we're exploring: "${topic}"`,
      question: randomQuestion,
      progress: Math.round(100 / ageConfig.stepsCount),
      type: 'learning_path_start',
      quickGenerated: true // Flag to indicate this was quickly generated
    };
  }

  /**
   * Generate the full learning path in the background (non-blocking)
   */
  async generateFullPathInBackground(threadId, topic, ageGroup, openaiClient) {
    try {
      Logger.info('Starting background full path generation', { threadId, topic });
      
      // Generate the full structured learning path
      const fullLearningPath = await this.generateLearningPath(topic, ageGroup, openaiClient);
      
      // Update the journey with the full path
      const journey = this.activePaths.get(threadId);
      if (journey && journey.status === 'active') {
        // Replace the quick first step with the properly generated first step
        journey.steps = fullLearningPath.steps;
        journey.title = fullLearningPath.title;
        journey.fullPathGenerated = true;
        
        Logger.info('Background path generation completed', { 
          threadId, 
          stepsCount: fullLearningPath.steps.length 
        });
      }
      
    } catch (error) {
      Logger.error('Background path generation failed:', error);
      // Journey can continue with on-demand generation as fallback
    }
  }

  /**
   * Get the current step content for a learning journey
   */
  getCurrentStepContent(threadId) {
    const journey = this.activePaths.get(threadId);
    if (!journey || journey.status !== 'active') {
      return null;
    }

    const currentStep = journey.steps[journey.currentStep];
    if (!currentStep) {
      return null;
    }

    return {
      stepNumber: currentStep.stepNumber,
      title: currentStep.title,
      content: currentStep.content,
      question: currentStep.question,
      questionType: currentStep.questionType,
      totalSteps: journey.steps.length,
      progress: Math.round(((journey.currentStep + 1) / journey.steps.length) * 100)
    };
  }

  /**
   * Process student answer and provide feedback
   */
  async processAnswer(threadId, studentAnswer, openaiClient) {
    try {
      const journey = this.activePaths.get(threadId);
      if (!journey || journey.status !== 'active') {
        return null;
      }

      const currentStep = journey.steps[journey.currentStep];
      if (!currentStep) {
        return null;
      }

      // Check if answer is off-topic
      const isOnTopic = await this.checkAnswerRelevance(
        studentAnswer, 
        currentStep.question, 
        journey.topic,
        openaiClient
      );

      if (!isOnTopic) {
        journey.nudgeCount++;
        
        if (journey.nudgeCount >= 3) {
          // Allow abandonment after 3 nudges
          return {
            type: 'abandon_option',
            feedback: `I notice you're interested in other things right now. That's okay! We can stop our ${journey.topic} learning journey here. Would you like to explore something else instead, or should we continue with our lesson?`,
            canAbandon: true
          };
        }

        return {
          type: 'nudge',
          feedback: `That's an interesting thought! But let's stay focused on our ${journey.topic} lesson for now. Can you try answering: ${currentStep.question}`,
          nudgeCount: journey.nudgeCount
        };
      }

      // Evaluate the answer
      const feedback = await this.evaluateAnswer(
        studentAnswer,
        currentStep,
        journey.topic,
        journey.ageGroup,
        openaiClient
      );

      // Store the response
      journey.studentResponses.push({
        stepNumber: currentStep.stepNumber,
        question: currentStep.question,
        answer: studentAnswer,
        feedback: feedback.message,
        score: feedback.score,
        timestamp: new Date()
      });

      // Reset nudge count on successful answer
      journey.nudgeCount = 0;

      return {
        type: 'feedback',
        feedback: feedback.message,
        score: feedback.score,
        isCorrect: feedback.isCorrect,
        canProceed: true
      };

    } catch (error) {
      Logger.error('Error processing answer:', error);
      return {
        type: 'error',
        feedback: 'I had trouble understanding your answer. Could you try explaining it differently?'
      };
    }
  }

  /**
   * Move to the next step in the learning journey
   */
  async moveToNextStep(threadId) {
    const journey = this.activePaths.get(threadId);
    if (!journey || journey.status !== 'active') {
      return null;
    }

    journey.currentStep++;

    // Check if we need the next step but full path isn't generated yet
    if (journey.currentStep >= journey.steps.length && !journey.fullPathGenerated) {
      Logger.info('Generating next step on-demand', { threadId, stepNumber: journey.currentStep + 1 });
      
      // Generate the next step on-demand
      const nextStep = await this.generateNextStepOnDemand(journey);
      if (nextStep) {
        journey.steps.push(nextStep);
      }
    }

    // Check if journey is complete
    if (journey.currentStep >= journey.steps.length) {
      journey.status = 'completed';
      journey.completedAt = new Date();

      Logger.info('Learning journey completed', { 
        threadId, 
        topic: journey.topic,
        duration: journey.completedAt - journey.startedAt 
      });

      return {
        type: 'completion',
        message: journey.completionMessage || `Great job exploring ${journey.topic}! You've completed your learning journey.`,
        practiceQuestions: journey.practiceQuestions || [],
        summary: this.generateJourneySummary(journey),
        nextTopics: await this.generateNextTopicSuggestions(journey.topic, journey.ageGroup)
      };
    }

    // Return next step
    return {
      type: 'next_step',
      ...this.getCurrentStepContent(threadId)
    };
  }

  /**
   * Generate the next step on-demand when full path isn't ready
   */
  async generateNextStepOnDemand(journey) {
    try {
      const ageConfig = this.getDetailedAgeConfig(journey.ageGroup);
      const stepNumber = journey.currentStep + 1;
      
      // Use the student's previous responses to inform the next question
      const previousResponses = journey.studentResponses.slice(-2); // Last 2 responses
      const conversationContext = previousResponses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n');
      
      const prompt = `
Continue the Socratic learning journey about "${journey.topic}" for ${journey.ageGroup} year olds.

Previous conversation:
${conversationContext}

Generate the next step (step ${stepNumber}) that:
- Builds on previous responses
- Uses ${ageConfig.vocabulary} vocabulary
- Asks engaging questions appropriate for ${journey.ageGroup} year olds
- Follows Socratic method principles

Respond with JSON format:
{
  "content": "Brief engaging explanation",
  "question": "Thought-provoking question that builds on previous responses"
}`;

      const response = await journey.openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      });

      const stepData = JSON.parse(response.choices[0].message.content);
      
      return {
        stepNumber: stepNumber,
        totalSteps: ageConfig.stepsCount,
        title: `Step ${stepNumber}`,
        content: stepData.content,
        question: stepData.question,
        progress: Math.round((stepNumber / ageConfig.stepsCount) * 100),
        type: 'learning_path_continue',
        onDemandGenerated: true
      };
      
    } catch (error) {
      Logger.error('On-demand step generation failed:', error);
      return null;
    }
  }

  /**
   * Abandon the current learning journey
   */
  abandonJourney(threadId, reason = 'user_choice') {
    const journey = this.activePaths.get(threadId);
    if (!journey) {
      return null;
    }

    journey.status = 'abandoned';
    journey.abandonedAt = new Date();
    journey.abandonReason = reason;

    const completedSteps = journey.currentStep;
    const totalSteps = journey.steps.length;
    const completionPercent = Math.round((completedSteps / totalSteps) * 100);

    Logger.info('Learning journey abandoned', { 
      threadId, 
      topic: journey.topic,
      completionPercent 
    });

    return {
      type: 'abandoned',
      message: `No worries! We covered ${completedSteps} out of ${totalSteps} steps (${completionPercent}%) of our ${journey.topic} journey. You learned some great things! What would you like to explore next?`,
      completionPercent,
      stepsCompleted: completedSteps
    };
  }

  /**
   * Get information about a learning journey (active, completed, or abandoned)
   */
  getJourneyInfo(threadId) {
    const journey = this.activePaths.get(threadId);
    if (!journey) {
      return null;
    }

    const totalSteps = journey.steps.length;
    const completedSteps = journey.currentStep;
    const completionPercent = Math.round((completedSteps / totalSteps) * 100);

    return {
      threadId,
      topic: journey.topic,
      status: journey.status,
      currentStep: journey.currentStep,
      totalSteps,
      completedSteps,
      completionPercent,
      startedAt: journey.startedAt,
      completedAt: journey.completedAt,
      abandonedAt: journey.abandonedAt,
      abandonReason: journey.abandonReason
    };
  }

  /**
   * Generate follow-up topic suggestions based on completed learning journey
   */
  async generateNextTopicSuggestions(completedTopic, ageGroup) {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not available for generating next topic suggestions');
    }

    try {
      const ageConfig = this.getAgeConfig(ageGroup);
      
      const prompt = `A student just completed a learning journey about "${completedTopic}". 

Student Age Group: ${ageGroup} (${ageConfig.description})
Learning Level: ${ageConfig.vocabularyLevel}

Create 3 specific follow-up topics that go DEEPER into "${completedTopic}". Each must:
1. Build directly on concepts from "${completedTopic}" - stay in the same subject area
2. Take understanding to the next level (advanced applications, deeper concepts, real-world uses)
3. Be appropriate for ${ageGroup} year olds
4. Be presented as a specific, engaging question

Examples:
- Topic: "What are fractions?" → "How do chefs use fractions in cooking?", "How do fractions help us share things fairly?", "What happens when we multiply fractions?"
- Topic: "How do plants grow?" → "How do plants survive in the desert?", "How do plants make their own food?", "How do plants communicate with each other?"

Return ONLY this JSON format (no markdown, no extra text):
{
  "suggestions": [
    {
      "topic": "Specific question about deeper aspect of ${completedTopic}",
      "description": "How this advances their knowledge of ${completedTopic}",
      "difficulty": "intermediate",
      "estimatedSteps": 5
    },
    {
      "topic": "Another specific question about different aspect of ${completedTopic}",
      "description": "How this deepens understanding of ${completedTopic}",
      "difficulty": "intermediate", 
      "estimatedSteps": 5
    },
    {
      "topic": "Third specific question about practical application of ${completedTopic}",
      "description": "How this applies ${completedTopic} to real life",
      "difficulty": "intermediate",
      "estimatedSteps": 5
    }
  ]
}`;

      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an educational AI that creates engaging follow-up learning paths for curious students. Return ONLY valid JSON without any markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      });

      let responseText = completion.choices[0].message.content.trim();
      
      // Handle markdown code blocks if they exist
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const response = JSON.parse(responseText);
      return response.suggestions || [];
    } catch (error) {
      Logger.error('Error generating next topic suggestions:', error);
      // Don't provide fallback - let the error surface so we can fix it
      throw error;
    }
  }

  /**
   * Build age-specific learning prompt with dramatically different approaches
   */
  buildAgeSpecificLearningPrompt(topic, ageGroup, ageConfig) {
    const baseStructure = `
      Return a JSON object with this structure:
      {
        "topic": "${topic}",
        "ageGroup": "${ageGroup}",
        "estimatedDuration": "${ageConfig.duration}",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Step title",
            "content": "Information to share",
            "question": "One specific question about this content",
            "questionType": "factual|subjective|application",
            "expectedAnswer": "Brief description of what constitutes a good answer",
            "hints": ["Hint 1 if child struggles", "Hint 2"]
          }
        ],
        "completionMessage": "Age-appropriate congratulation message",
        "practiceQuestions": [
          "Practice question 1",
          "Practice question 2", 
          "Practice question 3"
        ]
      }`;

    if (ageGroup === '5-7') {
      return `Create a super simple learning path about "${topic}" for 5-7 year olds (kindergarten-1st grade).

CRITICAL REQUIREMENTS:
- ONLY ${ageConfig.stepsCount} very short steps
- Each step = 1-2 sentences maximum
- Use simple words a 6-year-old knows
- Make it fun with animals, colors, or characters they love
- Every explanation should be like telling a story
- Questions should be YES/NO or "What do you see?" type
- No abstract concepts - everything must be touchable/visible

APPROACH:
- Start with "Let's pretend..." or "Imagine..." 
- Use lots of emojis and excitement
- Compare everything to toys, animals, or family
- Make it feel like a game, not a lesson
- Each step should feel like discovering something magical

${baseStructure}`;

    } else if (ageGroup === '8-10') {
      return `Create a learning path about "${topic}" for 8-10 year olds (2nd-4th grade).

CRITICAL REQUIREMENTS:
- ${ageConfig.stepsCount} clear steps that build on each other
- Use school-appropriate vocabulary but explain new words
- Mix concrete examples with beginning "why" questions
- Include hands-on activities they can imagine doing
- Make connections to their everyday experiences (school, home, friends)
- Questions should test understanding and application

APPROACH:
- Start with something they already know, then expand
- Use analogies to things from their world (classroom, playground, family)
- Include step-by-step thinking processes
- Make them feel like young scientists or explorers
- Balance fun with learning - not baby-ish but still engaging

${baseStructure}`;

    } else if (ageGroup === '11-13') {
      return `Create a learning path about "${topic}" for 11-13 year olds (5th-7th grade).

CRITICAL REQUIREMENTS:
- ${ageConfig.stepsCount} sophisticated steps with logical connections
- Use subject-specific vocabulary with clear definitions
- Include cause-and-effect relationships and systems thinking
- Ask analytical questions that require reasoning
- Connect to broader concepts and real-world applications
- Encourage them to think critically and form opinions

APPROACH:
- Present information like they're capable students (no baby talk)
- Include multiple perspectives and complexity
- Ask them to analyze, compare, and evaluate
- Connect to current events, technology, or issues they care about
- Challenge them intellectually while providing support
- Make them feel like junior experts

${baseStructure}`;

    } else { // 14-17
      return `Create a learning path about "${topic}" for 14-17 year olds (8th-12th grade).

CRITICAL REQUIREMENTS:
- ${ageConfig.stepsCount} advanced steps with theoretical depth
- Use academic vocabulary and complex concepts
- Include abstract thinking, philosophical questions, and meta-cognition
- Ask evaluative and synthesis-level questions
- Connect to career applications, college prep, and life skills
- Encourage independent research and critical analysis

APPROACH:
- Treat them as emerging adults with sophisticated thinking
- Present competing theories and ask them to evaluate evidence
- Include ethical considerations and real-world implications
- Ask them to create, design, or propose solutions
- Connect to their future goals and identity development
- Challenge assumptions and encourage original thinking

${baseStructure}`;
    }
  }

  /**
   * Get detailed age-specific configuration for learning paths
   */
  getDetailedAgeConfig(ageGroup) {
    const configs = {
      '5-7': {
        description: 'Early learners discovering the world',
        stepsCount: 3,
        complexity: 'very simple',
        learningApproach: 'play-based discovery with stories and characters',
        attentionSpan: '5-8 minutes total',
        duration: '5-8 minutes',
        vocabulary: 'kindergarten level (500-1000 words)',
        questionTypes: 'yes/no, what do you see, which one',
        examples: 'toys, animals, family, colors, shapes',
        responseLength: 800,
        creativity: 0.9,
        feedbackStyle: 'enthusiastic praise with simple words and emojis',
        encouragementStyle: 'celebrate effort and curiosity like a proud parent',
        // Quiz-specific settings
        quizQuestionCount: 3,
        quizQuestionTypes: 'simple multiple choice with pictures, yes/no questions',
        quizComplexity: 'very basic with familiar examples'
      },
      '8-10': {
        description: 'Elementary students building foundations',
        stepsCount: 4,
        complexity: 'concrete with beginning abstract concepts',
        learningApproach: 'guided exploration with hands-on connections',
        attentionSpan: '10-15 minutes',
        duration: '10-15 minutes', 
        vocabulary: 'elementary level with explanations',
        questionTypes: 'how, why (simple), what happens if',
        examples: 'school experiences, nature, community helpers',
        responseLength: 1200,
        creativity: 0.8,
        feedbackStyle: 'encouraging explanation that builds understanding',
        encouragementStyle: 'supportive teacher helping them grow as learners',
        // Quiz-specific settings
        quizQuestionCount: 4,
        quizQuestionTypes: 'multiple choice, true/false, simple application questions',
        quizComplexity: 'elementary level testing understanding and application'
      },
      '11-13': {
        description: 'Middle schoolers developing analytical skills',
        stepsCount: 5,
        complexity: 'intermediate with system connections',
        learningApproach: 'problem-solving with multiple perspectives',
        attentionSpan: '15-20 minutes',
        duration: '15-20 minutes',
        vocabulary: 'grade-level academic vocabulary',
        questionTypes: 'analyze, compare, explain why, predict',
        examples: 'current events, technology, social issues',
        responseLength: 1600,
        creativity: 0.7,
        feedbackStyle: 'constructive analysis that builds critical thinking',
        encouragementStyle: 'respect their developing independence and capability',
        // Quiz-specific settings
        quizQuestionCount: 4,
        quizQuestionTypes: 'multiple choice, analysis questions, connection questions',
        quizComplexity: 'intermediate level requiring reasoning and connections'
      },
      '14-17': {
        description: 'High schoolers ready for complex thinking',
        stepsCount: 6,
        complexity: 'advanced with theoretical depth',
        learningApproach: 'independent analysis and synthesis',
        attentionSpan: '20-30 minutes',
        duration: '20-30 minutes',
        vocabulary: 'advanced academic and professional terms',
        questionTypes: 'evaluate, synthesize, create, what if',
        examples: 'career applications, research, global issues',
        responseLength: 2000,
        creativity: 0.6,
        feedbackStyle: 'sophisticated academic discourse with intellectual challenge',
        encouragementStyle: 'treat as emerging adult scholars capable of deep thinking',
        // Quiz-specific settings
        quizQuestionCount: 4,
        quizQuestionTypes: 'multiple choice, analysis, synthesis, evaluation questions',
        quizComplexity: 'advanced level requiring critical thinking and synthesis'
      }
    };

    return configs[ageGroup] || configs['8-10'];
  }

  /**
   * Get age-appropriate configuration (simplified for backward compatibility)
   */
  getAgeConfig(ageGroup) {
    const ageConfigs = {
      '5-7': {
        description: 'Early elementary students',
        vocabularyLevel: 'Simple words and concepts',
        maxSteps: 4
      },
      '8-10': {
        description: 'Elementary students', 
        vocabularyLevel: 'Age-appropriate vocabulary with explanations',
        maxSteps: 5
      },
      '11-13': {
        description: 'Middle school students',
        vocabularyLevel: 'More sophisticated vocabulary and concepts',
        maxSteps: 6
      },
      '14-17': {
        description: 'High school students',
        vocabularyLevel: 'Advanced vocabulary and complex concepts',
        maxSteps: 7
      }
    };
    
    return ageConfigs[ageGroup] || ageConfigs['8-10'];
  }

  /**
   * Check if student answer is relevant to the current question
   */
  async checkAnswerRelevance(studentAnswer, question, topic, openaiClient) {
    try {
      const prompt = `Is this student answer relevant to the question about ${topic}?

Question: "${question}"
Student Answer: "${studentAnswer}"

Return only "true" if the answer attempts to address the question (even if incorrect), or "false" if it's completely off-topic.`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are evaluating if a student answer is relevant to a question. Be lenient - consider answers relevant if they show any attempt to engage with the topic.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return completion.choices[0].message.content.toLowerCase().includes('true');

    } catch (error) {
      Logger.error('Error checking answer relevance:', error);
      return true; // Default to relevant to avoid blocking learning
    }
  }

  /**
   * Evaluate student answer and provide feedback
   */
  async evaluateAnswer(studentAnswer, step, topic, ageGroup, openaiClient) {
    try {
      const ageConfig = this.getDetailedAgeConfig(ageGroup);
      const prompt = this.buildAgeSpecificEvaluationPrompt(studentAnswer, step, topic, ageGroup, ageConfig);

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a supportive teacher providing age-appropriate feedback to a ${ageGroup} year old student.

FEEDBACK STYLE FOR ${ageGroup}: ${ageConfig.feedbackStyle}
VOCABULARY LEVEL: ${ageConfig.vocabulary}
ENCOURAGEMENT APPROACH: ${ageConfig.encouragementStyle}

Always be encouraging and constructive while matching their developmental level.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const feedback = JSON.parse(completion.choices[0].message.content);
      return feedback;

    } catch (error) {
      Logger.error('Error evaluating answer:', error);
      return this.getAgeAppropriateDefaultFeedback(ageGroup);
    }
  }

  /**
   * Build age-specific evaluation prompt
   */
  buildAgeSpecificEvaluationPrompt(studentAnswer, step, topic, ageGroup, ageConfig) {
    const baseScoring = `
Scoring Guidelines:
- 80-100: Fully correct, shows good understanding  
- 50-79: Partially correct, on the right track but needs improvement
- 0-49: Incorrect or shows misunderstanding`;

    if (ageGroup === '5-7') {
      return `A 5-7 year old is learning about ${topic} and just answered a question.

Question: "${step.question}"
Child's Answer: "${studentAnswer}"

For this age group:
- ANY attempt to answer should be praised enthusiastically 
- Use simple words and lots of excitement (emojis, "Wow!", "Great job!")
- Focus on effort rather than being perfectly correct
- Be like a cheering parent/teacher
- Keep feedback very short (1-2 sentences)

${baseScoring}

{
  "message": "Super encouraging feedback with simple words and excitement",
  "isCorrect": true/false (true only for scores 80+),
  "score": 0-100 (be generous - effort counts a lot!)
}`;

    } else if (ageGroup === '8-10') {
      return `An 8-10 year old is learning about ${topic} and just answered a question.

Question: "${step.question}"
Child's Answer: "${studentAnswer}"

For this age group:
- Acknowledge their thinking process
- Use encouraging but age-appropriate language
- Explain WHY their answer is right/wrong in simple terms
- Give them credit for good reasoning even if conclusion is wrong
- Help them see the next step in their thinking

${baseScoring}

{
  "message": "Encouraging feedback that explains their thinking",
  "isCorrect": true/false (true only for scores 80+),
  "score": 0-100 
}`;

    } else if (ageGroup === '11-13') {
      return `An 11-13 year old is learning about ${topic} and just answered a question.

Question: "${step.question}"
Student's Answer: "${studentAnswer}"

For this age group:
- Treat them as capable learners who can handle constructive feedback
- Point out both strengths and areas for improvement
- Ask them to think deeper or consider other perspectives
- Use subject-appropriate vocabulary
- Help them build confidence in analytical thinking

${baseScoring}

{
  "message": "Constructive feedback that builds analytical skills",
  "isCorrect": true/false (true only for scores 80+),
  "score": 0-100
}`;

    } else { // 14-17
      return `A 14-17 year old is learning about ${topic} and just answered a question.

Question: "${step.question}"
Student's Answer: "${studentAnswer}"

For this age group:
- Provide sophisticated, respectful feedback
- Acknowledge the complexity of their thinking
- Challenge them to consider multiple perspectives or implications
- Use academic language and higher-order thinking prompts
- Prepare them for college-level analysis

${baseScoring}

{
  "message": "Sophisticated feedback that challenges higher-order thinking",
  "isCorrect": true/false (true only for scores 80+), 
  "score": 0-100
}`;
    }
  }

  /**
   * Get age-appropriate default feedback when evaluation fails
   */
  getAgeAppropriateDefaultFeedback(ageGroup) {
    const defaults = {
      '5-7': {
        message: "Wow! 🌟 You're thinking so hard! That shows you're learning. Let's keep going together!",
        isCorrect: true,
        score: 75
      },
      '8-10': {
        message: "Thanks for sharing your thinking! I can see you're working through this topic. Let's continue our exploration!",
        isCorrect: true,
        score: 75
      },
      '11-13': {
        message: "I appreciate you taking time to think through that question. Your reasoning shows you're engaging with the material. Let's build on that!",
        isCorrect: true,
        score: 75
      },
      '14-17': {
        message: "Your response demonstrates thoughtful consideration of the topic. This kind of analytical thinking is exactly what deep learning requires.",
        isCorrect: true,
        score: 75
      }
    };

    return defaults[ageGroup] || defaults['8-10'];
  }

  /**
   * Generate a summary of the learning journey
   */
  generateJourneySummary(journey) {
    const totalQuestions = journey.studentResponses.length;
    const averageScore = totalQuestions > 0 
      ? Math.round(journey.studentResponses.reduce((sum, r) => sum + r.score, 0) / totalQuestions)
      : 0;

    return {
      topic: journey.topic,
      stepsCompleted: journey.studentResponses.length,
      totalSteps: journey.steps.length,
      averageScore,
      duration: journey.completedAt 
        ? Math.round((journey.completedAt - journey.startedAt) / 1000 / 60) 
        : 0,
      strengths: this.identifyStrengths(journey.studentResponses),
      achievements: this.generateAchievements(journey)
    };
  }

  /**
   * Identify student strengths from their responses
   */
  identifyStrengths(responses) {
    const strengths = [];
    
    if (responses.length > 0) {
      const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
      
      if (avgScore >= 80) strengths.push("Excellent understanding");
      if (avgScore >= 60) strengths.push("Good problem solving");
      if (responses.length >= 5) strengths.push("Great persistence");
    }

    return strengths.length > 0 ? strengths : ["Curious learner"];
  }

  /**
   * Generate achievements based on performance
   */
  generateAchievements(journey) {
    const achievements = [];
    
    if (journey.status === 'completed') {
      achievements.push("🎉 Journey Completed!");
    }
    
    if (journey.studentResponses.length >= 5) {
      achievements.push("🌟 Dedicated Learner");
    }
    
    const avgScore = journey.studentResponses.length > 0 
      ? journey.studentResponses.reduce((sum, r) => sum + r.score, 0) / journey.studentResponses.length
      : 0;
      
    if (avgScore >= 80) {
      achievements.push("🧠 Quick Thinker");
    }

    return achievements;
  }

  /**
   * Get learning journey status
   */
  getJourneyStatus(threadId) {
    const journey = this.activePaths.get(threadId);
    if (!journey) {
      return null;
    }

    return {
      status: journey.status,
      currentStep: journey.currentStep + 1,
      totalSteps: journey.steps.length,
      topic: journey.topic,
      progress: Math.round(((journey.currentStep + 1) / journey.steps.length) * 100)
    };
  }

  /**
   * Generate comprehensive quiz based on accumulated learning context
   */
  async generateComprehensiveLearningQuiz(threadId, allLearningContext = []) {
    const journey = this.activePaths.get(threadId);
    if (!journey || journey.status !== 'completed') {
      throw new Error('No completed learning journey found for quiz generation');
    }

    if (!this.openaiClient) {
      throw new Error('OpenAI client not available for quiz generation');
    }

    try {
      const ageConfig = this.getDetailedAgeConfig(journey.ageGroup);
      
      // Compile all learning content from this journey + previous context
      const journeyContent = this.compileJourneyContent(journey);
      const contextContent = this.compileContextContent(allLearningContext);
      
      const prompt = this.buildComprehensiveQuizPrompt(
        journey.topic,
        journey.ageGroup,
        ageConfig,
        journeyContent,
        contextContent
      );

      Logger.info('Generating comprehensive learning quiz', {
        threadId,
        topic: journey.topic,
        ageGroup: journey.ageGroup,
        journeySteps: journey.steps.length,
        contextItems: allLearningContext.length
      });

      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational assessor creating age-appropriate quizzes for ${journey.ageGroup} year olds.

QUIZ REQUIREMENTS FOR ${journey.ageGroup}:
- Question Count: ${ageConfig.quizQuestionCount}
- Question Types: ${ageConfig.quizQuestionTypes}
- Vocabulary: ${ageConfig.vocabulary}
- Complexity: ${ageConfig.complexity}
- Response Format: Return ONLY valid JSON without markdown formatting

Create questions that test understanding across ALL the learning content provided, not just the most recent topic.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      let responseText = completion.choices[0].message.content.trim();
      
      // Handle markdown code blocks if they exist
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const quiz = JSON.parse(responseText);
      
      Logger.info('Comprehensive learning quiz generated successfully', {
        threadId,
        questionsGenerated: quiz.questions?.length || 0
      });

      return quiz;

    } catch (error) {
      Logger.error('Error generating comprehensive learning quiz:', error);
      // Don't provide fallback - let the error surface so we can fix it
      throw error;
    }
  }

  /**
   * Compile content from the completed learning journey
   */
  compileJourneyContent(journey) {
    return {
      topic: journey.topic,
      steps: journey.steps.map(step => ({
        title: step.title,
        content: step.content,
        question: step.question,
        expectedAnswer: step.expectedAnswer
      })),
      studentResponses: journey.studentResponses.map(response => ({
        question: response.question,
        answer: response.answer,
        score: response.score
      })),
      summary: this.generateJourneySummary(journey)
    };
  }

  /**
   * Compile content from previous learning context
   */
  compileContextContent(contextArray) {
    if (!Array.isArray(contextArray) || contextArray.length === 0) {
      return { topics: [], totalInteractions: 0 };
    }

    const topics = new Set();
    const keyLearnings = [];

    contextArray.forEach(item => {
      // Extract topics and learning content from context
      if (item.mode === 'learn' && item.metadata?.isLearningPath) {
        if (item.metadata.stepType === 'journey_complete') {
          topics.add(item.metadata.topic || 'Unknown Topic');
        }
        
        // Extract key learning points
        const content = typeof item.content === 'string' ? item.content : '';
        if (content.length > 50) { // Only meaningful content
          keyLearnings.push({
            content: content.substring(0, 200), // Limit length
            mode: item.mode,
            timestamp: item.timestamp
          });
        }
      }
    });

    return {
      topics: Array.from(topics),
      keyLearnings: keyLearnings.slice(-10), // Last 10 key learnings
      totalInteractions: contextArray.length
    };
  }

  /**
   * Build comprehensive quiz prompt based on all learning content
   */
  buildComprehensiveQuizPrompt(topic, ageGroup, ageConfig, journeyContent, contextContent) {
    const hasContextContent = contextContent.topics.length > 0 || contextContent.keyLearnings.length > 0;
    
    return `Create a comprehensive learning quiz for a ${ageGroup} year old student.

MAIN LEARNING JOURNEY COMPLETED:
Topic: "${topic}"
Learning Steps Covered:
${journeyContent.steps.map((step, i) => `${i + 1}. ${step.title}: ${step.content.substring(0, 150)}...`).join('\n')}

Student's Learning Progress:
${journeyContent.studentResponses.map(r => `- Q: ${r.question} | A: ${r.answer} | Score: ${r.score}%`).join('\n')}

${hasContextContent ? `
PREVIOUS LEARNING CONTEXT:
Topics Previously Explored: ${contextContent.topics.join(', ') || 'None'}
Recent Key Learnings:
${contextContent.keyLearnings.map(l => `- ${l.content.substring(0, 100)}...`).join('\n')}
` : ''}

QUIZ REQUIREMENTS:
- Create exactly ${ageConfig.quizQuestionCount} questions
- Question types: ${ageConfig.quizQuestionTypes}
- Test understanding of the ENTIRE learning journey: "${topic}"
${hasContextContent ? '- Include some questions that connect to previous learning topics' : ''}
- Use ${ageConfig.vocabulary} vocabulary level
- Questions should be ${ageConfig.complexity} complexity

Return this exact JSON format:
{
  "title": "Quiz title appropriate for ${ageGroup} year olds",
  "description": "Brief description of what this quiz tests",
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "type": "multiple_choice",
      "options": [
        {"letter": "A", "text": "Option A"},
        {"letter": "B", "text": "Option B"},
        {"letter": "C", "text": "Option C"},
        {"letter": "D", "text": "Option D"}
      ],
      "correctAnswer": "A",
      "explanation": "Age-appropriate explanation of why this is correct"
    }
  ],
  "learningObjectives": ["What students should demonstrate", "Another objective"],
  "ageGroup": "${ageGroup}",
  "totalQuestions": ${ageConfig.quizQuestionCount}
}`;
  }

  /**
   * Generate practice quiz for completed journey (DEPRECATED - use generateComprehensiveLearningQuiz)
   */
  generatePracticeQuiz(threadId) {
    const journey = this.activePaths.get(threadId);
    if (!journey || journey.status !== 'completed') {
      return null;
    }

    return {
      topic: journey.topic,
      questions: journey.practiceQuestions.slice(0, 5), // Limit to 5 questions
      type: 'practice_quiz'
    };
  }
}
