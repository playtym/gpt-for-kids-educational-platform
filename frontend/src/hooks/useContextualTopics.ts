import { useState, useEffect, useMemo } from 'react';
import { quickTopicsService, type AgeGroup, type Mode, type QuickTopic } from '@/services/QuickTopicsService';
import { topicsConfigService } from '@/services/TopicsConfigService';

interface UseContextualTopicsProps {
  ageGroup: AgeGroup;
  mode: Mode;
  userId?: string;
  curriculumBoard?: string;
  curriculumGrade?: string;
  includePersonalized?: boolean;
  includeTrending?: boolean;
  includeSeasonal?: boolean;
}

interface UseContextualTopicsReturn {
  topics: QuickTopic[];
  trendingTopics: QuickTopic[];
  personalizedTopics: QuickTopic[];
  seasonalTopics: QuickTopic[];
  isLoading: boolean;
  refreshTopics: () => void;
  trackTopicUsage: (topic: string) => void;
}

/**
 * Hook for getting contextual quick topics based on user preferences,
 * trending topics, seasonal events, and curriculum requirements
 */
export const useContextualTopics = ({
  ageGroup,
  mode,
  userId = 'anonymous',
  curriculumBoard,
  curriculumGrade,
  includePersonalized = true,
  includeTrending = true,
  includeSeasonal = true
}: UseContextualTopicsProps): UseContextualTopicsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Get base topics for the age group and mode
  const baseTopics = useMemo(() => {
    if (mode === 'study' && curriculumBoard && curriculumGrade) {
      return quickTopicsService.getCurriculumTopics(ageGroup, curriculumBoard, curriculumGrade);
    }
    return quickTopicsService.getTopicsForAge(ageGroup, mode);
  }, [ageGroup, mode, curriculumBoard, curriculumGrade, lastRefresh]);

  // Get trending topics
  const trendingTopics = useMemo(() => {
    if (!includeTrending) return [];
    
    const trending = topicsConfigService.getTrendingTopicsFor(ageGroup, mode);
    // Convert trending keywords to QuickTopic format
    return trending.slice(0, 2).map((trend, index) => ({
      icon: baseTopics[index % baseTopics.length]?.icon || baseTopics[0]?.icon,
      title: `🔥 ${trend.keyword}`,
      color: 'text-red-500',
      questions: [
        `Tell me about ${trend.keyword}`,
        `How does ${trend.keyword} affect us?`,
        `What's new with ${trend.keyword}?`
      ]
    }));
  }, [ageGroup, mode, includeTrending, baseTopics, lastRefresh]);

  // Get personalized topics
  const personalizedTopics = useMemo(() => {
    if (!includePersonalized || userId === 'anonymous') return [];
    
    const userPrefs = topicsConfigService.getUserPreferences(userId);
    if (userPrefs.interests.length === 0) return [];

    return quickTopicsService.getPersonalizedTopics(ageGroup, mode, userPrefs.interests);
  }, [ageGroup, mode, userId, includePersonalized, lastRefresh]);

  // Get seasonal topics
  const seasonalTopics = useMemo(() => {
    if (!includeSeasonal) return [];
    
    return quickTopicsService.getSeasonalTopics(ageGroup, mode);
  }, [ageGroup, mode, includeSeasonal, lastRefresh]);

  // Combine all topics intelligently
  const topics = useMemo(() => {
    const allTopics: QuickTopic[] = [];
    
    // Start with base topics
    allTopics.push(...baseTopics);
    
    // Add trending topics if any
    if (trendingTopics.length > 0) {
      // Replace or prepend some base topics with trending
      allTopics.splice(0, Math.min(2, trendingTopics.length), ...trendingTopics);
    }
    
    // Mix in personalized topics
    if (personalizedTopics.length > 0) {
      // Replace some topics with personalized ones
      const personalizedCount = Math.min(2, personalizedTopics.length);
      allTopics.splice(-personalizedCount, personalizedCount, ...personalizedTopics.slice(0, personalizedCount));
    }
    
    // Add seasonal topics if available
    if (seasonalTopics.length > 0) {
      // Add one seasonal topic
      allTopics.splice(1, 0, seasonalTopics[0]);
    }
    
    // Ensure we don't exceed a reasonable number of topics
    return allTopics.slice(0, 6);
  }, [baseTopics, trendingTopics, personalizedTopics, seasonalTopics]);

  // Track topic usage
  const trackTopicUsage = (topic: string) => {
    if (userId !== 'anonymous') {
      // Track completed topic
      topicsConfigService.trackCompletedTopic(userId, topic);
      
      // Try to extract keywords and boost trending topics
      const words = topic.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) { // Only significant words
          topicsConfigService.updateTopicPopularity(word, 0.1);
        }
      });
    }
  };

  // Refresh topics
  const refreshTopics = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastRefresh(Date.now());
      setIsLoading(false);
    }, 500); // Simulate loading
  };

  // Auto-refresh topics periodically (e.g., daily)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTopics();
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, []);

  return {
    topics,
    trendingTopics,
    personalizedTopics,
    seasonalTopics,
    isLoading,
    refreshTopics,
    trackTopicUsage
  };
};

/**
 * Simplified hook for basic topic usage
 */
export const useQuickTopics = (ageGroup: AgeGroup, mode: Mode) => {
  return useContextualTopics({
    ageGroup,
    mode,
    includePersonalized: false,
    includeTrending: false,
    includeSeasonal: false
  });
};

/**
 * Hook for getting curriculum-specific topics
 */
export const useCurriculumTopics = (
  ageGroup: AgeGroup,
  board: string,
  grade: string
) => {
  return useContextualTopics({
    ageGroup,
    mode: 'study',
    curriculumBoard: board,
    curriculumGrade: grade,
    includePersonalized: false,
    includeTrending: false,
    includeSeasonal: false
  });
};

export default useContextualTopics;
