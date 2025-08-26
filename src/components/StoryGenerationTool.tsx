import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useEducational } from '@/contexts/EducationalContext';
import { educationalApi } from '@/api/educationalApi';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export const StoryGenerationTool: React.FC = () => {
  const { ageGroup } = useEducational();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState<'short' | 'medium'>('short');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || !ageGroup) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a topic for your story.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setStory('');

    try {
      const response = await educationalApi.generateStory(topic, ageGroup, duration);

      if (response.success && response.data) {
        setStory(response.data.story);
        toast({
          title: 'Story Created!',
          description: 'Your educational story is ready to read.',
        });
      } else {
        throw new Error(response.error || 'Failed to generate story');
      }
    } catch (error) {
      toast({
        title: 'Story Creation Error',
        description: 'I had trouble creating that story. Let\'s try a different topic!',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearStory = () => {
    setStory('');
    setTopic('');
  };

  if (!ageGroup) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-orange-600">
            <AlertCircle size={20} />
            <p>Please select your age group first to use the Story Generator.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="text-green-600" size={24} />
          <span>Educational Story Generator</span>
          <Badge variant="outline">Ages {ageGroup}</Badge>
        </CardTitle>
        <p className="text-muted-foreground">
          Create fun, educational stories with positive messages and learning opportunities!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!story ? (
          <>
            {/* Topic Input */}
            <div>
              <label className="text-sm font-medium">Story Topic</label>
              <Input
                placeholder="What would you like the story to be about? (e.g., friendship, space, animals)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            {/* Duration Selection */}
            <div>
              <label className="text-sm font-medium">Story Length</label>
              <RadioGroup
                value={duration}
                onValueChange={(value) => setDuration(value as 'short' | 'medium')}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="short" id="short" />
                  <Label htmlFor="short">Short (2-3 paragraphs)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium (4-5 paragraphs)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="w-full"
            >
              {isLoading ? (
                'Creating Your Story...'
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Educational Story
                </>
              )}
            </Button>

            {/* Story Guidelines */}
            <div className="text-xs text-muted-foreground p-3 bg-green-50 rounded-lg">
              <p className="font-medium mb-1">🌟 Story Features:</p>
              <ul className="space-y-1">
                <li>• Age-appropriate vocabulary and themes</li>
                <li>• Positive messages and life lessons</li>
                <li>• Educational value woven into the plot</li>
                <li>• Safe, wholesome content for children</li>
                <li>• Encourages creativity and imagination</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Generated Story */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Story</h3>
                <Button variant="outline" onClick={clearStory}>
                  Create New Story
                </Button>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
                <div className="prose prose-sm max-w-none">
                  {story.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Story Actions */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Topic: {topic}
                </Badge>
                <Badge variant="secondary">
                  Length: {duration}
                </Badge>
                <Badge variant="secondary">
                  Age Level: {ageGroup}
                </Badge>
              </div>

              {/* Learning Questions */}
              <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <p className="font-medium text-orange-800 mb-2">💭 Think About This:</p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• What was the main lesson in this story?</li>
                  <li>• How did the characters solve their problem?</li>
                  <li>• What would you do in a similar situation?</li>
                  <li>• Can you think of a different ending?</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
