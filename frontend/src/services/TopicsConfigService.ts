/**
 * User Preferences and Trending Topics Management
 * 
 * This service manages user interests, trending topics, and personalization
 * features for the QuickTopics system.
 */

export interface UserPreferences {
  interests: string[];
  favoriteTopics: string[];
  completedTopics: string[];
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
}

export interface TrendingTopic {
  keyword: string;
  popularity: number;
  ageGroups: string[];
  modes: string[];
  dateAdded: Date;
}

export interface SeasonalEvent {
  name: string;
  startDate: Date;
  endDate: Date;
  relatedKeywords: string[];
  ageGroups: string[];
}

class TopicsConfigService {
  private userPreferences: Map<string, UserPreferences> = new Map();
  private trendingTopics: TrendingTopic[] = [];
  private seasonalEvents: SeasonalEvent[] = [];

  constructor() {
    this.initializeDefaultTrending();
    this.initializeSeasonalEvents();
  }

  /**
   * Initialize default trending topics
   */
  private initializeDefaultTrending(): void {
    this.trendingTopics = [
      {
        keyword: 'artificial intelligence',
        popularity: 95,
        ageGroups: ['11-13', '14-17'],
        modes: ['explore', 'learn'],
        dateAdded: new Date()
      },
      {
        keyword: 'climate change',
        popularity: 90,
        ageGroups: ['8-10', '11-13', '14-17'],
        modes: ['explore', 'learn', 'create'],
        dateAdded: new Date()
      },
      {
        keyword: 'space exploration',
        popularity: 85,
        ageGroups: ['5-7', '8-10', '11-13', '14-17'],
        modes: ['explore', 'create'],
        dateAdded: new Date()
      },
      {
        keyword: 'renewable energy',
        popularity: 80,
        ageGroups: ['11-13', '14-17'],
        modes: ['explore', 'learn', 'study'],
        dateAdded: new Date()
      },
      {
        keyword: 'coding',
        popularity: 88,
        ageGroups: ['8-10', '11-13', '14-17'],
        modes: ['learn', 'create'],
        dateAdded: new Date()
      }
    ];
  }

  /**
   * Initialize seasonal events and topics
   */
  private initializeSeasonalEvents(): void {
    const currentYear = new Date().getFullYear();
    
    this.seasonalEvents = [
      {
        name: 'Earth Day',
        startDate: new Date(currentYear, 3, 15), // April 15
        endDate: new Date(currentYear, 3, 30),   // April 30
        relatedKeywords: ['environment', 'climate', 'nature', 'conservation'],
        ageGroups: ['5-7', '8-10', '11-13', '14-17']
      },
      {
        name: 'Science Week',
        startDate: new Date(currentYear, 2, 1),  // March 1
        endDate: new Date(currentYear, 2, 15),   // March 15
        relatedKeywords: ['experiments', 'discovery', 'innovation', 'research'],
        ageGroups: ['8-10', '11-13', '14-17']
      },
      {
        name: 'International Space Day',
        startDate: new Date(currentYear, 4, 1),  // May 1
        endDate: new Date(currentYear, 4, 10),   // May 10
        relatedKeywords: ['space', 'astronomy', 'planets', 'rockets'],
        ageGroups: ['5-7', '8-10', '11-13', '14-17']
      },
      {
        name: 'World Ocean Day',
        startDate: new Date(currentYear, 5, 1),  // June 1
        endDate: new Date(currentYear, 5, 15),   // June 15
        relatedKeywords: ['ocean', 'marine', 'water', 'sea life'],
        ageGroups: ['5-7', '8-10', '11-13', '14-17']
      }
    ];
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): UserPreferences {
    return this.userPreferences.get(userId) || {
      interests: [],
      favoriteTopics: [],
      completedTopics: [],
      preferredDifficulty: 'medium',
      learningStyle: 'mixed'
    };
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
    const current = this.getUserPreferences(userId);
    this.userPreferences.set(userId, { ...current, ...preferences });
  }

  /**
   * Add interest for user
   */
  addUserInterest(userId: string, interest: string): void {
    const preferences = this.getUserPreferences(userId);
    if (!preferences.interests.includes(interest)) {
      preferences.interests.push(interest);
      this.userPreferences.set(userId, preferences);
    }
  }

  /**
   * Track completed topic
   */
  trackCompletedTopic(userId: string, topic: string): void {
    const preferences = this.getUserPreferences(userId);
    if (!preferences.completedTopics.includes(topic)) {
      preferences.completedTopics.push(topic);
      this.userPreferences.set(userId, preferences);
    }
  }

  /**
   * Get trending topics for age group and mode
   */
  getTrendingTopicsFor(ageGroup: string, mode: string): TrendingTopic[] {
    return this.trendingTopics
      .filter(topic => 
        topic.ageGroups.includes(ageGroup) && 
        topic.modes.includes(mode)
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }

  /**
   * Get current seasonal topics
   */
  getCurrentSeasonalEvents(): SeasonalEvent[] {
    const now = new Date();
    return this.seasonalEvents.filter(event => 
      now >= event.startDate && now <= event.endDate
    );
  }

  /**
   * Get seasonal keywords for current time
   */
  getCurrentSeasonalKeywords(ageGroup: string): string[] {
    const currentEvents = this.getCurrentSeasonalEvents();
    return currentEvents
      .filter(event => event.ageGroups.includes(ageGroup))
      .flatMap(event => event.relatedKeywords);
  }

  /**
   * Add new trending topic
   */
  addTrendingTopic(topic: TrendingTopic): void {
    this.trendingTopics.push(topic);
    // Keep only top 20 trending topics
    this.trendingTopics = this.trendingTopics
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20);
  }

  /**
   * Update trending topic popularity
   */
  updateTopicPopularity(keyword: string, increment: number = 1): void {
    const topic = this.trendingTopics.find(t => t.keyword === keyword);
    if (topic) {
      topic.popularity += increment;
    }
  }

  /**
   * Get recommended topics based on user history
   */
  getRecommendedTopics(userId: string, ageGroup: string, mode: string): string[] {
    const preferences = this.getUserPreferences(userId);
    const trending = this.getTrendingTopicsFor(ageGroup, mode);
    const seasonal = this.getCurrentSeasonalKeywords(ageGroup);

    // Combine user interests, trending topics, and seasonal content
    const recommendations = [
      ...preferences.interests,
      ...trending.map(t => t.keyword),
      ...seasonal
    ];

    // Remove duplicates and completed topics
    return [...new Set(recommendations)]
      .filter(topic => !preferences.completedTopics.includes(topic))
      .slice(0, 10);
  }

  /**
   * Get difficulty-adjusted topics
   */
  getDifficultyAdjustedTopics(
    topics: any[], 
    difficulty: 'easy' | 'medium' | 'hard'
  ): any[] {
    // This would filter or modify topics based on difficulty
    // For now, return all topics (can be enhanced later)
    return topics;
  }

  /**
   * Get analytics data
   */
  getTopicsAnalytics() {
    return {
      totalUsers: this.userPreferences.size,
      topInterests: this.getTopInterests(),
      trendingTopics: this.trendingTopics.slice(0, 10),
      activeSeasonalEvents: this.getCurrentSeasonalEvents()
    };
  }

  /**
   * Get most popular interests across users
   */
  private getTopInterests(): Array<{ interest: string; count: number }> {
    const interestCounts = new Map<string, number>();
    
    this.userPreferences.forEach(prefs => {
      prefs.interests.forEach(interest => {
        interestCounts.set(interest, (interestCounts.get(interest) || 0) + 1);
      });
    });

    return Array.from(interestCounts.entries())
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
}

export const topicsConfigService = new TopicsConfigService();
export default topicsConfigService;
