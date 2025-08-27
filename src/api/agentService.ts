// Type definitions
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: string;
  mode?: string;
  ageGroup?: string;
}

export type AgeGroup = '5-7' | '8-10' | '11-13' | '14-17';

export type SocraticMode = 
  | 'answer-first' 
  | 'question-first' 
  | 'think-aloud' 
  | 'peer-discussion'
  | 'structured-inquiry';

export type CreativeFormat = 
  | 'story' 
  | 'poem' 
  | 'song' 
  | 'script' 
  | 'comic'
  | 'presentation'
  | 'infographic'
  | 'newsletter';

export type FeedbackType = 
  | 'accuracy' 
  | 'depth' 
  | 'creativity' 
  | 'engagement'
  | 'improvement'
  | 'encouragement';

export interface AgentRequest {
  message: string;
  mode: 'explore' | 'learn' | 'create' | 'assess' | 'curriculum';
  ageGroup: AgeGroup;
  context?: ChatMessage[];
  subject?: string;
  socraticMode?: SocraticMode;
  creativeFormat?: CreativeFormat;
  feedbackType?: FeedbackType;
  curriculumBoard?: string;
  curriculumGrade?: string;
}

export interface AgentResponse {
  success: boolean;
  response: string | LearningStepResponse;
  mode: string;
  ageGroup: string;
  agent: string;
  contextLength: number;
  timestamp: string;
  error?: string;
  suggestions?: string[];
  followUpQuestions?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;
  topics?: string[];
  skills?: string[];
  type?: string; // For learning path responses
  metadata?: any; // For additional learning path data
}

export interface LearningStepResponse {
  type: 'learning_path_start' | 'learning_feedback' | 'learning_next_step' | 'learning_completion' | 'learning_abandoned' | 'practice_quiz' | 'creative' | 'exploration' | 'curriculum';
  content: string;
  question?: string;
  metadata: {
    stepNumber?: number;
    totalSteps?: number;
    progress?: number;
    title?: string;
    isLearningPath: boolean;
    isCorrect?: boolean;
    score?: number;
    canProceed?: boolean;
    practiceQuestions?: string[];
    summary?: any;
    [key: string]: any;
  };
}

export interface LearningPathRequest {
  threadId: string;
  topic: string;
  ageGroup: AgeGroup;
  action: 'start' | 'answer' | 'next' | 'abandon' | 'quiz';
  studentAnswer?: string;
  reason?: string;
}

export interface SystemMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  activeAgents: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AgentStats {
  name: string;
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  topTopics: string[];
  ageGroupDistribution: Record<AgeGroup, number>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  error?: string;
  timestamp: string;
  uptime: number;
  version: string;
}

/**
 * Educational Agent Service Class
 * Provides methods for interacting with different educational agents
 */
export class EducationalAgentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.PROD 
      ? '/api' // Vercel serverless functions
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');
  }

  /**
   * Send a unified chat request to the agent system
   */
  async sendChatRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      console.log('Sending chat request to agent system:', request);
      
      // Add timeout for consistency
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Agent response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('Agent request failed:', errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Agent response:', result);
      
      return result;
    } catch (error) {
      console.error('Agent service error:', error);
      
      // Handle specific error types for better consistency
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error.message.includes('contextMessages is not defined')) {
        console.error('Context messages error - this should not happen');
        throw new Error('Internal error. Please refresh and try again.');
      }
      
      return {
        success: false,
        response: '',
        mode: request.mode,
        ageGroup: request.ageGroup,
        agent: 'error',
        contextLength: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Curriculum-specific functions
   */
  async generateTableOfContents(subject: string, board: string, grade: string, ageGroup: AgeGroup) {
    try {
      const response = await fetch(`${this.baseUrl}/curriculum/toc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, board, grade, ageGroup }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate table of contents');
      }

      return await response.json();
    } catch (error) {
      console.error('Table of contents generation error:', error);
      throw error;
    }
  }

  async generateChapterSummary(subject: string, chapter: string, board: string, grade: string, ageGroup: AgeGroup) {
    try {
      const response = await fetch(`${this.baseUrl}/curriculum/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, chapter, board, grade, ageGroup }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate chapter summary');
      }

      return await response.json();
    } catch (error) {
      console.error('Chapter summary generation error:', error);
      throw error;
    }
  }

  async generatePracticeExercises(subject: string, topic: string, board: string, grade: string, ageGroup: AgeGroup) {
    try {
      const response = await fetch(`${this.baseUrl}/curriculum/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, topic, board, grade, ageGroup }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate practice exercises');
      }

      return await response.json();
    } catch (error) {
      console.error('Practice exercises generation error:', error);
      throw error;
    }
  }

  /**
   * Get system metrics and performance data
   */
  async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      
      if (!response.ok) {
        console.error('Failed to fetch system metrics');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return null;
    }
  }

  /**
   * Get statistics for a specific agent
   */
  async getAgentStats(agentName: string): Promise<AgentStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentName}/stats`);
      
      if (!response.ok) {
        console.error(`Failed to fetch stats for agent: ${agentName}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching agent stats for ${agentName}:`, error);
      return null;
    }
  }

  /**
   * Check application health
   */
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        return { 
          status: 'unhealthy', 
          error: 'Health check failed',
          timestamp: new Date().toISOString(),
          uptime: 0,
          version: 'unknown'
        };
      }

      const healthData = await response.json();
      return { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        ...healthData
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        version: 'unknown'
      };
    }
  }

  /**
   * Explore topics with the ExplorationAgent
   */
  async explore(topic: string, ageGroup: AgeGroup, context?: ChatMessage[]): Promise<AgentResponse> {
    return this.sendChatRequest({
      message: topic,
      mode: 'explore',
      ageGroup,
      context
    });
  }

  /**
   * Learn with the SocraticLearningAgent
   */
  async learn(
    question: string, 
    ageGroup: AgeGroup, 
    subject?: string, 
    socraticMode: SocraticMode = 'answer-first',
    context?: ChatMessage[]
  ): Promise<AgentResponse> {
    return this.sendChatRequest({
      message: question,
      mode: 'learn',
      ageGroup,
      context,
      subject,
      socraticMode
    });
  }

  /**
   * Create content with the CreativeContentAgent
   */
  async create(
    prompt: string, 
    ageGroup: AgeGroup, 
    creativeFormat: CreativeFormat = 'story',
    context?: ChatMessage[]
  ): Promise<AgentResponse> {
    return this.sendChatRequest({
      message: prompt,
      mode: 'create',
      ageGroup,
      context,
      creativeFormat
    });
  }

  /**
   * Get feedback with the AssessmentAgent
   */
  async getFeedback(
    content: string, 
    ageGroup: AgeGroup, 
    feedbackType: FeedbackType = 'accuracy',
    context?: ChatMessage[]
  ): Promise<AgentResponse> {
    return this.sendChatRequest({
      message: content,
      mode: 'assess',
      ageGroup,
      context,
      feedbackType
    });
  }

  /**
   * Generate questions based on a topic
   */
  async generateQuestions(
    topic: string, 
    ageGroup: AgeGroup, 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    context?: ChatMessage[]
  ): Promise<AgentResponse> {
    return this.sendChatRequest({
      message: `Generate ${difficulty} level questions about: ${topic}`,
      mode: 'assess',
      ageGroup,
      context
    });
  }

  /**
   * Check MCP agents health
   */
  async checkMCPHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/files/health`);
      
      if (!response.ok) {
        throw new Error('Failed to check MCP health');
      }

      return await response.json();
    } catch (error) {
      console.error('MCP health check error:', error);
      throw error;
    }
  }

  /**
   * Start a structured learning journey for deep topic exploration
   */
  async startLearningJourney(
    threadId: string,
    topic: string,
    ageGroup: AgeGroup
  ): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Start learning journey about: ${topic}`,
          mode: 'learn',
          ageGroup: ageGroup,
          threadId: threadId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start learning journey');
      }

      return await response.json();
    } catch (error) {
      console.error('Learning journey start error:', error);
      throw error;
    }
  }

  /**
   * Process student answer in learning journey
   */
  async processLearningAnswer(
    threadId: string,
    studentAnswer: string,
    ageGroup: AgeGroup
  ): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          studentAnswer,
          ageGroup,
          action: 'answer'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process learning answer');
      }

      return await response.json();
    } catch (error) {
      console.error('Learning answer processing error:', error);
      throw error;
    }
  }

  /**
   * Continue to next step in learning journey
   */
  async continueToNextStep(threadId: string): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          action: 'next'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to continue to next step');
      }

      return await response.json();
    } catch (error) {
      console.error('Next step error:', error);
      throw error;
    }
  }

  /**
   * Abandon current learning journey
   */
  async abandonLearningJourney(
    threadId: string,
    reason: string = 'user_choice'
  ): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          reason,
          action: 'abandon'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to abandon learning journey');
      }

      return await response.json();
    } catch (error) {
      console.error('Learning journey abandon error:', error);
      throw error;
    }
  }

  /**
   * Start a follow-up learning journey
   */
  async startFollowUpJourney(
    threadId: string,
    topic: string,
    ageGroup: AgeGroup
  ): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          topic,
          ageGroup,
          action: 'follow-up'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start follow-up journey');
      }

      return await response.json();
    } catch (error) {
      console.error('Follow-up journey error:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive practice quiz for completed learning journey
   */
  async generateLearningQuiz(threadId: string, learningContext: any[] = []): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          action: 'quiz',
          context: learningContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate learning quiz');
      }

      return await response.json();
    } catch (error) {
      console.error('Learning quiz generation error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const agentServiceInstance = new EducationalAgentService();

// Export singleton
export const agentService = agentServiceInstance;

// Export individual methods
export const explore = agentServiceInstance.explore.bind(agentServiceInstance);
export const learn = agentServiceInstance.learn.bind(agentServiceInstance);
export const create = agentServiceInstance.create.bind(agentServiceInstance);
export const getFeedback = agentServiceInstance.getFeedback.bind(agentServiceInstance);
export const generateQuestions = agentServiceInstance.generateQuestions.bind(agentServiceInstance);
export const generateTableOfContents = agentServiceInstance.generateTableOfContents.bind(agentServiceInstance);
export const generateChapterSummary = agentServiceInstance.generateChapterSummary.bind(agentServiceInstance);
export const generatePracticeExercises = agentServiceInstance.generatePracticeExercises.bind(agentServiceInstance);
export const getSystemMetrics = agentServiceInstance.getSystemMetrics.bind(agentServiceInstance);
export const getAgentStats = agentServiceInstance.getAgentStats.bind(agentServiceInstance);
export const checkHealth = agentServiceInstance.checkHealth.bind(agentServiceInstance);
export const checkMCPHealth = agentServiceInstance.checkMCPHealth.bind(agentServiceInstance);

// Export new learning path methods
export const startLearningJourney = agentServiceInstance.startLearningJourney.bind(agentServiceInstance);
export const processLearningAnswer = agentServiceInstance.processLearningAnswer.bind(agentServiceInstance);
export const continueToNextStep = agentServiceInstance.continueToNextStep.bind(agentServiceInstance);
export const abandonLearningJourney = agentServiceInstance.abandonLearningJourney.bind(agentServiceInstance);
export const startFollowUpJourney = agentServiceInstance.startFollowUpJourney.bind(agentServiceInstance);
export const generateLearningQuiz = agentServiceInstance.generateLearningQuiz.bind(agentServiceInstance);
