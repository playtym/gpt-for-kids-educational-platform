import { 
  Leaf, Rocket, Atom, Globe, Calculator, BookOpen, Beaker, Users, 
  Music, Palette, Wand2, Brain, Languages, History, Heart, Gamepad2,
  Camera, Lightbulb, Puzzle, Star, TreePine, Fish, Bird, Bug
} from 'lucide-react';

export interface QuickTopic {
  id: string;
  icon: any;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: string;
  category: string;
  color?: string;
  questions?: string[];
  adaptiveHints?: string[];
  nextSteps?: string[];
  personalizedAspects?: string[];
  source?: 'static' | 'llm-generated' | 'hybrid';
}

export interface AgeGroupTopics {
  explore: QuickTopic[];
  learn: QuickTopic[];
  create: QuickTopic[];
  study: QuickTopic[];
}

export type AgeGroup = '5-6' | '7-8' | '9-10' | '11-13' | '14-17';
export type Mode = 'explore' | 'learn' | 'create' | 'study';

export interface UserContext {
  userId?: string;
  history?: any[];
  preferences?: {
    favoriteSubjects?: string[];
    learningStyle?: string;
    interests?: string[];
    difficulty?: string;
  };
  currentSession?: {
    timeOfDay?: string;
    sessionLength?: string;
    previousMode?: string;
    mood?: string;
  };
}

/**
 * Base service for managing topic-related functionality
 * Provides common utilities and interfaces for all topic services
 * Enhanced with LLM-based dynamic topic generation
 */
export abstract class BaseTopicsService {
  protected apiUrl: string = '/api';
  protected fallbackTopics: Map<string, QuickTopic[]> = new Map();

  constructor() {
    this.initializeFallbackTopics();
  }

  /**
   * Enhanced method to get topics with LLM integration
   */
  async getTopicsForAge(ageGroup: AgeGroup, userContext?: UserContext): Promise<AgeGroupTopics> {
    try {
      // Try to get personalized topics from LLM first
      if (userContext?.userId) {
        const personalizedTopics = await this.generatePersonalizedTopics(ageGroup, userContext);
        if (personalizedTopics) {
          return personalizedTopics;
        }
      }

      // Fallback to static topics with some LLM enhancement
      const staticTopics = this.getStaticTopicsForAge(ageGroup);
      return await this.enhanceStaticTopics(staticTopics, ageGroup, userContext);
    } catch (error) {
      console.error('Error getting topics for age:', error);
      return this.getStaticTopicsForAge(ageGroup);
    }
  }

  /**
   * Abstract method - must be implemented by each subject service
   * This provides static/fallback topics when LLM is unavailable
   */
  abstract getStaticTopicsForAge(ageGroup: AgeGroup): AgeGroupTopics;

  /**
   * Abstract method - must be implemented by each subject service
   */
  abstract getSubjectName(): string;

  /**
   * Generate personalized topics using LLM
   */
  protected async generatePersonalizedTopics(ageGroup: AgeGroup, userContext: UserContext): Promise<AgeGroupTopics | null> {
    try {
      const response = await fetch(`${this.apiUrl}/topics/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: this.getSubjectName(),
          ageGroup,
          userContext,
          modes: ['explore', 'learn', 'create', 'study'],
          topicsPerMode: 4
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate personalized topics');
      }

      const data = await response.json();
      return this.formatLLMTopics(data.topics);
    } catch (error) {
      console.error('Failed to generate personalized topics:', error);
      return null;
    }
  }

  /**
   * Enhance static topics with LLM insights
   */
  protected async enhanceStaticTopics(staticTopics: AgeGroupTopics, ageGroup: AgeGroup, userContext?: UserContext): Promise<AgeGroupTopics> {
    if (!userContext?.userId) {
      return staticTopics;
    }

    try {
      // Get LLM suggestions for improving static topics
      const response = await fetch(`${this.apiUrl}/topics/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: this.getSubjectName(),
          ageGroup,
          staticTopics,
          userContext
        })
      });

      if (response.ok) {
        const enhanced = await response.json();
        return this.mergeEnhancedTopics(staticTopics, enhanced.enhancements);
      }
    } catch (error) {
      console.error('Failed to enhance static topics:', error);
    }

    return staticTopics;
  }

  /**
   * Format LLM-generated topics into proper structure
   */
  protected formatLLMTopics(llmTopics: any): AgeGroupTopics {
    const formattedTopics: AgeGroupTopics = {
      explore: [],
      learn: [],
      create: [],
      study: []
    };

    Object.keys(formattedTopics).forEach(mode => {
      if (llmTopics[mode]) {
        formattedTopics[mode as Mode] = llmTopics[mode].map((topic: any) => ({
          ...topic,
          icon: this.getIconFromName(topic.icon),
          source: 'llm-generated'
        }));
      }
    });

    return formattedTopics;
  }

  /**
   * Merge enhanced suggestions with static topics
   */
  protected mergeEnhancedTopics(staticTopics: AgeGroupTopics, enhancements: any): AgeGroupTopics {
    const enhanced = { ...staticTopics };

    Object.keys(enhanced).forEach(mode => {
      if (enhancements[mode]) {
        enhanced[mode as Mode] = enhanced[mode as Mode].map((topic, index) => ({
          ...topic,
          ...enhancements[mode][index],
          source: 'hybrid'
        }));
      }
    });

    return enhanced;
  }

  /**
   * Get icon component from string name
   */
  protected getIconFromName(iconName: string): any {
    const iconMap: Record<string, any> = {
      Calculator, Brain, Puzzle, Star, Gamepad2, Atom, 
      Leaf, Rocket, Globe, BookOpen, Beaker, Users,
      Music, Palette, Wand2, Languages, History, Heart,
      Camera, Lightbulb, TreePine, Fish, Bird, Bug
    };

    return iconMap[iconName] || Star;
  }

  /**
   * Initialize fallback topics for when LLM is unavailable
   */
  protected initializeFallbackTopics(): void {
    // This will be implemented by each subject service
  }

  /**
   * Abstract method - must be implemented by each subject service
   */
  abstract getStaticTopicsForAge(ageGroup: AgeGroup): AgeGroupTopics;

  /**
   * Abstract method - must be implemented by each subject service
   */
  abstract getSubjectName(): string;
  /**
   * Get age-appropriate language level
   */
  protected getLanguageLevel(ageGroup: AgeGroup): string {
    const levels = {
      '5-6': 'simple',
      '7-8': 'elementary', 
      '9-10': 'elementary',
      '11-13': 'intermediate',
      '14-17': 'advanced'
    };
    return levels[ageGroup];
  }

  /**
   * Filter questions by complexity for age group
   */
  protected filterQuestionsByAge(questions: string[], ageGroup: AgeGroup): string[] {
    // Override in child classes for subject-specific filtering
    return questions;
  }

  /**
   * Get topic suggestions based on current context
   */
  protected async getContextualSuggestions(topic: string, ageGroup: AgeGroup): Promise<QuickTopic[]> {
    // Override in child classes for subject-specific suggestions
    return [];
  }

  /**
   * Get topics for specific mode and age group
   */
  async getTopicsForMode(ageGroup: AgeGroup, mode: Mode, userContext?: UserContext): Promise<QuickTopic[]> {
    const allTopics = await this.getTopicsForAge(ageGroup, userContext);
    return allTopics[mode] || [];
  }

  /**
   * Get all available icons for topics
   */
  getAvailableIcons() {
    return {
      Leaf, Rocket, Atom, Globe, Calculator, BookOpen, Beaker, Users,
      Music, Palette, Wand2, Brain, Languages, History, Heart, Gamepad2,
      Camera, Lightbulb, Puzzle, Star, TreePine, Fish, Bird, Bug
    };
  }

  /**
   * Search topics by keyword
   */
  async searchTopics(ageGroup: AgeGroup, keyword: string, userContext?: UserContext): Promise<QuickTopic[]> {
    const allTopics = await this.getTopicsForAge(ageGroup, userContext);
    const searchResults: QuickTopic[] = [];
    
    Object.values(allTopics).forEach(modeTopics => {
      modeTopics.forEach(topic => {
        if (topic.title.toLowerCase().includes(keyword.toLowerCase()) ||
            topic.description.toLowerCase().includes(keyword.toLowerCase()) ||
            topic.category.toLowerCase().includes(keyword.toLowerCase()) ||
            (topic.questions && topic.questions.some(q => q.toLowerCase().includes(keyword.toLowerCase())))) {
          searchResults.push(topic);
        }
      });
    });
    
    return searchResults;
  }

  /**
   * Get random topic for inspiration
   */
  async getRandomTopic(ageGroup: AgeGroup, mode: Mode, userContext?: UserContext): Promise<QuickTopic | null> {
    const topics = await this.getTopicsForMode(ageGroup, mode, userContext);
    if (topics.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * topics.length);
    return topics[randomIndex];
  }

  /**
   * Get related topics based on current topic
   */
  async getRelatedTopics(currentTopic: string, ageGroup: AgeGroup, mode: Mode, userContext?: UserContext): Promise<QuickTopic[]> {
    // Basic implementation - override in child classes for better logic
    const allTopics = await this.getTopicsForMode(ageGroup, mode, userContext);
    return allTopics.filter(topic => 
      topic.title !== currentTopic && 
      Math.random() > 0.7 // Simple random selection
    ).slice(0, 3);
  }
}
