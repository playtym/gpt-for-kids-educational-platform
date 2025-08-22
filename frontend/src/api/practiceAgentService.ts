import { agentService, AgentResponse, AgeGroup } from './agentService';

export interface PracticeQuestion {
  type: 'mcq' | 'longform' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  context?: string;
  rubric?: string[];
  expectedLength?: 'short' | 'medium' | 'long';
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  subject?: string;
  chapter?: string;
  topics?: string[];
}

export interface PracticeSession {
  id: string;
  board: string;
  grade: string;
  subject: string;
  chapter: string;
  questions: PracticeQuestion[];
  startTime: Date;
  endTime?: Date;
  score?: number;
  totalQuestions: number;
}

class PracticeAgentService {
  private readonly practiceAgent = 'practice-specialist';

  async generatePracticeQuestions(
    board: string,
    grade: string,
    subject: string,
    chapter: string,
    topics: string[],
    questionType: 'mixed' | 'mcq' | 'longform' = 'mixed',
    ageGroup: AgeGroup = '11-13'
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildPracticeSystemPrompt(board, grade, subject, chapter);
    const userPrompt = this.buildPracticeUserPrompt(topics, questionType, board, grade);

    try {
      const response = await agentService.sendChatRequest({
        message: userPrompt,
        mode: 'curriculum',
        ageGroup,
        socraticMode: 'question-first',
        curriculumBoard: board,
        curriculumGrade: grade,
        subject,
        context: [{
          role: 'assistant',
          content: systemPrompt,
          timestamp: new Date().toISOString(),
          mode: 'curriculum'
        }]
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to generate practice questions: ${error}`);
    }
  }

  async evaluateAnswer(
    question: PracticeQuestion,
    userAnswer: string,
    board: string,
    grade: string,
    ageGroup: AgeGroup = '11-13'
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildEvaluationSystemPrompt(board, grade);
    const userPrompt = this.buildEvaluationUserPrompt(question, userAnswer);

    try {
      const response = await agentService.sendChatRequest({
        message: userPrompt,
        mode: 'curriculum',
        ageGroup,
        socraticMode: 'question-first',
        curriculumBoard: board,
        curriculumGrade: grade,
        subject: question.subject,
        context: [{
          role: 'assistant',
          content: systemPrompt,
          timestamp: new Date().toISOString(),
          mode: 'curriculum'
        }]
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to evaluate answer: ${error}`);
    }
  }

  async generateHints(
    question: PracticeQuestion,
    board: string,
    grade: string,
    ageGroup: AgeGroup = '11-13'
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildHintSystemPrompt(board, grade);
    const userPrompt = this.buildHintUserPrompt(question);

    try {
      const response = await agentService.sendChatRequest({
        message: userPrompt,
        mode: 'curriculum',
        ageGroup,
        socraticMode: 'question-first',
        curriculumBoard: board,
        curriculumGrade: grade,
        subject: question.subject,
        context: [{
          role: 'assistant',
          content: systemPrompt,
          timestamp: new Date().toISOString(),
          mode: 'curriculum'
        }]
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to generate hints: ${error}`);
    }
  }

  private buildPracticeSystemPrompt(board: string, grade: string, subject: string, chapter: string): string {
    return `You are a specialized practice question generator for the ${board} curriculum, ${grade} level.

ROLE: Educational Practice Specialist
EXPERTISE: ${board} ${grade} ${subject} curriculum, specifically the chapter "${chapter}"

RESPONSIBILITIES:
1. Generate curriculum-aligned practice questions
2. Ensure age-appropriate difficulty and language
3. Create engaging, relevant scenarios
4. Provide clear, accurate answer explanations
5. Include proper rubrics for evaluation

QUESTION QUALITY STANDARDS:
- Align perfectly with ${board} curriculum standards
- Use grade-appropriate vocabulary and concepts
- Include real-world applications when possible
- Ensure conceptual depth appropriate for ${grade}
- Provide comprehensive explanations and rubrics

OUTPUT FORMAT REQUIREMENTS:
- Return valid JSON only
- Use specified question formats exactly
- Include all required fields for each question type
- Ensure explanations are clear and educational

ASSESSMENT PRINCIPLES:
- Focus on understanding over memorization
- Test application of concepts, not just recall
- Include progressive difficulty within the set
- Encourage critical thinking and problem-solving`;
  }

  private buildPracticeUserPrompt(
    topics: string[],
    questionType: 'mixed' | 'mcq' | 'longform',
    board: string,
    grade: string
  ): string {
    const topicList = topics.join(', ');
    
    const questionSpecs = {
      mixed: {
        count: '3 MCQ questions and 2 long-form questions',
        description: 'Mix of quick assessment and detailed understanding'
      },
      mcq: {
        count: '5 MCQ questions',
        description: 'Multiple choice for rapid concept checking'
      },
      longform: {
        count: '3 long-form questions',
        description: 'Essay-style for deep conceptual understanding'
      }
    };

    const spec = questionSpecs[questionType];

    return `Generate ${spec.count} for the following topics: ${topicList}

REQUIREMENTS:
${spec.description}

FOR MCQ QUESTIONS - Use this exact JSON format:
{
  "type": "mcq",
  "question": "Clear, specific question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct and others are wrong",
  "difficulty": "basic|intermediate|advanced",
  "topics": ["relevant", "topic", "names"]
}

FOR LONG-FORM QUESTIONS - Use this exact JSON format:
{
  "type": "longform", 
  "question": "Open-ended question requiring detailed explanation",
  "context": "Background information or scenario if needed",
  "rubric": ["Key point 1 to include", "Key point 2 to include", "Key point 3 to include"],
  "expectedLength": "short|medium|long",
  "difficulty": "basic|intermediate|advanced",
  "topics": ["relevant", "topic", "names"]
}

QUALITY CHECKLIST:
✓ Questions test understanding, not just memory
✓ Language appropriate for ${grade} students
✓ Concepts align with ${board} curriculum
✓ Real-world connections where applicable
✓ Progressive difficulty across the question set
✓ Clear, helpful explanations and rubrics

Return only a JSON array containing the questions. No additional text.`;
  }

  private buildEvaluationSystemPrompt(board: string, grade: string): string {
    return `You are an expert evaluator for ${board} ${grade} curriculum assessments.

ROLE: Educational Assessment Specialist
EXPERTISE: Fair, constructive evaluation of student responses

EVALUATION PRINCIPLES:
1. Focus on understanding demonstrated, not perfect answers
2. Recognize partial credit and good reasoning
3. Provide specific, actionable feedback
4. Encourage continued learning
5. Use age-appropriate language for ${grade} students

FEEDBACK GUIDELINES:
- Highlight what the student did well
- Identify specific areas for improvement  
- Suggest concrete next steps
- Maintain encouraging, supportive tone
- Reference curriculum standards when relevant

OUTPUT: Return JSON evaluation with score, feedback, and suggestions.`;
  }

  private buildEvaluationUserPrompt(question: PracticeQuestion, userAnswer: string): string {
    let questionContext = `QUESTION: ${question.question}`;
    
    if (question.type === 'mcq') {
      questionContext += `\nOPTIONS: ${question.options?.join(', ')}`;
      questionContext += `\nCORRECT ANSWER: ${question.options?.[question.correctAnswer || 0]}`;
    } else if (question.type === 'longform' && question.rubric) {
      questionContext += `\nEVALUATION RUBRIC: ${question.rubric.join('; ')}`;
    }

    return `${questionContext}

STUDENT ANSWER: ${userAnswer}

Evaluate this answer and provide constructive feedback.

Return JSON in this exact format:
{
  "score": 85,
  "maxScore": 100,
  "feedback": "Detailed feedback on the answer",
  "strengths": ["What the student did well"],
  "improvements": ["Specific areas to work on"],
  "grade": "A|B|C|D|F",
  "nextSteps": ["Concrete suggestions for improvement"]
}`;
  }

  private buildHintSystemPrompt(board: string, grade: string): string {
    return `You are a helpful tutor providing hints for ${board} ${grade} curriculum questions.

ROLE: Educational Hint Provider
GOAL: Guide students to discover answers themselves

HINT PRINCIPLES:
1. Don't give away the answer directly
2. Provide graduated levels of support
3. Focus on the thinking process
4. Use Socratic questioning techniques
5. Encourage student reasoning

HINT STRATEGY:
- Start with general thinking approaches
- Point toward relevant concepts
- Suggest breaking down the problem
- Ask guiding questions
- Build confidence while maintaining challenge`;
  }

  private buildHintUserPrompt(question: PracticeQuestion): string {
    let questionText = `QUESTION: ${question.question}`;
    
    if (question.topics) {
      questionText += `\nRELATED TOPICS: ${question.topics.join(', ')}`;
    }

    return `${questionText}

Generate 3 progressive hints that help a student think through this question without giving away the answer.

Return JSON in this format:
{
  "hints": [
    "Hint 1: General approach or concept to consider",
    "Hint 2: More specific guidance on method or strategy", 
    "Hint 3: Final nudge toward solution pathway"
  ],
  "keyThinking": "The main thinking skill or process this question develops"
}`;
  }

  // Utility methods for practice session management
  createPracticeSession(
    board: string,
    grade: string, 
    subject: string,
    chapter: string,
    questions: PracticeQuestion[]
  ): PracticeSession {
    return {
      id: Date.now().toString(),
      board,
      grade,
      subject,
      chapter,
      questions,
      startTime: new Date(),
      totalQuestions: questions.length
    };
  }

  completePracticeSession(session: PracticeSession, score: number): PracticeSession {
    return {
      ...session,
      endTime: new Date(),
      score
    };
  }
}

export const practiceAgentService = new PracticeAgentService();
