import React, { createContext, useContext, useState, useEffect } from 'react';
import { educationalApi } from '@/api/educationalApi';

export type AgeGroup = '5-7' | '8-10' | '11-13' | '14-17';

interface EducationalContextType {
  ageGroup: AgeGroup | null;
  setAgeGroup: (age: AgeGroup) => void;
  serverStatus: {
    healthy: boolean;
    openai: boolean;
    anthropic: boolean;
    lastChecked: Date | null;
  };
  checkServerHealth: () => Promise<void>;
  isAgeGroupRequired: (path: string) => boolean;
}

const EducationalContext = createContext<EducationalContextType | undefined>(undefined);

export const useEducational = () => {
  const context = useContext(EducationalContext);
  if (context === undefined) {
    throw new Error('useEducational must be used within an EducationalProvider');
  }
  return context;
};

interface EducationalProviderProps {
  children: React.ReactNode;
}

export const EducationalProvider: React.FC<EducationalProviderProps> = ({ children }) => {
  const [ageGroup, setAgeGroupState] = useState<AgeGroup | null>(null);
  const [serverStatus, setServerStatus] = useState({
    healthy: false,
    openai: false,
    anthropic: false,
    lastChecked: null as Date | null,
  });

  // Load age group from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedAgeGroup');
    if (saved && ['5-7', '8-10', '11-13', '14-17'].includes(saved)) {
      setAgeGroupState(saved as AgeGroup);
    }
  }, []);

  // Save age group to localStorage when changed
  const setAgeGroup = (age: AgeGroup) => {
    setAgeGroupState(age);
    localStorage.setItem('selectedAgeGroup', age);
  };

  // Check server health
  const checkServerHealth = async () => {
    try {
      const response = await educationalApi.getServerHealth();
      setServerStatus({
        healthy: response.success,
        openai: response.data?.apiConnections?.openai || false,
        anthropic: response.data?.apiConnections?.anthropic || false,
        lastChecked: new Date(),
      });
    } catch (error) {
      setServerStatus({
        healthy: false,
        openai: false,
        anthropic: false,
        lastChecked: new Date(),
      });
    }
  };

  // Check server health on mount and periodically
  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Determine if age group is required for the current path
  const isAgeGroupRequired = (path: string) => {
    const educationalPaths = ['/dashboard', '/quest/', '/learning', '/tools'];
    return educationalPaths.some(p => path.includes(p));
  };

  const value: EducationalContextType = {
    ageGroup,
    setAgeGroup,
    serverStatus,
    checkServerHealth,
    isAgeGroupRequired,
  };

  return (
    <EducationalContext.Provider value={value}>
      {children}
    </EducationalContext.Provider>
  );
};
