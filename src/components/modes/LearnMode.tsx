import React from 'react';
import { Brain } from 'lucide-react';
import { useContextualTopics } from '@/hooks/useContextualTopics';
import { type AgeGroup } from '@/services/QuickTopicsService';
import SuggestionCard from '@/components/shared/SuggestionCard';

interface LearnModeProps {
  onStartLearning: (query: string, socraticMode: string, subject?: string) => void;
  ageGroup: string;
  userId?: string;
  isMobile?: boolean;
}

const LearnMode: React.FC<LearnModeProps> = ({ onStartLearning, ageGroup, userId, isMobile = false }) => {
  const { 
    topics: quickTopics, 
    isLoading, 
    refreshTopics, 
    trackTopicUsage 
  } = useContextualTopics({
    ageGroup: ageGroup as AgeGroup,
    mode: 'learn',
    userId,
    includeTrending: true,
    includeSeasonal: true,
    includePersonalized: !!userId
  });

  const handleTopicClick = (question: string, title: string) => {
    trackTopicUsage(question);
    onStartLearning(question, 'answer-first', title);
  };

  return (
    <SuggestionCard
      title="Learn"
      icon={Brain}
      iconColor="#AF52DE"
      hoverColor="#AF52DE"
      topics={quickTopics}
      isLoading={isLoading}
      onRefresh={refreshTopics}
      onTopicClick={handleTopicClick}
      isMobile={isMobile}
    />
  );
};

export default LearnMode;
