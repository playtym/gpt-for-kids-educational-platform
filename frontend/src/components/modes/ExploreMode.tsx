import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, RefreshCw } from 'lucide-react';
import { useContextualTopics } from '@/hooks/useContextualTopics';
import { type AgeGroup } from '@/services/QuickTopicsService';

interface ExploreModeProps {
  onStartExploration: (topic: string, category: string) => void;
  ageGroup: string;
  userId?: string;
}

const ExploreMode: React.FC<ExploreModeProps> = ({ onStartExploration, ageGroup, userId }) => {
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
    <div className="flex flex-col items-center justify-end h-full max-w-2xl mx-auto px-4 pb-4">
      {/* Compact mode cards for mobile - taking only bottom 1/3 */}
      <Card className="w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-blue-500" />
              <p className="text-sm font-medium text-gray-700">Explore</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTopics}
              disabled={isLoading}
              className="h-auto p-1"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            </Button>
          </div>
          
          {/* Compact grid layout */}
          <div className="grid grid-cols-2 gap-2">
            {quickTopics.slice(0, 4).map((topic) => (
              <div key={topic.title} className="space-y-1">
                {topic.questions.slice(0, 2).map((question, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 text-xs hover:bg-blue-50 leading-tight"
                    onClick={() => handleTopicClick(question, topic.title.toLowerCase())}
                  >
                    <span className="truncate">{question}</span>
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExploreMode;
