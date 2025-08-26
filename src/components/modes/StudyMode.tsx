import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, RefreshCw } from 'lucide-react';
import { useCurriculumTopics } from '@/hooks/useContextualTopics';
import { type AgeGroup } from '@/services/QuickTopicsService';

interface StudyModeProps {
  onStartStudy: (action: string, subject: string, details: any) => void;
  ageGroup: string;
  curriculumBoard?: string;
  curriculumGrade?: string;
  userId?: string;
}

const StudyMode: React.FC<StudyModeProps> = ({ 
  onStartStudy, 
  ageGroup, 
  curriculumBoard = 'CBSE', 
  curriculumGrade = '8th',
  userId 
}) => {
  const { 
    topics: quickTopics, 
    isLoading, 
    refreshTopics, 
    trackTopicUsage 
  } = useCurriculumTopics(ageGroup as AgeGroup, curriculumBoard, curriculumGrade);

  const handleTopicClick = (question: string, title: string) => {
    trackTopicUsage(question);
    onStartStudy('concept-help', title, { 
      query: question, 
      board: curriculumBoard, 
      grade: curriculumGrade 
    });
  };

  return (
    <div className="flex flex-col items-center justify-end h-full max-w-2xl mx-auto px-4 pb-4">
      {/* Compact mode cards for mobile - taking only bottom 1/3 */}
      <Card className="w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-indigo-500" />
              <p className="text-sm font-medium text-gray-700">Study</p>
              {curriculumBoard && curriculumGrade && (
                <span className="text-xs text-gray-500">• {curriculumBoard} {curriculumGrade}</span>
              )}
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
                    className="w-full justify-start text-left h-auto p-2 text-xs hover:bg-indigo-50 leading-tight"
                    onClick={() => handleTopicClick(question, topic.title)}
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

export default StudyMode;
