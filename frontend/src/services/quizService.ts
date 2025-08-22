/**
 * Quiz Generation API Service
 * Handles communication with the quiz generation endpoints
 */

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-url.com'
  : 'http://localhost:3000';

export interface QuizOptions {
  questionCount?: number;
  quizType?: 'mcq' | 'true-false' | 'short-answer' | 'mixed';
  searchEnabled?: boolean;
  includeSources?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | 'auto';
}

export interface QuizQuestion {
  id: number;
  question: string;
  options?: Array<{
    letter: string;
    text: string;
  }>;
  type: string;
}

export interface QuizAnswer {
  questionId: number;
  correctAnswer: string;
  explanation: string;
}

export interface QuizSource {
  title: string;
  snippet: string;
  url: string;
  published?: string;
  relevance?: string;
}

export interface Quiz {
  type: 'quiz';
  title: string;
  description: string;
  questions: QuizQuestion[];
  answerKey: QuizAnswer[];
  sources: QuizSource[];
  learningObjectives: string[];
  metadata: {
    generatedAt: string;
    searchResultsUsed: number;
    questionsCount: number;
    fallback?: boolean;
  };
}

export interface QuizResponse {
  success: boolean;
  quiz: Quiz;
  topic: string;
  ageGroup: string;
  timestamp: string;
  error?: string;
}

class QuizService {
  /**
   * Generate a standard quiz with web search
   */
  async generateQuiz(
    topic: string, 
    ageGroup: string, 
    context: string[] = [], 
    options: QuizOptions = {}
  ): Promise<QuizResponse> {
    const response = await fetch(`${API_BASE}/api/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        ageGroup,
        context,
        ...options
      }),
    });

    if (!response.ok) {
      throw new Error(`Quiz generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate a quick quiz without web search
   */
  async generateQuickQuiz(
    topic: string, 
    ageGroup: string, 
    questionCount: number = 3
  ): Promise<QuizResponse> {
    const response = await fetch(`${API_BASE}/api/quiz/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        ageGroup,
        questionCount
      }),
    });

    if (!response.ok) {
      throw new Error(`Quick quiz generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate a comprehensive quiz with full search
   */
  async generateComprehensiveQuiz(
    topic: string, 
    ageGroup: string, 
    context: string[] = [], 
    questionCount: number = 10
  ): Promise<QuizResponse> {
    const response = await fetch(`${API_BASE}/api/quiz/comprehensive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        ageGroup,
        context,
        questionCount
      }),
    });

    if (!response.ok) {
      throw new Error(`Comprehensive quiz generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate quiz through the unified chat API
   */
  async generateQuizViaChat(
    topic: string,
    ageGroup: string,
    context: any[] = [],
    options: QuizOptions = {}
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: topic,
        mode: 'quiz',
        ageGroup,
        context,
        ...options
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat quiz generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate quiz answers
   */
  validateAnswers(quiz: Quiz, userAnswers: { [questionId: number]: string }): {
    score: number;
    totalQuestions: number;
    percentage: number;
    results: Array<{
      questionId: number;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  } {
    const results = quiz.answerKey.map(answer => {
      const userAnswer = userAnswers[answer.questionId];
      const isCorrect = userAnswer === answer.correctAnswer;
      
      return {
        questionId: answer.questionId,
        userAnswer: userAnswer || '',
        correctAnswer: answer.correctAnswer,
        isCorrect,
        explanation: answer.explanation
      };
    });

    const score = results.filter(r => r.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return {
      score,
      totalQuestions,
      percentage,
      results
    };
  }

  /**
   * Get quiz difficulty recommendation based on age group
   */
  getRecommendedDifficulty(ageGroup: string): 'easy' | 'medium' | 'hard' {
    switch (ageGroup) {
      case '5-7':
        return 'easy';
      case '8-10':
        return 'easy';
      case '11-13':
        return 'medium';
      case '14-17':
        return 'hard';
      default:
        return 'medium';
    }
  }

  /**
   * Get recommended question count based on age group
   */
  getRecommendedQuestionCount(ageGroup: string, quizType: 'quick' | 'standard' | 'comprehensive'): number {
    const baseCounts = {
      quick: { '5-7': 3, '8-10': 3, '11-13': 3, '14-17': 3 },
      standard: { '5-7': 3, '8-10': 5, '11-13': 5, '14-17': 7 },
      comprehensive: { '5-7': 5, '8-10': 7, '11-13': 10, '14-17': 12 }
    };

    return baseCounts[quizType][ageGroup as keyof typeof baseCounts.quick] || baseCounts[quizType]['11-13'];
  }

  /**
   * Format quiz for display
   */
  formatQuizForDisplay(quiz: Quiz): {
    formattedQuiz: Quiz;
    statistics: {
      totalQuestions: number;
      hasWebSources: boolean;
      sourceCount: number;
      estimatedTime: string;
      difficulty: string;
    };
  } {
    const statistics = {
      totalQuestions: quiz.questions.length,
      hasWebSources: quiz.sources.length > 0,
      sourceCount: quiz.sources.length,
      estimatedTime: this.estimateQuizTime(quiz.questions.length),
      difficulty: this.guessDifficultyFromContent(quiz)
    };

    return {
      formattedQuiz: quiz,
      statistics
    };
  }

  /**
   * Estimate time needed to complete quiz
   */
  private estimateQuizTime(questionCount: number): string {
    const timePerQuestion = 1.5; // minutes
    const totalMinutes = Math.ceil(questionCount * timePerQuestion);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Guess difficulty level from quiz content
   */
  private guessDifficultyFromContent(quiz: Quiz): string {
    // Simple heuristic based on question and answer length
    const avgQuestionLength = quiz.questions.reduce((sum, q) => sum + q.question.length, 0) / quiz.questions.length;
    const avgExplanationLength = quiz.answerKey.reduce((sum, a) => sum + a.explanation.length, 0) / quiz.answerKey.length;
    
    if (avgQuestionLength < 50 && avgExplanationLength < 100) return 'Easy';
    if (avgQuestionLength < 100 && avgExplanationLength < 200) return 'Medium';
    return 'Hard';
  }
}

// Export singleton instance
export const quizService = new QuizService();
export default quizService;
