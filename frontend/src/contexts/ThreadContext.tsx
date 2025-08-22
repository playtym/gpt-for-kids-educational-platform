import React, { createContext, useContext, useState, useEffect } from 'react';
import { educationalApi } from '@/api/educationalApi';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string | { content: string; metadata?: any };
  mode: string;
  socraticMode?: string;
  timestamp: Date;
  subject?: string;
  topic?: string;
  metadata?: any;
}

export interface QuizResult {
  quizId: string;
  completedAt: Date;
  score: number;
  totalQuestions: number;
  percentage: number;
  subject?: string;
  pathsCompleted: number; // How many learning paths were completed before this quiz
}

export interface ChatThread {
  id: string;
  title: string;
  funTitle?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  category: 'Space Explorer' | 'Ocean Voyager' | 'Desert Adventurer' | 'Forest Ranger' | 'Science Explorer' | 'Creative Writer' | 'Problem Solver';
  difficulty: 'easy' | 'medium' | 'hard';
  position: { x: number; y: number };
  isVisible: boolean;
  totalMessages: number;
  lastMode: string;
  subjects: string[];
  // Depth tracking for Learn mode
  learnModeData?: {
    completedPaths: number;
    currentDepthLevel: number; // Certified depth level based on quiz performance
    quizResults: QuizResult[];
    pathsInProgress: number;
  };
}

interface ThreadContextType {
  threads: ChatThread[];
  currentThreadId: string | null;
  createThread: (initialMessage?: ChatMessage) => string;
  updateThread: (threadId: string, messages: ChatMessage[]) => void;
  deleteThread: (threadId: string) => void;
  setCurrentThread: (threadId: string | null) => void;
  getCurrentThread: () => ChatThread | null;
  generateThreadTitle: (threadId: string) => Promise<void>;
  getThreadsForMap: () => ChatThread[];
  // New methods for depth tracking
  recordLearningPathCompletion: (threadId: string) => void;
  recordQuizResult: (threadId: string, quizResult: Omit<QuizResult, 'quizId' | 'completedAt' | 'pathsCompleted'>) => void;
  getThreadDepthLevel: (threadId: string) => number;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

const getContentString = (content: string | { content: string; metadata?: any } | null | undefined): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content.content) return content.content;
  return '';
};

const generateFunTitle = (messages: ChatMessage[]): string => {
  if (!messages || !Array.isArray(messages) || messages.length < 3) return 'New Chat';
  
  // Filter out invalid messages
  const validMessages = messages.filter(msg => msg && typeof msg === 'object');
  if (validMessages.length < 3) return 'New Chat';
  
  // Determine primary mode from messages
  const modes = validMessages.map(msg => msg.mode).filter(Boolean);
  const modeCount = modes.reduce((acc, mode) => {
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const primaryMode = Object.entries(modeCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'explore';
  
  // Extract key topics and subjects from the conversation
  const topics = new Set<string>();
  const subjects = new Set<string>();
  
  messages.forEach(msg => {
    if (!msg || typeof msg !== 'object') return;
    
    if (msg.subject) subjects.add(msg.subject.toLowerCase());
    if (msg.topic) topics.add(msg.topic.toLowerCase());
    
    // Extract potential topics from content - ensure content is a string
    const contentStr = getContentString(msg.content);
    if (!contentStr) return;
    
    const content = contentStr.toLowerCase();
    if (content.includes('space') || content.includes('planet') || content.includes('star')) topics.add('space');
    if (content.includes('ocean') || content.includes('sea') || content.includes('water')) topics.add('ocean');
    if (content.includes('animal') || content.includes('creature') || content.includes('wildlife')) topics.add('animals');
    if (content.includes('story') || content.includes('tale') || content.includes('adventure')) topics.add('story');
    if (content.includes('math') || content.includes('number') || content.includes('calculate')) topics.add('math');
    if (content.includes('science') || content.includes('experiment') || content.includes('discover')) topics.add('science');
    if (content.includes('history') || content.includes('ancient') || content.includes('past')) topics.add('history');
    if (content.includes('art') || content.includes('creative') || content.includes('draw')) topics.add('art');
  });
  
  // Generate mode-specific titles based on topics
  const topicArray = Array.from(topics);
  const subjectArray = Array.from(subjects);
  
  // Mode prefixes for better identification
  const modePrefix = {
    'learn': '📚',
    'explore': '🔍',
    'create': '🎨',
    'practice': '💪',
    'curriculum': '📖'
  }[primaryMode] || '💭';
  
  let baseName = '';
  
  if (topicArray.includes('space')) baseName = 'Space Quest';
  else if (topicArray.includes('ocean')) baseName = 'Ocean Deep';
  else if (topicArray.includes('animals')) baseName = 'Animal Safari';
  else if (topicArray.includes('story')) baseName = 'Story Time';
  else if (topicArray.includes('math')) baseName = 'Math Magic';
  else if (topicArray.includes('science')) baseName = 'Science Lab';
  else if (topicArray.includes('history')) baseName = 'Time Travel';
  else if (topicArray.includes('art')) baseName = 'Art Studio';
  else if (subjectArray.includes('english')) baseName = 'Word World';
  else if (subjectArray.includes('geography')) baseName = 'Map Quest';
  else if (subjectArray.includes('biology')) baseName = 'Life Study';
  else if (subjectArray.includes('physics')) baseName = 'Force Field';
  else if (subjectArray.includes('chemistry')) baseName = 'Mix Master';
  else {
    // Default fun titles based on mode
    const modeDefaults = {
      'learn': ['Study Session', 'Learn Zone', 'Knowledge Quest', 'Brain Boost'],
      'explore': ['Discovery', 'Wonder Lab', 'Fact Hunt', 'Curious Cat'],
      'create': ['Creative Corner', 'Imagination Station', 'Art Lab', 'Story Studio'],
      'practice': ['Practice Time', 'Skill Builder', 'Challenge Zone', 'Power Practice'],
      'curriculum': ['Lesson Time', 'Study Guide', 'Course Work', 'Learning Path']
    };
    
    const defaults = modeDefaults[primaryMode] || ['Smart Chat', 'Think Tank', 'Mind Quest', 'Know How'];
    baseName = defaults[Math.floor(Math.random() * defaults.length)];
  }
  
  return `${modePrefix} ${baseName}`;
};

const determineCategory = (messages: ChatMessage[]): ChatThread['category'] => {
  const topics = new Set<string>();
  
  messages.forEach(msg => {
    if (!msg || typeof msg !== 'object') return;
    
    const contentStr = getContentString(msg.content);
    if (!contentStr) return;
    
    const content = contentStr.toLowerCase();
    if (content.includes('space') || content.includes('planet') || content.includes('star') || content.includes('astronaut')) topics.add('space');
    if (content.includes('ocean') || content.includes('sea') || content.includes('water') || content.includes('fish')) topics.add('ocean');
    if (content.includes('desert') || content.includes('mountain') || content.includes('adventure') || content.includes('explore')) topics.add('adventure');
    if (content.includes('forest') || content.includes('tree') || content.includes('nature') || content.includes('animal')) topics.add('forest');
    if (content.includes('science') || content.includes('experiment') || content.includes('discovery')) topics.add('science');
    if (content.includes('story') || content.includes('creative') || content.includes('write') || content.includes('imagine')) topics.add('creative');
    if (content.includes('problem') || content.includes('solve') || content.includes('math') || content.includes('logic')) topics.add('problem');
  });
  
  if (topics.has('space')) return 'Space Explorer';
  if (topics.has('ocean')) return 'Ocean Voyager';
  if (topics.has('adventure')) return 'Desert Adventurer';
  if (topics.has('forest')) return 'Forest Ranger';
  if (topics.has('creative')) return 'Creative Writer';
  if (topics.has('problem')) return 'Problem Solver';
  return 'Science Explorer';
};

const determineDifficulty = (messages: ChatMessage[]): ChatThread['difficulty'] => {
  if (messages.length < 5) return 'easy';
  if (messages.length < 10) return 'medium';
  return 'hard';
};

const generateRandomPosition = (): { x: number; y: number } => ({
  x: Math.random() * 70 + 15, // 15-85% to avoid edges
  y: Math.random() * 70 + 15, // 15-85% to avoid edges
});

export const ThreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Load threads from localStorage on mount
  useEffect(() => {
    const savedThreads = localStorage.getItem('chatThreads');
    if (savedThreads) {
      try {
        const parsedThreads = JSON.parse(savedThreads).map((thread: any) => ({
          ...thread,
          createdAt: new Date(thread.createdAt),
          updatedAt: new Date(thread.updatedAt),
          messages: thread.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          // Add backward compatibility for learnModeData
          learnModeData: thread.learnModeData || {
            completedPaths: 0,
            currentDepthLevel: 0,
            quizResults: [],
            pathsInProgress: 0,
          },
        }));
        setThreads(parsedThreads);
      } catch (error) {
        console.error('Failed to load threads from localStorage:', error);
      }
    }
  }, []);

  // Save threads to localStorage whenever threads change
  useEffect(() => {
    localStorage.setItem('chatThreads', JSON.stringify(threads));
  }, [threads]);

  const createThread = (initialMessage?: ChatMessage): string => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Chat',
      funTitle: 'New Chat',
      messages: initialMessage ? [initialMessage] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      category: 'Science Explorer',
      difficulty: 'easy',
      position: generateRandomPosition(),
      isVisible: true,
      totalMessages: initialMessage ? 1 : 0,
      lastMode: initialMessage?.mode || 'explore',
      subjects: initialMessage?.subject ? [initialMessage.subject] : [],
      learnModeData: {
        completedPaths: 0,
        currentDepthLevel: 0,
        quizResults: [],
        pathsInProgress: 0,
      },
    };

    setThreads(prev => [newThread, ...prev]);
    return newThread.id;
  };

  const updateThread = (threadId: string, messages: ChatMessage[]) => {
    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        // Filter out invalid messages
        const validMessages = messages.filter(msg => msg && typeof msg === 'object');
        
        const updatedThread = {
          ...thread,
          messages: validMessages,
          updatedAt: new Date(),
          totalMessages: validMessages.length,
          lastMode: validMessages[validMessages.length - 1]?.mode || thread.lastMode,
          subjects: Array.from(new Set([
            ...thread.subjects,
            ...validMessages.filter(msg => msg && msg.subject).map(msg => msg.subject!)
          ])),
        };

        // Update category and difficulty based on conversation content
        if (validMessages.length >= 3) {
          updatedThread.category = determineCategory(validMessages);
          updatedThread.difficulty = determineDifficulty(validMessages);
          
          // Generate fun title if not already set or if conversation has evolved
          if (!thread.funTitle || thread.funTitle === 'New Chat' || validMessages.length % 5 === 0) {
            updatedThread.funTitle = generateFunTitle(validMessages);
            updatedThread.title = updatedThread.funTitle;
          }
        }

        return updatedThread;
      }
      return thread;
    }));
  };

  const deleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
    if (currentThreadId === threadId) {
      setCurrentThreadId(null);
    }
  };

  const setCurrentThread = (threadId: string | null) => {
    setCurrentThreadId(threadId);
  };

  const getCurrentThread = (): ChatThread | null => {
    if (!currentThreadId) return null;
    return threads.find(thread => thread.id === currentThreadId) || null;
  };

  const generateThreadTitle = async (threadId: string): Promise<void> => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread || thread.messages.length < 3) return;

    try {
      // Use the AI to generate a more sophisticated title
      const conversationSummary = thread.messages
        .slice(0, 6) // First 6 messages
        .filter(msg => msg && typeof msg === 'object') // Filter out invalid messages
        .map(msg => {
          const contentStr = getContentString(msg.content);
          return `${msg.type}: ${contentStr.substring(0, 100)}`;
        })
        .join('\n');

      // For now, we'll use the simple fun title generator
      // In the future, this could call the AI API to generate better titles
      const funTitle = generateFunTitle(thread.messages);
      
      setThreads(prev => prev.map(t => 
        t.id === threadId 
          ? { ...t, title: funTitle, funTitle, updatedAt: new Date() }
          : t
      ));
    } catch (error) {
      console.error('Failed to generate thread title:', error);
    }
  };

  const getThreadsForMap = (): ChatThread[] => {
    return threads.filter(thread => 
      thread.isVisible && 
      thread.totalMessages >= 3 && // Only show threads with substantial conversation
      thread.funTitle !== 'New Chat'
    );
  };

  // Record when a learning path is completed
  const recordLearningPathCompletion = (threadId: string) => {
    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        const learnModeData = thread.learnModeData || {
          completedPaths: 0,
          currentDepthLevel: 0,
          quizResults: [],
          pathsInProgress: 0,
        };
        
        return {
          ...thread,
          learnModeData: {
            ...learnModeData,
            completedPaths: learnModeData.completedPaths + 1,
            pathsInProgress: Math.max(0, learnModeData.pathsInProgress - 1),
          },
        };
      }
      return thread;
    }));
  };

  // Record quiz results and update depth level based on performance
  const recordQuizResult = (threadId: string, quizResult: Omit<QuizResult, 'quizId' | 'completedAt' | 'pathsCompleted'>) => {
    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        const learnModeData = thread.learnModeData || {
          completedPaths: 0,
          currentDepthLevel: 0,
          quizResults: [],
          pathsInProgress: 0,
        };
        
        const newQuizResult: QuizResult = {
          ...quizResult,
          quizId: `quiz-${Date.now()}`,
          completedAt: new Date(),
          pathsCompleted: learnModeData.completedPaths,
        };
        
        const updatedQuizResults = [...learnModeData.quizResults, newQuizResult];
        
        // Update depth level based on quiz performance (>80% required)
        let newDepthLevel = learnModeData.currentDepthLevel;
        if (quizResult.percentage >= 80) {
          newDepthLevel = learnModeData.completedPaths;
        }
        
        return {
          ...thread,
          learnModeData: {
            ...learnModeData,
            quizResults: updatedQuizResults,
            currentDepthLevel: newDepthLevel,
          },
        };
      }
      return thread;
    }));
  };

  // Get the current certified depth level for a thread
  const getThreadDepthLevel = (threadId: string): number => {
    const thread = threads.find(t => t.id === threadId);
    return thread?.learnModeData?.currentDepthLevel || 0;
  };

  const value: ThreadContextType = {
    threads,
    currentThreadId,
    createThread,
    updateThread,
    deleteThread,
    setCurrentThread,
    getCurrentThread,
    generateThreadTitle,
    getThreadsForMap,
    recordLearningPathCompletion,
    recordQuizResult,
    getThreadDepthLevel,
  };

  return (
    <ThreadContext.Provider value={value}>
      {children}
    </ThreadContext.Provider>
  );
};

export const useThreads = (): ThreadContextType => {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error('useThreads must be used within a ThreadProvider');
  }
  return context;
};

export default ThreadContext;
