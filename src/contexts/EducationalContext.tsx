import React, { createContext, useContext, useState, useEffect } from 'react';
import { educationalApi } from '@/api/educationalApi';

export type AgeGroup = '5-7' | '8-10' | '11-13' | '14-17';
export type CurriculumBoard = 'NCERT' | 'CBSE' | 'ICSE' | 'IB' | 'Cambridge' | 'State Board';
export type CurriculumGrade = 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12';

interface EducationalContextType {
  ageGroup: AgeGroup | null;
  setAgeGroup: (age: AgeGroup) => void;
  curriculumBoard: CurriculumBoard | null;
  setCurriculumBoard: (board: CurriculumBoard) => void;
  curriculumGrade: CurriculumGrade | null;
  setCurriculumGrade: (grade: CurriculumGrade) => void;
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
  const [curriculumBoard, setCurriculumBoardState] = useState<CurriculumBoard | null>(null);
  const [curriculumGrade, setCurriculumGradeState] = useState<CurriculumGrade | null>(null);
  const [serverStatus, setServerStatus] = useState({
    healthy: false,
    openai: false,
    anthropic: false,
    lastChecked: null as Date | null,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedAge = localStorage.getItem('selectedAgeGroup');
    const savedBoard = localStorage.getItem('selectedCurriculumBoard');
    const savedGrade = localStorage.getItem('selectedCurriculumGrade');
    
    if (savedAge && ['5-7', '8-10', '11-13', '14-17'].includes(savedAge)) {
      setAgeGroupState(savedAge as AgeGroup);
    }
    if (savedBoard && ['NCERT', 'CBSE', 'ICSE', 'IB', 'Cambridge', 'State Board'].includes(savedBoard)) {
      setCurriculumBoardState(savedBoard as CurriculumBoard);
    }
    if (savedGrade) {
      setCurriculumGradeState(savedGrade as CurriculumGrade);
    }
  }, []);

  // Save settings to localStorage when changed
  const setAgeGroup = (age: AgeGroup) => {
    setAgeGroupState(age);
    localStorage.setItem('selectedAgeGroup', age);
  };

  const setCurriculumBoard = (board: CurriculumBoard) => {
    setCurriculumBoardState(board);
    localStorage.setItem('selectedCurriculumBoard', board);
  };

  const setCurriculumGrade = (grade: CurriculumGrade) => {
    setCurriculumGradeState(grade);
    localStorage.setItem('selectedCurriculumGrade', grade);
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
    curriculumBoard,
    setCurriculumBoard,
    curriculumGrade,
    setCurriculumGrade,
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
