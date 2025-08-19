import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEducational } from '@/contexts/EducationalContext';
import { educationalApi } from '@/api/educationalApi';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, AlertCircle, ThumbsUp } from 'lucide-react';

export const FeedbackTool: React.FC = () => {
  const { ageGroup } = useEducational();
  const { toast } = useToast();
  const [studentWork, setStudentWork] = useState('');
  const [workType, setWorkType] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!studentWork.trim() || !workType.trim() || !ageGroup) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your work and specify what type of work it is.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      const response = await educationalApi.provideFeedback(studentWork, workType, ageGroup);

      if (response.success && response.data) {
        setFeedback(response.data.feedback);
        toast({
          title: 'Feedback Ready!',
          description: 'Your encouraging feedback is ready to read.',
        });
      } else {
        throw new Error(response.error || 'Failed to generate feedback');
      }
    } catch (error) {
      toast({
        title: 'Feedback Error',
        description: 'I had trouble giving feedback. Let\'s try again!',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setStudentWork('');
    setWorkType('');
    setFeedback('');
  };

  if (!ageGroup) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle size={20} />
            <p>Please select your age group first to use the Feedback tool.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="text-blue-600" size={24} />
          <span>Constructive Feedback Helper</span>
          <Badge variant="outline">Ages {ageGroup}</Badge>
        </CardTitle>
        <p className="text-muted-foreground">
          Share your work and get encouraging, helpful feedback to help you improve!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!feedback ? (
          <>
            {/* Work Type Input */}
            <div>
              <label className="text-sm font-medium">Type of Work</label>
              <Input
                placeholder="What kind of work is this? (e.g., essay, math problem, drawing, project)"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Student Work Input */}
            <div>
              <label className="text-sm font-medium">Your Work</label>
              <Textarea
                placeholder="Paste or describe your work here. I'll give you encouraging feedback to help you improve!"
                value={studentWork}
                onChange={(e) => setStudentWork(e.target.value)}
                className="mt-1"
                rows={6}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !studentWork.trim() || !workType.trim()}
              className="w-full"
            >
              {isLoading ? (
                'Preparing Feedback...'
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Get Encouraging Feedback
                </>
              )}
            </Button>

            {/* Feedback Guidelines */}
            <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
              <p className="font-medium mb-1">💝 What You'll Get:</p>
              <ul className="space-y-1">
                <li>• Positive, encouraging feedback</li>
                <li>• Recognition of what you did well</li>
                <li>• Gentle suggestions for improvement</li>
                <li>• Age-appropriate language and advice</li>
                <li>• Motivation to keep learning and growing</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Feedback Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <ThumbsUp className="text-green-600" size={20} />
                  <span>Your Feedback</span>
                </h3>
                <Button variant="outline" onClick={clearAll}>
                  Get More Feedback
                </Button>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="prose prose-sm max-w-none">
                  {feedback.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-gray-800 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Work Details */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Work Type: {workType}
                </Badge>
                <Badge variant="secondary">
                  Age Level: {ageGroup}
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Constructive Feedback
                </Badge>
              </div>

              {/* Reflection Questions */}
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="font-medium text-yellow-800 mb-2">🤔 Think About This:</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• What did you learn from this feedback?</li>
                  <li>• Which suggestions will you try first?</li>
                  <li>• What are you most proud of in your work?</li>
                  <li>• How will you apply this learning to future work?</li>
                </ul>
              </div>

              {/* Encouragement */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-purple-800 font-medium">🌟 Remember:</p>
                <p className="text-purple-700 text-sm mt-1">
                  Every piece of work is a step in your learning journey. Keep practicing, keep growing, and keep being curious!
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
