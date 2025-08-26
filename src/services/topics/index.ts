import { BaseTopicsService, QuickTopic, AgeGroupTopics, AgeGroup, Mode, UserContext } from './BaseTopicsService';
import { mathTopicsService } from './MathTopicsService';
import { scienceTopicsService } from './ScienceTopicsService';
import { languageTopicsService } from './LanguageTopicsService';

/**
 * Unified service that combines all topic services
 * Enhanced with LLM-based dynamic topic generation
 */
class UnifiedTopicsService {
  private services: Record<string, BaseTopicsService> = {
    math: mathTopicsService,
    science: scienceTopicsService,
    language: languageTopicsService,
    // Note: Add social studies service when created
  };

  /**
   * Get topics for all subjects for a specific age group with user context
   */
  async getAllTopicsForAge(ageGroup: AgeGroup, userContext?: UserContext): Promise<Record<string, AgeGroupTopics>> {
    const allTopics: Record<string, AgeGroupTopics> = {};
    
    for (const [subject, service] of Object.entries(this.services)) {
      try {
        allTopics[subject] = await service.getTopicsForAge(ageGroup, userContext);
      } catch (error) {
        console.error(`Failed to get topics for ${subject}:`, error);
        allTopics[subject] = service.getStaticTopicsForAge(ageGroup);
      }
    }
    
    return allTopics;
  }

  /**
   * Get topics for a specific subject, age group, and mode with user context
   */
  async getTopicsForSubject(
    subject: string, 
    ageGroup: AgeGroup, 
    mode: Mode, 
    userContext?: UserContext
  ): Promise<QuickTopic[]> {
    const service = this.services[subject];
    if (!service) {
      console.warn(`No service found for subject: ${subject}`);
      return [];
    }
    
    try {
      return await service.getTopicsForMode(ageGroup, mode, userContext);
    } catch (error) {
      console.error(`Failed to get topics for ${subject} ${mode}:`, error);
      return service.getStaticTopicsForAge(ageGroup)[mode] || [];
    }
  }

  /**
   * Get combined topics from all subjects for a specific mode and age group
   */
  async getCombinedTopicsForMode(
    ageGroup: AgeGroup, 
    mode: Mode, 
    userContext?: UserContext
  ): Promise<QuickTopic[]> {
    const allTopics: QuickTopic[] = [];
    
    for (const service of Object.values(this.services)) {
      try {
        const topics = await service.getTopicsForMode(ageGroup, mode, userContext);
        allTopics.push(...topics);
      } catch (error) {
        console.error(`Failed to get topics for mode ${mode}:`, error);
        // Fallback to static topics
        const staticTopics = service.getStaticTopicsForAge(ageGroup);
        allTopics.push(...(staticTopics[mode] || []));
      }
    }
    
    // Shuffle topics to mix subjects
    return this.shuffleArray(allTopics);
  }

  /**
   * Search topics across all subjects with user context
   */
  async searchAllTopics(
    ageGroup: AgeGroup, 
    keyword: string, 
    userContext?: UserContext
  ): Promise<Record<string, QuickTopic[]>> {
    const searchResults: Record<string, QuickTopic[]> = {};
    
    for (const [subject, service] of Object.entries(this.services)) {
      try {
        const results = await service.searchTopics(ageGroup, keyword, userContext);
        if (results.length > 0) {
          searchResults[subject] = results;
        }
      } catch (error) {
        console.error(`Failed to search topics for ${subject}:`, error);
      }
    }
    
    return searchResults;
  }

  /**
   * Get a random topic from any subject with user context
   */
  async getRandomTopicFromAnySubject(
    ageGroup: AgeGroup, 
    mode: Mode, 
    userContext?: UserContext
  ): Promise<QuickTopic | null> {
    const allTopics = await this.getCombinedTopicsForMode(ageGroup, mode, userContext);
    if (allTopics.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * allTopics.length);
    return allTopics[randomIndex];
  }

  /**
   * Get suggested next topics based on current topic with user context
   */
  async getSuggestedNextTopics(
    currentTopic: string, 
    ageGroup: AgeGroup, 
    mode: Mode, 
    userContext?: UserContext
  ): Promise<QuickTopic[]> {
    const suggestions: QuickTopic[] = [];
    
    for (const service of Object.values(this.services)) {
      try {
        const relatedTopics = await service.getRelatedTopics(currentTopic, ageGroup, mode, userContext);
        suggestions.push(...relatedTopics);
      } catch (error) {
        console.error(`Failed to get related topics:`, error);
      }
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Get available subjects
   */
  getAvailableSubjects(): string[] {
    return Object.keys(this.services);
  }

  /**
   * Add a new subject service
   */
  addSubjectService(subject: string, service: BaseTopicsService): void {
    this.services[subject] = service;
  }

  /**
   * Get statistics about topics
   */
  async getTopicStatistics(ageGroup: AgeGroup, userContext?: UserContext): Promise<Record<string, { totalTopics: number; modes: Record<Mode, number> }>> {
    const stats: Record<string, { totalTopics: number; modes: Record<Mode, number> }> = {};
    
    for (const [subject, service] of Object.entries(this.services)) {
      try {
        const topics = await service.getTopicsForAge(ageGroup, userContext);
        stats[subject] = {
          totalTopics: 0,
          modes: {
            explore: topics.explore.length,
            learn: topics.learn.length,
            create: topics.create.length,
            study: topics.study.length
          }
        };
        stats[subject].totalTopics = Object.values(stats[subject].modes).reduce((sum, count) => sum + count, 0);
      } catch (error) {
        console.error(`Failed to get statistics for ${subject}:`, error);
        const staticTopics = service.getStaticTopicsForAge(ageGroup);
        stats[subject] = {
          totalTopics: 0,
          modes: {
            explore: staticTopics.explore.length,
            learn: staticTopics.learn.length,
            create: staticTopics.create.length,
            study: staticTopics.study.length
          }
        };
        stats[subject].totalTopics = Object.values(stats[subject].modes).reduce((sum, count) => sum + count, 0);
      }
    }
    
    return stats;
  }

  /**
   * Utility function to shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Legacy support methods for compatibility with existing code
  
  /**
   * Legacy method - get topics by age (for backward compatibility)
   */
  async getTopicsByAge(ageGroup: AgeGroup, userContext?: UserContext): Promise<AgeGroupTopics> {
    // Combine math, science, and language topics for now
    const mathTopics = await mathTopicsService.getTopicsForAge(ageGroup, userContext);
    const scienceTopics = await scienceTopicsService.getTopicsForAge(ageGroup, userContext);
    const languageTopics = await languageTopicsService.getTopicsForAge(ageGroup, userContext);
    
    return {
      explore: [...mathTopics.explore, ...scienceTopics.explore, ...languageTopics.explore],
      learn: [...mathTopics.learn, ...scienceTopics.learn, ...languageTopics.learn],
      create: [...mathTopics.create, ...scienceTopics.create, ...languageTopics.create],
      study: [...mathTopics.study, ...scienceTopics.study, ...languageTopics.study]
    };
  }

  /**
   * Legacy method - get topics for age and mode (for backward compatibility)
   */
  async getTopicsForAgeAndMode(ageGroup: AgeGroup, mode: Mode, userContext?: UserContext): Promise<QuickTopic[]> {
    return await this.getCombinedTopicsForMode(ageGroup, mode, userContext);
  }
}

// Export singleton instance
export const unifiedTopicsService = new UnifiedTopicsService();

// Export types for use by other modules
export * from './BaseTopicsService';

// Default export for backward compatibility
export default unifiedTopicsService;
