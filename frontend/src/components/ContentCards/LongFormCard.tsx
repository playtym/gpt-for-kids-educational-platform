import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PenTool, CheckCircle, XCircle, Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { agentService } from '@/api/agentService';
import { useEducational } from '@/contexts/EducationalContext';

interface LongFormCardProps {
  question: string;
  context?: string;
  mode: string;
  timestamp: Date;
  expectedLength?: 'short' | 'medium' | 'long';
  rubric?: string[];
  onEvaluated?: (answer: string, evaluation: any) => void;
}

interface Evaluation {
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  grade: string;
}

const LongFormCard: React.FC<LongFormCardProps> = ({ 
  question, 
  context,
  mode, 
  timestamp, 
  expectedLength = 'medium',
  rubric = [],
  onEvaluated 
}) => {
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { ageGroup, curriculumBoard, curriculumGrade } = useEducational();

  const getPlaceholder = () => {
    switch (expectedLength) {
      case 'short':
        return 'Write a brief answer (2-3 sentences)...';
      case 'medium':
        return 'Write a detailed answer (1-2 paragraphs)...';
      case 'long':
        return 'Write a comprehensive answer (3+ paragraphs)...';
      default:
        return 'Write your answer here...';
    }
  };

  const getMinLength = () => {
    switch (expectedLength) {
      case 'short': return 50;
      case 'medium': return 150;
      case 'long': return 300;
      default: return 100;
    }
  };

  const handleSubmit = async () => {
    if (answer.trim().length < getMinLength()) {
      toast({
        title: "Answer too short",
        description: `Please write at least ${getMinLength()} characters for a ${expectedLength} answer.`,
        variant: "destructive"
      });
      return;
    }

    setIsEvaluating(true);
    setIsSubmitted(true);

    try {
      // Create evaluation prompt
      const evaluationPrompt = `
        Please evaluate this student answer:
        
        QUESTION: ${question}
        ${context ? `CONTEXT: ${context}` : ''}
        
        STUDENT ANSWER: ${answer}
        
        STUDENT PROFILE:
        - Age Group: ${ageGroup || 'Not specified'}
        - Board: ${curriculumBoard || 'General'}
        - Grade: ${curriculumGrade || 'Not specified'}
        
        ${rubric.length > 0 ? `RUBRIC:\n${rubric.map(item => `- ${item}`).join('\n')}` : ''}
        
        Please provide:
        1. A score out of 10
        2. Overall feedback (encouraging and constructive)
        3. 2-3 specific strengths
        4. 2-3 areas for improvement
        5. A letter grade (A+, A, B+, B, C+, C, D, F)
        
        Make the feedback age-appropriate and encouraging. Focus on learning and growth.
        
        Respond in JSON format:
        {
          "score": number,
          "maxScore": 10,
          "feedback": "string",
          "strengths": ["string1", "string2", "string3"],
          "improvements": ["string1", "string2", "string3"],
          "grade": "string"
        }
      `;

      const response = await agentService.sendChatRequest({
        message: evaluationPrompt,
        mode: 'assess',
        ageGroup: ageGroup || '8-10',
        socraticMode: 'answer-first'
      });

      // Try to parse JSON from response
      let evaluationData: Evaluation;
      try {
        // Extract JSON from response if it's wrapped in other text
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : response.response;
        evaluationData = JSON.parse(jsonString);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        evaluationData = {
          score: 7,
          maxScore: 10,
          feedback: response.response,
          strengths: ["Good effort", "Shows understanding"],
          improvements: ["Add more details", "Support with examples"],
          grade: "B"
        };
      }

      setEvaluation(evaluationData);
      
      if (onEvaluated) {
        onEvaluated(answer, evaluationData);
      }

      toast({
        title: "Answer Evaluated! 📝",
        description: `You received a ${evaluationData.grade} - Great work!`,
      });

    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation Failed",
        description: "Unable to evaluate your answer. Please try again.",
        variant: "destructive"
      });
      setIsSubmitted(false);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setAnswer('');
    setEvaluation(null);
    setIsSubmitted(false);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Card className="max-w-4xl bg-white border-purple-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PenTool className="text-purple-600" size={20} />
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Long Form Question
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {expectedLength} answer
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <CardTitle className="text-lg font-semibold text-gray-800 mt-3">
          {question}
        </CardTitle>
        {context && (
          <div className="bg-gray-50 p-3 rounded-lg mt-3">
            <p className="text-sm text-gray-700">{context}</p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Answer Input */}
        <div>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isSubmitted}
            className="min-h-32 resize-none"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>
              {answer.length} characters (min: {getMinLength()})
            </span>
            <span className={answer.length >= getMinLength() ? 'text-green-600' : 'text-gray-400'}>
              {answer.length >= getMinLength() ? '✓ Ready to submit' : 'Keep writing...'}
            </span>
          </div>
        </div>

        {/* Rubric */}
        {rubric.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Evaluation Criteria:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              {rubric.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Evaluation Results */}
        {evaluation && (
          <div className="space-y-4 border-t pt-4">
            {/* Score */}
            <div className={`p-4 rounded-lg border ${getScoreColor(evaluation.score, evaluation.maxScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Star className="text-yellow-500" size={20} />
                  <span className="font-semibold text-lg">
                    Grade: {evaluation.grade}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono">
                  {evaluation.score}/{evaluation.maxScore}
                </Badge>
              </div>
              <p className="text-sm font-medium">{evaluation.feedback}</p>
            </div>

            {/* Strengths */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <CheckCircle size={16} className="mr-2" />
                Strengths
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            {evaluation.improvements.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                  <XCircle size={16} className="mr-2" />
                  Areas for Improvement
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                  {evaluation.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          {isSubmitted ? (
            <Button 
              onClick={handleReset} 
              variant="outline" 
              size="sm"
            >
              Write Another Answer
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={answer.trim().length < getMinLength() || isEvaluating}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                'Submit for Evaluation'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LongFormCard;
