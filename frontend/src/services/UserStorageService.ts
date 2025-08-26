/**
 * User Storage Service
 * Manages persistent user data with IP-based identification
 * Ensures onboarding is completed only once per user/IP
 */

export interface StoredUser {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
  grade: string;
  board: string;
  avatar?: string;
  createdAt: string;
  lastActiveAt: string;
  ipAddress?: string;
  hasCompletedOnboarding: boolean;
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
  statistics: {
    totalSessions: number;
    totalChatTime: number; // in minutes
    level: number;
    streakDays: number;
    completedTopics: string[];
  };
}

export interface UserSession {
  userId: string;
  ipAddress: string;
  sessionStart: string;
  lastActivity: string;
  browserFingerprint?: string;
}

class UserStorageService {
  private readonly USERS_KEY = 'gpt4kids_users_db';
  private readonly SESSIONS_KEY = 'gpt4kids_user_sessions';
  private readonly CURRENT_USER_KEY = 'gpt4kids_current_user';
  private readonly IP_MAPPING_KEY = 'gpt4kids_ip_mapping';

  /**
   * Get user's IP address (simplified for demo - in production use proper IP detection)
   */
  private async getUserIP(): Promise<string> {
    try {
      // In production, you'd use a proper IP detection service
      // For demo purposes, we'll create a browser fingerprint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      // Create a simple hash of the fingerprint
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return 'demo_ip_' + Math.abs(hash).toString(16);
    } catch (error) {
      console.warn('Error generating browser fingerprint:', error);
      return 'demo_ip_' + Date.now().toString(16);
    }
  }

  /**
   * Get all stored users
   */
  getAllUsers(): StoredUser[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): StoredUser | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === userId) || null;
  }

  /**
   * Get user by IP address (check if onboarding already completed)
   */
  async getUserByIP(): Promise<StoredUser | null> {
    const currentIP = await this.getUserIP();
    const users = this.getAllUsers();
    return users.find(user => 
      user.ipAddress === currentIP && user.hasCompletedOnboarding
    ) || null;
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    name: string;
    age: number;
    ageGroup: string;
    grade: string;
    board: string;
  }): Promise<StoredUser> {
    const currentIP = await this.getUserIP();
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const newUser: StoredUser = {
      id: userId,
      name: userData.name,
      age: userData.age,
      ageGroup: userData.ageGroup,
      grade: userData.grade,
      board: userData.board,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      ipAddress: currentIP,
      hasCompletedOnboarding: true,
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
      },
      statistics: {
        totalSessions: 0,
        totalChatTime: 0,
        level: 1,
        streakDays: 0,
        completedTopics: []
      }
    };

    // Save user to storage
    const users = this.getAllUsers();
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    // Set as current user
    this.setCurrentUserId(userId);

    // Create session
    await this.createSession(userId);

    return newUser;
  }

  /**
   * Update user data
   */
  updateUser(userId: string, updates: Partial<StoredUser>): StoredUser | null {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      lastActiveAt: new Date().toISOString()
    };

    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return users[userIndex];
  }

  /**
   * Set current active user
   */
  setCurrentUserId(userId: string): void {
    localStorage.setItem(this.CURRENT_USER_KEY, userId);
  }

  /**
   * Get current active user
   */
  getCurrentUser(): StoredUser | null {
    const currentUserId = localStorage.getItem(this.CURRENT_USER_KEY);
    if (!currentUserId) return null;
    return this.getUserById(currentUserId);
  }

  /**
   * Get current active user ID
   */
  getCurrentUserId(): string | null {
    return localStorage.getItem(this.CURRENT_USER_KEY);
  }

  clearCurrentUserId(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  /**
   * Create a new session
   */
  async createSession(userId: string): Promise<void> {
    const currentIP = await this.getUserIP();
    const session: UserSession = {
      userId,
      ipAddress: currentIP,
      sessionStart: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    const sessions = this.getSessions();
    sessions.push(session);
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(userId: string): Promise<void> {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(session => session.userId === userId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].lastActivity = new Date().toISOString();
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  /**
   * Get all sessions
   */
  private getSessions(): UserSession[] {
    try {
      const sessions = localStorage.getItem(this.SESSIONS_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Check if user has completed onboarding based on IP
   */
  async hasCompletedOnboardingForIP(): Promise<boolean> {
    const existingUser = await this.getUserByIP();
    return existingUser !== null && existingUser.hasCompletedOnboarding;
  }

  /**
   * Get user statistics
   */
  getUserStatistics(userId: string): StoredUser['statistics'] | null {
    const user = this.getUserById(userId);
    return user ? user.statistics : null;
  }

  /**
   * Update user statistics
   */
  updateUserStatistics(userId: string, statsUpdate: Partial<StoredUser['statistics']>): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    const updatedUser = this.updateUser(userId, {
      statistics: {
        ...user.statistics,
        ...statsUpdate
      }
    });

    return updatedUser !== null;
  }

  /**
   * Mark onboarding as complete for the current user
   */
  async markOnboardingComplete(): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      
      if (currentUser) {
        const updatedUser: StoredUser = {
          ...currentUser,
          hasCompletedOnboarding: true
        };
        
        this.updateUser(currentUser.id, updatedUser);
        console.log('Onboarding marked as complete for user:', currentUser.id);
      } else {
        console.warn('Cannot mark onboarding complete: no current user found');
      }
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
      throw error;
    }
  }

  /**
   * Check if the current user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser?.hasCompletedOnboarding ?? false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Export user data for backup/transfer
   */
  exportUserData(userId: string): any {
    const user = this.getUserById(userId);
    if (!user) return null;

    return {
      user,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Get onboarding status for current session
   */
  async getOnboardingStatus(): Promise<{
    shouldShowOnboarding: boolean;
    existingUser: StoredUser | null;
  }> {
    const hasCompleted = await this.hasCompletedOnboarding();
    const existingUser = await this.getCurrentUser();

    return {
      shouldShowOnboarding: !hasCompleted,
      existingUser
    };
  }

  /**
   * Clear all user data (for testing/reset purposes)
   */
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.SESSIONS_KEY);
    localStorage.removeItem(this.IP_MAPPING_KEY);
    console.log('All user storage data cleared');
  }
}

// Export singleton instance
export const userStorageService = new UserStorageService();
