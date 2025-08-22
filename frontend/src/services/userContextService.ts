/**
 * User Context Service
 * Manages user learning context for personalized topic generation
 */

import { UserContext } from './topics/BaseTopicsService';

interface UserProfile {
  userId: string;
  name?: string;
  ageGroup: string;
  preferences: {
    favoriteSubjects: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    interests: string[];
    difficulty: 'easy' | 'normal' | 'challenging';
  };
  settings: {
    sessionLength: 'short' | 'medium' | 'long';
    timePreference: 'morning' | 'afternoon' | 'evening' | 'any';
    notificationsEnabled: boolean;
  };
}

interface LearningSession {
  startTime: Date;
  mode: string;
  subject?: string;
  topics: string[];
  duration: number;
  engagementLevel: 'low' | 'medium' | 'high';
  completedActivities: number;
  totalActivities: number;
}

class UserContextService {
  private readonly STORAGE_KEY = 'gpt4kids_user_context';
  private readonly HISTORY_KEY = 'gpt4kids_learning_history';
  private currentSession: LearningSession | null = null;

  /**
   * Get complete user context for topic generation
   */
  async getUserContext(userId?: string): Promise<UserContext | undefined> {
    if (!userId) {
      // For anonymous users, return basic context
      return {
        currentSession: this.getCurrentSessionContext()
      };
    }

    const profile = this.getUserProfile(userId);
    const history = this.getLearningHistory(userId);
    const currentSession = this.getCurrentSessionContext();

    return {
      userId,
      history: history.slice(-20), // Last 20 learning activities
      preferences: profile?.preferences,
      currentSession
    };
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | null {
    try {
      const profiles = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      return profiles[userId] || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Save user profile
   */
  saveUserProfile(userId: string, profile: Partial<UserProfile>): void {
    try {
      const profiles = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      profiles[userId] = {
        ...profiles[userId],
        ...profile,
        userId
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  /**
   * Start a new learning session
   */
  startSession(mode: string, subject?: string): void {
    this.currentSession = {
      startTime: new Date(),
      mode,
      subject,
      topics: [],
      duration: 0,
      engagementLevel: 'medium',
      completedActivities: 0,
      totalActivities: 0
    };
  }

  /**
   * Update current session with activity
   */
  updateSession(update: Partial<LearningSession>): void {
    if (this.currentSession) {
      this.currentSession = {
        ...this.currentSession,
        ...update,
        duration: Date.now() - this.currentSession.startTime.getTime()
      };
    }
  }

  /**
   * End current session and save to history
   */
  endSession(userId?: string): void {
    if (this.currentSession && userId) {
      this.saveLearningActivity(userId, {
        ...this.currentSession,
        duration: Date.now() - this.currentSession.startTime.getTime(),
        endTime: new Date()
      });
    }
    this.currentSession = null;
  }

  /**
   * Get current session context
   */
  private getCurrentSessionContext(): any {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';

    return {
      timeOfDay,
      sessionLength: this.estimateSessionLength(),
      previousMode: this.currentSession?.mode,
      mood: this.detectMood(),
      ...this.currentSession
    };
  }

  /**
   * Estimate intended session length based on time patterns
   */
  private estimateSessionLength(): string {
    // Simple heuristic - could be enhanced with user data
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) return 'long';    // Morning focus time
    if (hour >= 14 && hour <= 16) return 'medium'; // Afternoon learning
    return 'short'; // Evening or other times
  }

  /**
   * Detect user mood/engagement from recent activity
   */
  private detectMood(): string {
    if (!this.currentSession) return 'neutral';
    
    const completionRate = this.currentSession.totalActivities > 0 
      ? this.currentSession.completedActivities / this.currentSession.totalActivities 
      : 0;

    if (completionRate > 0.8) return 'engaged';
    if (completionRate < 0.3) return 'struggling';
    return 'neutral';
  }

  /**
   * Get learning history for user
   */
  getLearningHistory(userId: string): any[] {
    try {
      const allHistory = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '{}');
      return allHistory[userId] || [];
    } catch (error) {
      console.error('Error getting learning history:', error);
      return [];
    }
  }

  /**
   * Save learning activity to history
   */
  saveLearningActivity(userId: string, activity: any): void {
    try {
      const allHistory = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '{}');
      if (!allHistory[userId]) allHistory[userId] = [];
      
      allHistory[userId].push({
        ...activity,
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 activities per user
      allHistory[userId] = allHistory[userId].slice(-50);
      
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Error saving learning activity:', error);
    }
  }

  /**
   * Get learning analytics for user
   */
  getLearningAnalytics(userId: string): any {
    const history = this.getLearningHistory(userId);
    
    if (history.length === 0) {
      return {
        totalSessions: 0,
        averageSessionLength: 0,
        favoriteSubjects: [],
        preferredModes: [],
        engagementTrend: 'stable'
      };
    }

    const totalSessions = history.length;
    const averageSessionLength = history.reduce((sum, session) => sum + (session.duration || 0), 0) / totalSessions;
    
    // Analyze subject preferences
    const subjectCounts = history.reduce((counts: any, session) => {
      if (session.subject) {
        counts[session.subject] = (counts[session.subject] || 0) + 1;
      }
      return counts;
    }, {});
    
    const favoriteSubjects = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([subject]) => subject);

    // Analyze mode preferences
    const modeCounts = history.reduce((counts: any, session) => {
      counts[session.mode] = (counts[session.mode] || 0) + 1;
      return counts;
    }, {});
    
    const preferredModes = Object.entries(modeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([mode]) => mode);

    // Analyze engagement trend
    const recentSessions = history.slice(-10);
    const recentEngagement = recentSessions.reduce((sum, session) => {
      const level = session.engagementLevel === 'high' ? 3 : session.engagementLevel === 'medium' ? 2 : 1;
      return sum + level;
    }, 0) / recentSessions.length;

    const engagementTrend = recentEngagement > 2.3 ? 'improving' : recentEngagement < 1.7 ? 'declining' : 'stable';

    return {
      totalSessions,
      averageSessionLength: Math.round(averageSessionLength / 1000 / 60), // Convert to minutes
      favoriteSubjects,
      preferredModes,
      engagementTrend,
      recentEngagement
    };
  }

  /**
   * Create default user profile
   */
  createDefaultProfile(userId: string, ageGroup: string): UserProfile {
    return {
      userId,
      ageGroup,
      preferences: {
        favoriteSubjects: [],
        learningStyle: 'mixed',
        interests: [],
        difficulty: 'normal'
      },
      settings: {
        sessionLength: 'medium',
        timePreference: 'any',
        notificationsEnabled: true
      }
    };
  }

  /**
   * Update user preferences
   */
  updatePreferences(userId: string, preferences: Partial<UserProfile['preferences']>): void {
    const profile = this.getUserProfile(userId) || this.createDefaultProfile(userId, '9-10');
    
    this.saveUserProfile(userId, {
      ...profile,
      preferences: {
        ...profile.preferences,
        ...preferences
      }
    });
  }
}

// Export singleton instance
export const userContextService = new UserContextService();

// Export types
export type { UserProfile, LearningSession, UserContext };

export default userContextService;
