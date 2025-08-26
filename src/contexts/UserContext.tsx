import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userStorageService, StoredUser } from '@/services/UserStorageService';
import { AgeGroup, CurriculumBoard } from './EducationalContext';

// Helper to get age group from age
const getAgeGroupFromAge = (age: number): AgeGroup => {
  if (age <= 7) return '5-7';
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  return '14-17';
};

// The User object used within the application, with Date objects
export interface User extends Omit<StoredUser, 'createdAt' | 'lastActiveAt'> {
  createdAt: Date;
  lastActiveAt: Date;
}

// The context type
export interface UserContextType {
  currentUser: User | null;
  users: User[];
  createUser: (name: string, age: number, grade: string, board: CurriculumBoard) => Promise<User>;
  updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>) => void;
  switchUser: (userId: string) => void;
  completeOnboarding: (userId: string, updates: { ageGroup: AgeGroup; board: CurriculumBoard }) => Promise<void>;
  validateAgeGrade: (age: number, grade: string) => { isValid: boolean; suggestion?: string };
  signOut: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mappers to convert between StoredUser (string dates) and User (Date objects)
const fromStoredUser = (storedUser: StoredUser): User => ({
  ...storedUser,
  createdAt: new Date(storedUser.createdAt),
  lastActiveAt: new Date(storedUser.lastActiveAt),
});

const toStoredUser = (user: User): StoredUser => {
    const { createdAt, lastActiveAt, ...rest } = user;
    return {
      ...rest,
      createdAt: createdAt.toISOString(),
      lastActiveAt: lastActiveAt.toISOString(),
    };
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUsers = () => {
      const storedUsers = userStorageService.getAllUsers();
      const appUsers = storedUsers.map(fromStoredUser);
      setUsers(appUsers);

      const currentUserId = userStorageService.getCurrentUserId();
      if (currentUserId) {
        const currentUserData = appUsers.find(u => u.id === currentUserId);
        setCurrentUser(currentUserData || null);
      } else if (appUsers.length > 0) {
        setCurrentUser(appUsers[0]);
        userStorageService.setCurrentUserId(appUsers[0].id);
      }
    };
    loadUsers();
  }, []);

  const createUser = async (name: string, age: number, grade: string, board: CurriculumBoard): Promise<User> => {
    const userData = {
        name,
        age,
        grade,
        board,
        ageGroup: getAgeGroupFromAge(age),
    };
    
    const newStoredUser = await userStorageService.createUser(userData);
    const newAppUser = fromStoredUser(newStoredUser);

    setUsers((prevUsers) => [...prevUsers, newAppUser]);
    setCurrentUser(newAppUser);
    userStorageService.setCurrentUserId(newAppUser.id);
    
    return newAppUser;
  };

  const updateUser = useCallback((userId: string, updates: Partial<Omit<User, 'id'>>) => {
    // Optimistically update the state
    const updatedDate = new Date();
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, ...updates, lastActiveAt: updatedDate } : user
      )
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates, lastActiveAt: updatedDate } : null);
    }

    // Prepare updates for storage (convert dates to strings)
    const storedUpdates: Partial<StoredUser> = { ...updates };
    if (updates.createdAt) {
        storedUpdates.createdAt = updates.createdAt.toISOString();
    }
    if (updates.lastActiveAt) {
        storedUpdates.lastActiveAt = updates.lastActiveAt.toISOString();
    }
    
    userStorageService.updateUser(userId, storedUpdates);
  }, [currentUser?.id]);

  const switchUser = (userId: string) => {
    const userToSwitch = users.find(u => u.id === userId);
    if (userToSwitch) {
      setCurrentUser(userToSwitch);
      userStorageService.setCurrentUserId(userId);
    }
  };

  const completeOnboarding = async (userId: string, updates: { ageGroup: AgeGroup; board: CurriculumBoard }) => {
    const finalUpdates = { ...updates, hasCompletedOnboarding: true };
    updateUser(userId, finalUpdates);
  };

  const signOut = () => {
    setCurrentUser(null);
    userStorageService.clearCurrentUserId();
  };

  const validateAgeGrade = (age: number, grade: string): { isValid: boolean; suggestion?: string } => {
    const gradeToAgeMap: { [key: string]: { min: number; max: number } } = {
      'Kindergarten': { min: 4, max: 6 },
      '1st Grade': { min: 5, max: 7 },
      '2nd Grade': { min: 6, max: 8 },
      '3rd Grade': { min: 7, max: 9 },
      '4th Grade': { min: 8, max: 10 },
      '5th Grade': { min: 9, max: 11 },
      '6th Grade': { min: 10, max: 12 },
      '7th Grade': { min: 11, max: 13 },
      '8th Grade': { min: 12, max: 14 },
      '9th Grade': { min: 13, max: 15 },
      '10th Grade': { min: 14, max: 16 },
      '11th Grade': { min: 15, max: 17 },
      '12th Grade': { min: 16, max: 18 },
      'College/University': { min: 17, max: 25 },
      'Adult': { min: 18, max: 100 },
    };

    const ageRange = gradeToAgeMap[grade];
    if (!ageRange) return { isValid: true };

    if (age >= ageRange.min && age <= ageRange.max) {
      return { isValid: true };
    }

    const suggestedGrades = Object.entries(gradeToAgeMap)
      .filter(([_, range]) => age >= range.min && age <= range.max)
      .map(([grade, _]) => grade);

    return {
      isValid: false,
      suggestion: `This age is unusual for ${grade}. Suggested grades: ${suggestedGrades.join(', ')}.`
    };
  };

  const value: UserContextType = {
    currentUser,
    users,
    createUser,
    updateUser,
    switchUser,
    completeOnboarding,
    validateAgeGrade,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
