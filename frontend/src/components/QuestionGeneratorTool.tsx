import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEducational } from '@/contexts/EducationalContext';
import { educationalApi } from '@/api/educationalApi';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';

export const QuestionGeneratorTool: React.FC = () => {
  const { ageGroup } = useEducational();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<Array<{
    topic: string;
    question: string;
    timestamp: Date;
  }>>([]);

  const handleGenerate = async () => {
    if (!topic.trim() || !ageGroup) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a topic to generate questions about.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await educationalApi.generateQuestion(topic, ageGroup);

      if (response.success && response.data) {
        const newQuestion = response.data.question;
        setQuestion(newQuestion);
        
        // Add to history
        setQuestionHistory(prev => [
          {
            topic,
            question: newQuestion,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4) // Keep last 5 questions
        ]);

        toast({
          title: 'Question Generated!',
          description: 'A thought-provoking question is ready for you.',
        });
      } else {
        throw new Error(response.error || 'Failed to generate question');
      }
    } catch (error) {
      toast({
        title: 'Question Generation Error',
        description: 'I had trouble creating a question. Let\'s try a different topic!',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnother = () => {
    setQuestion('');
    handleGenerate();
  };

  const clearAll = () => {
    setTopic('');
    setQuestion('');
    setQuestionHistory([]);
  };

  if (!ageGroup) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle size={20} />
            <p>Please select your age group first to use the Question Generator.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <HelpCircle className="text-orange-600" size={24} />
          <span>Thoughtful Question Generator</span>
          <Badge variant="outline">Ages {ageGroup}</Badge>
        </CardTitle>
        <p className="text-muted-foreground">
          Generate thought-provoking questions that encourage deep thinking and discussion!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Topic Input */}
        <div>
          <label className="text-sm font-medium">Topic to Explore</label>
          <Input
            placeholder="What topic would you like to think about? (e.g., friendship, space, nature, technology)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1"
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !topic.trim()}
          className="w-full"
        >
          {isLoading ? (
            'Creating Question...'
          ) : (
            <>
              <Lightbulb size={16} className="mr-2" />
              Generate Thoughtful Question
            </>
          )}
        </Button>

        {/* Current Question */}
        {question && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Question to Explore</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={generateAnother}>
                  <RefreshCw size={14} className="mr-1" />
                  Another Question
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-l-4 border-orange-400">
              <div className="flex items-start space-x-3">
                <HelpCircle className="text-orange-600 mt-1" size={20} />
                <div>
                  <p className="text-lg text-gray-800 leading-relaxed font-medium">
                    {question}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Topic: {topic}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Discussion Tips */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800 mb-2">💡 Discussion Tips:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• There's no single "right" answer to this question</li>
                <li>• Think about different perspectives and possibilities</li>
                <li>• Share your thoughts with friends, family, or classmates</li>
                <li>• Use examples from your own experience</li>
                <li>• Ask follow-up questions to explore deeper</li>
              </ul>
            </div>
          </div>
        )}

        {/* Question History */}
        {questionHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Recent Questions</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {questionHistory.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-800 mb-1">{item.question}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">
                      {item.topic}
                    </Badge>
                    <span>{item.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool Guidelines */}
        <div className="text-xs text-muted-foreground p-3 bg-orange-50 rounded-lg">
          <p className="font-medium mb-1">🎯 What Makes a Great Question:</p>
          <ul className="space-y-1">
            <li>• Encourages critical thinking and reflection</li>
            <li>• Has multiple possible answers or perspectives</li>
            <li>• Connects to real-life experiences</li>
            <li>• Promotes discussion and exploration</li>
            <li>• Helps you understand topics more deeply</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
