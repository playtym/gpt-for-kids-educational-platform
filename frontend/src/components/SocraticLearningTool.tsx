import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEducational } from '@/contexts/EducationalContext';
import { educationalApi } from '@/api/educationalApi';
import { useToast } from '@/hooks/use-toast';
import { Brain, Send, AlertCircle } from 'lucide-react';

export const SocraticLearningTool: React.FC = () => {
  const { ageGroup } = useEducational();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [conversation, setConversation] = useState<Array<{
    type: 'student' | 'teacher';
    content: string;
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || !subject.trim() || !ageGroup) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your question and subject.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Add student question to conversation
    const studentEntry = {
      type: 'student' as const,
      content: question,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, studentEntry]);

    try {
      console.log('Making API call with:', { question, subject, ageGroup }); // Debug log
      
      const response = await educationalApi.getSocraticResponse(
        question,
        subject,
        ageGroup,
        question
      );

      console.log('Full API Response:', response); // Debug log
      console.log('Response success:', response.success); // Debug log
      console.log('Response data:', response.data); // Debug log
      console.log('Response error:', response.error); // Debug log

      if (response.success && response.data) {
        const teacherEntry = {
          type: 'teacher' as const,
          content: response.data.response,
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, teacherEntry]);
      } else {
        console.error('Response failed:', response); // Debug log
        console.error('Error details:', response.error); // Debug log
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      toast({
        title: 'Learning Helper Error',
        description: 'I had trouble helping with that question. Let\'s try again!',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!ageGroup) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle size={20} />
            <p>Please select your age group first to use the Socratic Learning tool.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="text-purple-600" size={24} />
          <span>Socratic Learning Guide</span>
          <Badge variant="outline">Ages {ageGroup}</Badge>
        </CardTitle>
        <p className="text-muted-foreground">
          Ask questions and I'll help you discover the answers through guided thinking!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subject Input */}
        <div>
          <label className="text-sm font-medium">Subject</label>
          <Input
            placeholder="What subject are you learning about? (e.g., Math, Science, History)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {conversation.map((entry, index) => (
              <div
                key={index}
                className={`flex ${entry.type === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    entry.type === 'student'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <p className="text-sm">{entry.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input */}
        <div>
          <label className="text-sm font-medium">Your Question or Thought</label>
          <Textarea
            placeholder="What would you like to explore? I'll help guide you to discover the answer!"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !question.trim() || !subject.trim()}
          className="w-full"
        >
          {isLoading ? (
            'Thinking...'
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Ask My Guide
            </>
          )}
        </Button>

        {/* Educational Notes */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-1">💡 How Socratic Learning Works:</p>
          <ul className="space-y-1">
            <li>• I won't give you direct answers to homework</li>
            <li>• Instead, I'll ask questions to help you think</li>
            <li>• This helps you learn better and understand deeper</li>
            <li>• Keep asking follow-up questions as you discover more!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
