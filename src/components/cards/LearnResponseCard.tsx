  import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle, BookOpen, Target, Trophy, Star, AlertCircle, ThumbsUp, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LearningStepMetadata {
  stepNumber?: number;
  totalSteps?: number;
  progress?: number;
  title?: string;
  isLearningPath: boolean;
  isCorrect?: boolean;
  score?: number;
  canProceed?: boolean;
  practiceQuestions?: string[];
  summary?: any;
  feedbackType?: string;
  stepType?: string;
  nextTopics?: Array<{
    topic: string;
    description: string;
    difficulty: string;
    estimatedSteps: number;
  }>;
  [key: string]: any;
}

interface LearnResponseCardProps {
  content: string;
  question?: string;
  metadata?: LearningStepMetadata;
  onAnswer: (answer: string) => void;
  onNextStep: () => void;
  onAbandon: () => void;
  onStartQuiz: () => void;
  onFollowUpTopic?: (topic: string) => void;
  isLoading?: boolean;
  // Legacy props for backward compatibility
  thinkingPrompts?: string[];
  nextSteps?: string[];
  subject?: string;
  onThinkingPrompt?: (prompt: string) => void;
}

const LearnResponseCard: React.FC<LearnResponseCardProps> = ({
  content,
  question,
  metadata,
  onAnswer,
  onNextStep,
  onAbandon,
  onStartQuiz,
  onFollowUpTopic,
  isLoading = false,
  // Legacy props
  thinkingPrompts = [],
  nextSteps = [],
  subject,
  onThinkingPrompt
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
      setAnswer('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // Check if this is the new learning path system
  const isLearningPath = metadata?.isLearningPath;

  // Legacy support for old interface
  if (!isLearningPath && (thinkingPrompts.length > 0 || nextSteps.length > 0)) {
    return (
      <Card className="bg-white border border-green-200 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <p className="text-gray-800 leading-relaxed">{content}</p>

          {thinkingPrompts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-700">Think about:</h4>
              <div className="space-y-1">
                {thinkingPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => onThinkingPrompt?.(prompt)}
                    className="w-full justify-start text-left text-green-600 hover:bg-green-50 h-auto p-2"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {nextSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-700">Next steps:</h4>
              <div className="space-y-1">
                {nextSteps.map((step, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onNextStep()}
                    className="w-full text-green-600 border-green-200 hover:bg-green-50"
                  >
                    {step}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Determine card type based on metadata
  const getCardType = () => {
    if (!metadata?.isLearningPath) return 'traditional';
    if (metadata.stepType === 'journey_complete') return 'completion';
    if (metadata.feedbackType === 'answer_evaluation') return 'feedback';
    if (metadata.feedbackType === 'gentle_redirect') return 'nudge';
    if (metadata.feedbackType === 'abandon_choice') return 'abandon_choice';
    return 'learning_step';
  };

  const cardType = getCardType();

  // Learning step (content + question)
  if (cardType === 'learning_step') {
    return (
      <Card className="bg-white border border-green-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="text-green-600" size={20} />
              <span className="font-semibold text-green-800">
                Step {metadata?.stepNumber} of {metadata?.totalSteps}
              </span>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-300">
              {metadata?.title}
            </Badge>
          </div>

          {metadata?.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Learning Progress</span>
                <span>{metadata.progress}%</span>
              </div>
              <Progress value={metadata.progress} className="h-2 bg-green-100" />
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-gray-800 leading-relaxed mb-4">
              {content}
            </div>

            {question && (
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium mb-3">
                  💭 Think about this: {question}
                </p>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAbandon}
              className="text-gray-500 hover:text-gray-700"
            >
              Take a break
            </Button>
            <div className="text-xs text-gray-500">
              Learning journey in progress...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Feedback on student answer
  if (cardType === 'feedback') {
    const isCorrect = metadata?.isCorrect;
    const score = metadata?.score || 0;
    
    // Determine feedback color based on score and correctness
    const getFeedbackColor = () => {
      if (isCorrect || score >= 80) {
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          borderAccent: 'border-green-100',
          icon: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700'
        };
      } else if (score >= 50 || (!isCorrect && score > 0)) {
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          borderAccent: 'border-orange-100',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      } else {
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          borderAccent: 'border-red-100',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700'
        };
      }
    };

    const colors = getFeedbackColor();
    
    return (
      <Card className={`bg-white ${colors.border} shadow-sm`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            {isCorrect ? (
              <CheckCircle className={colors.icon} size={20} />
            ) : score >= 50 ? (
              <ThumbsUp className={colors.icon} size={20} />
            ) : (
              <XCircle className={colors.icon} size={20} />
            )}
            <span className="font-semibold text-gray-800">
              {isCorrect || score >= 80 ? 'Great thinking!' : 
               score >= 50 ? 'Getting there!' : 
               'Let\'s try again!'}
            </span>
            {score > 0 && (
              <Badge variant="outline" className="ml-auto">
                {score}%
              </Badge>
            )}
          </div>
          
          <div className={`${colors.bg} p-3 rounded-lg ${colors.borderAccent}`}>
            <div className="text-gray-800 leading-relaxed">
              {content}
            </div>
          </div>

          {metadata?.canProceed && (
            <div className="flex justify-center pt-2">
              <Button 
                onClick={onNextStep}
                className={colors.button}
                disabled={isLoading}
              >
                Continue Learning <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Learning journey completion
  if (cardType === 'completion') {
    return (
      <Card className="bg-white border border-green-200 shadow-sm max-w-full">
        <CardContent className="p-4 space-y-4">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Trophy className="text-green-500" size={48} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-green-800 break-words">🎉 Journey Complete!</h3>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-left">
                <div className="text-gray-800 leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere">
                  {content}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 break-words">What's next?</h4>
              
              {/* Follow-up topic suggestions */}
              {metadata?.nextTopics && metadata.nextTopics.length > 0 && onFollowUpTopic && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-green-700">🚀 Go Deeper:</h5>
                  <div className="space-y-2">
                    {metadata.nextTopics.map((nextTopic, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => onFollowUpTopic(nextTopic.topic)}
                        disabled={isLoading}
                        className="w-full text-left h-auto p-3 border-green-200 hover:border-green-300 hover:bg-green-50"
                      >
                        <div className="space-y-1 w-full">
                          <div className="font-medium text-green-800 text-sm break-words">
                            {nextTopic.topic}
                          </div>
                          <div className="text-xs text-gray-600 break-words">
                            {nextTopic.description} • {nextTopic.estimatedSteps} steps
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <div className="border-t border-green-200 pt-3">
                    <p className="text-xs text-green-600 mb-2">Or test your knowledge:</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={onStartQuiz}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Star size={16} className="mr-2" />
                  Take Practice Quiz
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default fallback - traditional learning
  return (
    <Card className="bg-white border border-green-200 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="text-green-600" size={20} />
          <span className="font-semibold text-green-800">Learning Together</span>
        </div>
        
        <div className="text-gray-800 leading-relaxed">
          {content}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearnResponseCard;
