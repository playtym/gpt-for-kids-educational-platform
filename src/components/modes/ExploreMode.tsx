import React from 'react';
import { Compass } from 'lucide-react';
import { useContextualTopics } from '@/hooks/useContextualTopics';
import { type AgeGroup } from '@/services/QuickTopicsService';
import SuggestionCard from '@/components/shared/SuggestionCard';

interface ExploreModeProps {
  onStartExploration: (topic: string, category: string) => void;
  ageGroup: string;
  userId?: string;
  isMobile?: boolean;
}

const ExploreMode: React.FC<ExploreModeProps> = ({ onStartExploration, ageGroup, userId, isMobile = false }) => {
  const { 
    topics: quickTopics, 
    isLoading, 
    refreshTopics, 
    trackTopicUsage 
  } = useContextualTopics({
    ageGroup: ageGroup as AgeGroup,
    mode: 'explore',
    userId,
    includeTrending: true,
    includeSeasonal: true,
    includePersonalized: !!userId
  });

  const handleTopicClick = (question: string, category: string) => {
    trackTopicUsage(question);
    onStartExploration(question, category);
  };

  return (
    <SuggestionCard
      title="Explore"
      icon={Compass}
      iconColor="#007AFF"
      hoverColor="#007AFF"
      topics={quickTopics}
      isLoading={isLoading}
      onRefresh={refreshTopics}
      onTopicClick={handleTopicClick}
      isMobile={isMobile}
    />
  );
};

export default ExploreMode;
