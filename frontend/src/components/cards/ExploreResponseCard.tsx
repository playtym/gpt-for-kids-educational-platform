import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Lightbulb, Image as ImageIcon } from 'lucide-react';

interface ExploreResponseCardProps {
  shortAnswer: string;
  followUpQuestions?: string[]; // Now treated as exploration suggestions
  relatedTopics?: string[];
  relevantImage?: {
    url: string;
    title: string;
    source?: string;
  } | null;
  onFollowUp: (suggestion: string) => void;
  onExploreConnection: (connection: string) => void;
}

const ExploreResponseCard: React.FC<ExploreResponseCardProps> = ({
  shortAnswer,
  followUpQuestions = [],
  relatedTopics = [],
  relevantImage,
  onFollowUp,
  onExploreConnection
}) => {
  return (
    <Card className="bg-white border border-blue-200 shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Relevant Image */}
        {relevantImage && relevantImage.url && (
          <div className="mb-4">
            <img 
              src={relevantImage.url} 
              alt={relevantImage.title || 'Educational image'}
              className="w-full h-40 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                // Hide image container if it fails to load
                const parent = e.currentTarget.parentElement;
                if (parent) parent.style.display = 'none';
              }}
            />
            {(relevantImage.title || relevantImage.source) && (
              <p className="text-xs text-gray-500 mt-2 text-center bg-gray-50 p-1 rounded">
                {relevantImage.title || 'Educational image'}
                {relevantImage.source && ` • ${relevantImage.source}`}
              </p>
            )}
          </div>
        )}

        {/* Short Answer */}
        <div className="text-gray-800 leading-relaxed font-medium">
          {shortAnswer}
        </div>

        {/* Exploration Suggestions */}
        {followUpQuestions.length > 0 && (
          <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Search size={16} />
              <span>Continue exploring:</span>
            </div>
            
            <div className="space-y-2">
              {followUpQuestions.slice(0, 3).map((suggestion, index) => {
                // Convert questions to exploration suggestions
                let exploreSuggestion = suggestion;
                if (suggestion.includes('?')) {
                  // Transform questions into exploration suggestions
                  exploreSuggestion = suggestion
                    .replace(/^(What|How|Why|Where|When|Which)\s+/i, '')
                    .replace(/\?$/, '')
                    .replace(/^(do|does|is|are|can|could|would|will)\s+/i, '')
                    .replace(/^(you|we)\s+/i, '')
                    .trim();
                  
                  // Add exploration prefix
                  if (exploreSuggestion.length > 0) {
                    exploreSuggestion = `Explore ${exploreSuggestion.charAt(0).toLowerCase() + exploreSuggestion.slice(1)}`;
                  }
                }
                
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-between text-left p-2 h-auto hover:bg-blue-100 hover:border-blue-200 transition-all group border border-transparent text-sm"
                    onClick={() => onFollowUp(exploreSuggestion)}
                  >
                    <span className="text-blue-800 flex-1 text-wrap break-words">
                      {exploreSuggestion.length > 60 ? `${exploreSuggestion.substring(0, 60)}...` : exploreSuggestion}
                    </span>
                    <ArrowRight size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="space-y-2 pt-2 bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Lightbulb size={16} />
              <span>Related topics:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {relatedTopics.slice(0, 2).map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors text-green-800"
                  onClick={() => onExploreConnection(topic)}
                >
                  {topic.length > 25 ? `${topic.substring(0, 25)}...` : topic}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExploreResponseCard;
