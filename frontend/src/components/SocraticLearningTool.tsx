import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEducational } from '@/contexts/EducationalContext';
import { educationalApi } from '@/api/educationalApi';
import { useToast } from '@/hooks/use-toast';
import { Brain, Send, AlertCircle, Lightbulb, Search, Zap } from 'lucide-react';

type LearningMode = 'socratic' | 'answer-first' | 'deep-dive';

export const SocraticLearningTool: React.FC = () => {
  const { ageGroup } = useEducational();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [conversation, setConversation] = useState<Array<{
    type: 'student' | 'teacher';
    content: string;
    timestamp: Date;
    mode?: LearningMode;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<LearningMode>('answer-first');

  const handleGoDeep = async (responseContent: string, currentSubject: string) => {
    if (!currentSubject.trim() || !ageGroup) {
      toast({
        title: 'Missing Information',
        description: 'Please make sure you have a subject selected.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Add indication that we're going deep on this topic
    const studentEntry = {
      type: 'student' as const,
      content: `Let's explore this topic deeper: "${responseContent.substring(0, 100)}..."`,
      timestamp: new Date(),
      mode: 'deep-dive' as LearningMode,
    };
    setConversation(prev => [...prev, studentEntry]);

    try {
      const response = await educationalApi.getSocraticResponse(
        responseContent,
        currentSubject,
        ageGroup,
        responseContent,
        'deep-dive'
      );

      if (response.success && response.data) {
        const teacherEntry = {
          type: 'teacher' as const,
          content: response.data.response,
          timestamp: new Date(),
          mode: 'deep-dive' as LearningMode,
        };
        setConversation(prev => [...prev, teacherEntry]);
      } else {
        throw new Error(response.error || 'Failed to get deep-dive response');
      }
    } catch (error) {
      toast({
        title: 'Deep Dive Error',
        description: 'I had trouble exploring that topic deeper. Let\'s try again!',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (mode: LearningMode = currentMode) => {
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
      mode,
    };
    setConversation(prev => [...prev, studentEntry]);

    try {
      console.log('Making API call with:', { question, subject, ageGroup, mode }); // Debug log
      
      const response = await educationalApi.getSocraticResponse(
        question,
        subject,
        ageGroup,
        question,
        mode
      );

      if (response.success && response.data) {
        const teacherEntry = {
          type: 'teacher' as const,
          content: response.data.response,
          timestamp: new Date(),
          mode,
        };
        setConversation(prev => [...prev, teacherEntry]);
      } else {
        console.error('Response failed:', response); // Debug log
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

  const getModeIcon = (mode: LearningMode) => {
    switch (mode) {
      case 'answer-first':
        return <Lightbulb size={16} />;
      case 'deep-dive':
        return <Search size={16} />;
      default:
        return <Brain size={16} />;
    }
  };

  const getModeDescription = (mode: LearningMode) => {
    switch (mode) {
      case 'answer-first':
        return 'Get an answer first, then explore deeper';
      case 'deep-dive':
        return 'Explore the topic thoroughly with connections';
      default:
        return 'Learn through guided questions';
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
          <span>Enhanced Socratic Learning Guide</span>
          <Badge variant="outline">Ages {ageGroup}</Badge>
        </CardTitle>
        <p className="text-muted-foreground">
          Choose your learning style: Get answers first, explore deeply, or discover through questions!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Learning Mode Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Learning Mode</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentMode === 'answer-first' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('answer-first')}
              className="flex items-center space-x-1"
            >
              <Lightbulb size={16} />
              <span>Answer First</span>
            </Button>
            <Button
              variant={currentMode === 'socratic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('socratic')}
              className="flex items-center space-x-1"
            >
              <Brain size={16} />
              <span>Socratic Questions</span>
            </Button>
            <Button
              variant={currentMode === 'deep-dive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMode('deep-dive')}
              className="flex items-center space-x-1"
            >
              <Search size={16} />
              <span>Deep Dive</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getModeDescription(currentMode)}
          </p>
        </div>

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
          <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {conversation.map((entry, index) => (
              <div
                key={index}
                className={`flex ${entry.type === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    entry.type === 'student'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {entry.type === 'teacher' && entry.mode && (
                    <div className="flex items-center space-x-1 mb-2 text-xs opacity-70">
                      {getModeIcon(entry.mode)}
                      <span className="capitalize">{entry.mode.replace('-', ' ')} Mode</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{entry.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    {entry.type === 'teacher' && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleGoDeep(entry.content, subject)}
                          disabled={isLoading || !subject.trim()}
                          title={!subject.trim() ? "Please enter a subject first" : "Explore this topic in depth"}
                        >
                          <Zap size={12} className="mr-1" />
                          Go Deep
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input */}
        <div>
          <label className="text-sm font-medium">Your Question or Thought</label>
          <Textarea
            placeholder="What would you like to explore? Choose your learning mode above!"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Submit Button with Quick Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={() => handleSubmit(currentMode)}
            disabled={isLoading || !question.trim() || !subject.trim()}
            className="flex-1"
          >
            {isLoading ? (
              'Thinking...'
            ) : (
              <>
                {getModeIcon(currentMode)}
                <span className="ml-2">Ask My Guide</span>
              </>
            )}
          </Button>
          
          {/* Quick Deep Dive Button */}
          {currentMode !== 'deep-dive' && question.trim() && subject.trim() && (
            <Button
              variant="outline"
              onClick={() => handleSubmit('deep-dive')}
              disabled={isLoading}
              className="flex items-center space-x-1"
              title="Explore this topic in depth"
            >
              <Search size={16} />
              <span>Deep Dive</span>
            </Button>
          )}
        </div>

        {/* Educational Notes */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-2">🎓 Learning Modes Explained:</p>
          <div className="space-y-1">
            <div className="flex items-start space-x-2">
              <Lightbulb size={14} className="mt-0.5 text-yellow-500" />
              <div>
                <span className="font-medium">Answer First:</span> Get a clear answer, then explore deeper with follow-up questions
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Brain size={14} className="mt-0.5 text-purple-500" />
              <div>
                <span className="font-medium">Socratic Questions:</span> Learn through guided questions that help you discover answers
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Search size={14} className="mt-0.5 text-blue-500" />
              <div>
                <span className="font-medium">Deep Dive:</span> Explore connections, real-world examples, and broader understanding
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs">💡 Use the "Go Deep" button on any response to explore that topic further!</p>
        </div>
      </CardContent>
    </Card>
  );
};
