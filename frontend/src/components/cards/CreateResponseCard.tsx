import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CreateResponseCardProps {
  content: string;
  inspirationPrompts?: string[];
  nextCreationIdeas?: string[];
  ageLevel?: '5-7' | '8-10' | '11-13' | '14-17';
  onInspiration: (prompt: string) => void;
  onNextCreation: (idea: string) => void;
  onShare?: () => void;
  onRemix?: () => void;
}

const CreateResponseCard: React.FC<CreateResponseCardProps> = ({
  content,
  inspirationPrompts = [],
  nextCreationIdeas = [],
  onInspiration,
  onNextCreation
}) => {
  return (
    <Card className="bg-white border border-blue-200">
      <CardContent className="p-4 space-y-3">
        {/* Main Content */}
        <p className="text-gray-800 leading-relaxed">{content}</p>

        {/* Inspiration Prompts */}
        {inspirationPrompts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">✨ Get inspired:</p>
            {inspirationPrompts.slice(0, 2).map((prompt, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left p-2 h-auto text-sm hover:bg-blue-50"
                onClick={() => onInspiration(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}

        {/* Next Creation Ideas */}
        {nextCreationIdeas.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">🎨 Create next:</p>
            <div className="flex flex-wrap gap-2">
              {nextCreationIdeas.slice(0, 3).map((idea, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-blue-200 hover:bg-blue-50"
                  onClick={() => onNextCreation(idea)}
                >
                  {idea}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateResponseCard;
