import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StudyResponseCardProps {
  content: string;
  subject?: string;
  practiceQuestions?: string[];
  relatedTopics?: string[];
  onPracticeQuestion: (question: string) => void;
  onRelatedTopic: (topic: string) => void;
  onKeyTerm?: (term: string) => void;
  onQuickReview?: () => void;
}

const StudyResponseCard: React.FC<StudyResponseCardProps> = ({
  content,
  subject,
  practiceQuestions = [],
  relatedTopics = [],
  onPracticeQuestion,
  onRelatedTopic
}) => {
  return (
    <Card className="bg-white border border-blue-200">
      <CardContent className="p-4 space-y-3">
        {/* Main Content */}
        <p className="text-gray-800 leading-relaxed">{content}</p>

        {/* Practice Questions */}
        {practiceQuestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">💪 Practice:</p>
            {practiceQuestions.slice(0, 2).map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left p-2 h-auto text-sm hover:bg-blue-50"
                onClick={() => onPracticeQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">📚 Related:</p>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.slice(0, 3).map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-blue-200 hover:bg-blue-50"
                  onClick={() => onRelatedTopic(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyResponseCard;
