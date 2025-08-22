import React, { createContext, useContext, useState, useEffect } from 'react';
import { userContextService, UserProfile } from '@/services/userContextService';

export interface User {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
  grade: string;
  avatar?: string;
  createdAt: Date;
  lastActiveAt: Date;
  totalChatTime: number; // in minutes
  level: number;
  streakDays: number;
  preferences: UserProfile['preferences'];
  settings: UserProfile['settings'];
  hasCompletedOnboarding: boolean; // Global onboarding flag
}

// Age and grade validation mapping
const GRADE_AGE_MAPPING = {
  'Kindergarten': { minAge: 4, maxAge: 6 },
  '1st Grade': { minAge: 5, maxAge: 7 },
  '2nd Grade': { minAge: 6, maxAge: 8 },
  '3rd Grade': { minAge: 7, maxAge: 9 },
  '4th Grade': { minAge: 8, maxAge: 10 },
  '5th Grade': { minAge: 9, maxAge: 11 },
  '6th Grade': { minAge: 10, maxAge: 12 },
  '7th Grade': { minAge: 11, maxAge: 13 },
  '8th Grade': { minAge: 12, maxAge: 14 },
  '9th Grade': { minAge: 13, maxAge: 15 },
  '10th Grade': { minAge: 14, maxAge: 16 },
  '11th Grade': { minAge: 15, maxAge: 17 },
  '12th Grade': { minAge: 16, maxAge: 18 },
  'College/University': { minAge: 17, maxAge: 25 },
  'Adult': { minAge: 18, maxAge: 100 }
};

interface UserContextType {
  currentUser: User | null;
  users: User[];
  switchUser: (userId: string) => void;
  createUser: (name: string, age: number, grade: string) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  getCurrentSessionTime: () => number;
  addSessionTime: (minutes: number) => void;
  incrementLevel: () => void;
  validateAgeGrade: (age: number, grade: string) => { isValid: boolean; suggestion?: string };
  completeOnboarding: (userId: string) => void;
  isOnboardingComplete: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Dummy users for development
const createDummyUsers = (): User[] => [
  {
    id: 'user_001',
    name: 'Alex Chen',
    age: 8,
    ageGroup: '8-10',
    grade: '3rd Grade',
    avatar: '👦',
    createdAt: new Date('2024-01-15'),
    lastActiveAt: new Date(),
    totalChatTime: 245, // minutes
    level: 3,
    streakDays: 7,
    hasCompletedOnboarding: true,
    preferences: {
      favoriteSubjects: ['Science', 'Math'],
      learningStyle: 'visual',
      interests: ['Space', 'Animals', 'Technology'],
      difficulty: 'normal'
    },
    settings: {
      sessionLength: 'medium',
      timePreference: 'afternoon',
      notificationsEnabled: true
    }
  },
  {
    id: 'user_002',
    name: 'Emma Rodriguez',
    age: 12,
    ageGroup: '11-13',
    grade: '7th Grade',
    avatar: '👧',
    createdAt: new Date('2024-02-20'),
    lastActiveAt: new Date(),
    totalChatTime: 478, // minutes
    level: 5,
    streakDays: 12,
    hasCompletedOnboarding: true,
    preferences: {
      favoriteSubjects: ['Literature', 'History', 'Art'],
      learningStyle: 'mixed',
      interests: ['Creative Writing', 'Ancient Civilizations', 'Music'],
      difficulty: 'challenging'
    },
    settings: {
      sessionLength: 'long',
      timePreference: 'evening',
      notificationsEnabled: true
    }
  },
  {
    id: 'user_003',
    name: 'Jordan Kim',
    age: 15,
    ageGroup: '14-17',
    grade: '10th Grade',
    avatar: '🧑',
    createdAt: new Date('2024-03-10'),
    lastActiveAt: new Date(),
    totalChatTime: 682, // minutes
    level: 7,
    streakDays: 5,
    hasCompletedOnboarding: true,
    preferences: {
      favoriteSubjects: ['Physics', 'Computer Science', 'Math'],
      learningStyle: 'kinesthetic',
      interests: ['Programming', 'Robotics', 'Game Development'],
      difficulty: 'challenging'
    },
    settings: {
      sessionLength: 'long',
      timePreference: 'evening',
      notificationsEnabled: false
    }
  }
];

const ageToGradeMapping = {
  5: 'Kindergarten', 6: '1st Grade', 7: '2nd Grade', 8: '3rd Grade',
  9: '4th Grade', 10: '5th Grade', 11: '6th Grade', 12: '7th Grade',
  13: '8th Grade', 14: '9th Grade', 15: '10th Grade', 16: '11th Grade', 17: '12th Grade'
};

const getAgeGroup = (age: number): string => {
  if (age >= 5 && age <= 7) return '5-7';
  if (age >= 8 && age <= 10) return '8-10';
  if (age >= 11 && age <= 13) return '11-13';
  if (age >= 14 && age <= 17) return '14-17';
  return '8-10'; // fallback
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());

  // Load users from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('gpt4kids_users');
    const savedCurrentUserId = localStorage.getItem('gpt4kids_current_user');

    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers).map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastActiveAt: new Date(user.lastActiveAt)
        }));
        setUsers(parsedUsers);

        if (savedCurrentUserId) {
          const currentUser = parsedUsers.find((u: User) => u.id === savedCurrentUserId);
          if (currentUser) {
            setCurrentUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
        // If loading fails, create dummy users
        const dummyUsers = createDummyUsers();
        setUsers(dummyUsers);
        setCurrentUser(dummyUsers[0]);
      }
    } else {
      // First time - create dummy users
      const dummyUsers = createDummyUsers();
      setUsers(dummyUsers);
      setCurrentUser(dummyUsers[0]);
    }
  }, []);

  // Save users to localStorage whenever users change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('gpt4kids_users', JSON.stringify(users));
    }
  }, [users]);

  // Save current user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gpt4kids_current_user', currentUser.id);
      setSessionStartTime(new Date());
      
      // Update user profile in userContextService
      userContextService.saveUserProfile(currentUser.id, {
        userId: currentUser.id,
        name: currentUser.name,
        ageGroup: currentUser.ageGroup,
        preferences: currentUser.preferences,
        settings: currentUser.settings
      });
    }
  }, [currentUser]);

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      // Update last active time for previous user
      if (currentUser) {
        const sessionTime = getCurrentSessionTime();
        updateUser(currentUser.id, {
          lastActiveAt: new Date(),
          totalChatTime: currentUser.totalChatTime + sessionTime
        });
      }
      
      setCurrentUser(user);
    }
  };

  const createUser = (name: string, age: number, grade: string): User => {
    console.log('Creating new user:', { name, age, grade });
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      age,
      ageGroup: getAgeGroup(age),
      grade,
      avatar: age <= 10 ? (Math.random() > 0.5 ? '👦' : '👧') : '🧑',
      createdAt: new Date(),
      lastActiveAt: new Date(),
      totalChatTime: 0,
      level: 1,
      streakDays: 1,
      hasCompletedOnboarding: false, // New users need to complete onboarding
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

    console.log('Created user object:', newUser);
    
    // Update users array and set as current user immediately
    setUsers(prev => {
      const updated = [...prev, newUser];
      console.log('Updated users list:', updated);
      
      // Persist immediately to localStorage
      localStorage.setItem('users', JSON.stringify(updated));
      return updated;
    });
    
    // Set as current user immediately
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    console.log('User created and set as current:', newUser.id);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
    
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
  };

  const getCurrentSessionTime = (): number => {
    const now = new Date();
    const sessionTime = Math.floor((now.getTime() - sessionStartTime.getTime()) / (1000 * 60));
    return sessionTime;
  };

  const addSessionTime = (minutes: number) => {
    if (currentUser) {
      updateUser(currentUser.id, {
        totalChatTime: currentUser.totalChatTime + minutes,
        lastActiveAt: new Date()
      });
    }
  };

  const incrementLevel = () => {
    if (currentUser) {
      updateUser(currentUser.id, {
        level: currentUser.level + 1
      });
    }
  };

  const validateAgeGrade = (age: number, grade: string): { isValid: boolean; suggestion?: string } => {
    const gradeMapping = GRADE_AGE_MAPPING[grade as keyof typeof GRADE_AGE_MAPPING];
    
    if (!gradeMapping) {
      return { isValid: false, suggestion: 'Please select a valid grade' };
    }

    const { minAge, maxAge } = gradeMapping;
    
    if (age < minAge || age > maxAge) {
      // Find the most appropriate grade for this age
      const appropriateGrades = Object.entries(GRADE_AGE_MAPPING)
        .filter(([_, mapping]) => age >= mapping.minAge && age <= mapping.maxAge)
        .map(([gradeName]) => gradeName);
      
      const suggestion = appropriateGrades.length > 0 
        ? `For age ${age}, consider: ${appropriateGrades.join(' or ')}`
        : 'Please check the age and grade combination';
        
      return { isValid: false, suggestion };
    }

    return { isValid: true };
  };

  const completeOnboarding = (userId: string) => {
    console.log('Completing onboarding for userId:', userId);
    console.log('Current user ID:', currentUser?.id);
    console.log('Users array length:', users.length);
    
    // First try to use current user if it matches
    let userToUpdate = currentUser?.id === userId ? currentUser : null;
    
    // If not found in current user, search in users array
    if (!userToUpdate) {
      userToUpdate = users.find(u => u.id === userId);
    }
    
    // If still not found, try using current user anyway (in case of timing issues)
    if (!userToUpdate && currentUser) {
      console.warn('User ID mismatch, using current user for onboarding completion');
      userToUpdate = currentUser;
    }
    
    if (!userToUpdate) {
      console.error('No user found for onboarding completion:', userId);
      console.error('Current user:', currentUser);
      console.error('Available users:', users.slice(0, 5).map(u => ({ id: u.id, name: u.name })), `... and ${users.length - 5} more`);
      return;
    }

    const updatedUser: User = {
      ...userToUpdate,
      hasCompletedOnboarding: true
    };

    console.log('Updated user after onboarding:', updatedUser);

    // Update users array
    setUsers(prev => {
      const updated = prev.map(user => 
        user.id === userToUpdate.id ? updatedUser : user
      );
      console.log('Updated users list after onboarding - first 3:', updated.slice(0, 3));
      
      // Persist to localStorage immediately
      localStorage.setItem('users', JSON.stringify(updated));
      return updated;
    });
    
    // Update current user
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    console.log('Onboarding completion successful for user:', updatedUser.id);
  };

  // Add a function to clear all users and start fresh
  const clearAllUsers = () => {
    setUsers([]);
    setCurrentUser(null);
    localStorage.removeItem('users');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('onboardingComplete');
    console.log('All users cleared from storage');
  };

  const isOnboardingComplete = (): boolean => {
    return currentUser?.hasCompletedOnboarding ?? false;
  };

  const value: UserContextType = {
    currentUser,
    users,
    switchUser,
    createUser,
    updateUser,
    deleteUser,
    getCurrentSessionTime,
    addSessionTime,
    incrementLevel,
    validateAgeGrade,
    completeOnboarding,
    isOnboardingComplete
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
