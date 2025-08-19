/**
 * Educational API Client for GPT for Kids
 * Connects to the backend educational endpoints with safety validation
 */

export type AgeGroup = '5-7' | '8-10' | '11-13' | '14-17';

export interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data?: T;
  error?: string;
}

export interface SocraticResponse {
  response: string;
  ageGroup: AgeGroup;
  subject: string;
}

export interface StoryResponse {
  story: string;
  topic: string;
  ageGroup: AgeGroup;
  duration: 'short' | 'medium';
}

export interface DescriptionResponse {
  description: string;
  originalImage: string;
  ageGroup: AgeGroup;
}

export interface FeedbackResponse {
  feedback: string;
  type: string;
  ageGroup: AgeGroup;
}

export interface QuestionResponse {
  question: string;
  topic: string;
  ageGroup: AgeGroup;
}

export interface SafetyCheckResponse {
  safetyResult: {
    safe: boolean;
    reason?: string;
  };
  content: string;
  ageGroup: AgeGroup;
}

class EducationalApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  private async makeRequest<T>(
    endpoint: string, 
    data: any
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making request to ${this.baseUrl}${endpoint}`, data); // Debug log
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log(`Response status for ${endpoint}:`, response.status); // Debug log
      console.log(`Response headers for ${endpoint}:`, [...response.headers.entries()]); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API Error Response for ${endpoint}:`, errorData); // Debug log
        throw new Error(errorData.error || 'API request failed');
      }

      const result = await response.json();
      console.log(`Successful response for ${endpoint}:`, result); // Debug log
      
      return {
        success: true,
        timestamp: result.timestamp,
        data: result,
      };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      console.error(`Error type:`, error instanceof Error ? error.constructor.name : typeof error); // Debug log
      console.error(`Error message:`, error instanceof Error ? error.message : String(error)); // Debug log
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSocraticResponse(
    question: string,
    subject: string,
    ageGroup: AgeGroup,
    studentResponse?: string
  ): Promise<ApiResponse<SocraticResponse>> {
    return this.makeRequest<SocraticResponse>('/api/socratic', {
      question,
      subject,
      ageGroup,
      studentResponse,
    });
  }

  async generateStory(
    topic: string,
    ageGroup: AgeGroup,
    duration: 'short' | 'medium' = 'short'
  ): Promise<ApiResponse<StoryResponse>> {
    return this.makeRequest<StoryResponse>('/api/story', {
      topic,
      ageGroup,
      duration,
    });
  }

  async describeImage(
    imageDescription: string,
    ageGroup: AgeGroup
  ): Promise<ApiResponse<DescriptionResponse>> {
    return this.makeRequest<DescriptionResponse>('/api/describe', {
      imageDescription,
      ageGroup,
    });
  }

  async provideFeedback(
    studentWork: string,
    type: string,
    ageGroup: AgeGroup
  ): Promise<ApiResponse<FeedbackResponse>> {
    return this.makeRequest<FeedbackResponse>('/api/feedback', {
      studentWork,
      type,
      ageGroup,
    });
  }

  async generateQuestion(
    topic: string,
    ageGroup: AgeGroup
  ): Promise<ApiResponse<QuestionResponse>> {
    return this.makeRequest<QuestionResponse>('/api/question', {
      topic,
      ageGroup,
    });
  }

  async checkSafety(
    content: string,
    ageGroup: AgeGroup
  ): Promise<ApiResponse<SafetyCheckResponse>> {
    return this.makeRequest<SafetyCheckResponse>('/api/safety-check', {
      content,
      ageGroup,
    });
  }

  async getServerHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return {
        success: response.ok,
        timestamp: new Date().toISOString(),
        data,
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Server unavailable',
      };
    }
  }
}

export const educationalApi = new EducationalApiClient();
