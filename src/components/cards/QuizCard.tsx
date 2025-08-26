import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Trophy, Brain, Target, Star } from 'lucide-react';
import { useThreads } from '@/contexts/ThreadContext';

interface QuizQuestion {
  id: number;
  question: string;
  type: string;
  options: Array<{
    letter: string;
    text: string;
  }>;
  correctAnswer: string;
  explanation: string;
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  learningObjectives: string[];
  ageGroup: string;
  totalQuestions: number;
}

interface QuizCardProps {
  quiz: QuizData;
  metadata?: {
    isQuiz: boolean;
    isComprehensive: boolean;
    questionCount: number;
    ageGroup: string;
  };
  onComplete?: (results: any) => void;
  threadId?: string; // For tracking depth
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, metadata, onComplete, threadId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const { recordQuizResult, recordLearningPathCompletion, currentThreadId } = useThreads();
  const activeThreadId = threadId || currentThreadId;

  const handleAnswerSelect = (questionId: number, answer: string) => {
    if (!showResults) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
  };

  const goToNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitQuiz = () => {
    setShowResults(true);
    setIsComplete(true);
    
    // Calculate results
    const correct = quiz.questions.filter(q => 
      answers[q.id] === q.correctAnswer
    ).length;
    
    const percentage = Math.round((correct / quiz.questions.length) * 100);
    
    const results = {
      total: quiz.questions.length,
      correct,
      percentage,
      answers
    };

    // Record quiz result for depth tracking
    if (activeThreadId && metadata?.isComprehensive) {
      recordQuizResult(activeThreadId, {
        score: correct,
        totalQuestions: quiz.questions.length,
        percentage,
        subject: quiz.title,
      });
      
      // If this is a comprehensive quiz after completing a learning path, 
      // also record the path completion if score is good
      if (percentage >= 80) {
        recordLearningPathCompletion(activeThreadId);
      }
    }

    onComplete?.(results);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setIsComplete(false);
  };

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === quiz.questions.length;

  // Get age-appropriate styling
  const getAgeAppropriateStyle = (ageGroup: string) => {
    switch (ageGroup) {
      case '5-7':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          accent: 'text-orange-700',
          button: 'bg-orange-500 hover:bg-orange-600'
        };
      case '8-10':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200', 
          accent: 'text-blue-700',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      case '11-13':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          accent: 'text-purple-700',
          button: 'bg-purple-500 hover:bg-purple-600'
        };
      default: // 14-17
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          accent: 'text-green-700',
          button: 'bg-green-500 hover:bg-green-600'
        };
    }
  };

  const style = getAgeAppropriateStyle(quiz.ageGroup);

  if (isComplete && showResults) {
    const correct = quiz.questions.filter(q => 
      answers[q.id] === q.correctAnswer
    ).length;
    const percentage = Math.round((correct / quiz.questions.length) * 100);

    return (
      <Card className={`${style.bg} ${style.border} shadow-sm`}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Trophy className="text-green-500" size={48} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800">Quiz Complete! 🎉</h3>
            <div className={`${style.bg} p-4 rounded-lg border ${style.border}`}>
              <div className="text-lg font-semibold text-gray-800">
                You scored {correct} out of {quiz.questions.length} questions correctly!
              </div>
              <div className={`text-2xl font-bold ${style.accent} mt-2`}>
                {percentage}%
              </div>
            </div>
          </div>

          {quiz.learningObjectives && quiz.learningObjectives.length > 0 && (
            <div className="text-left space-y-2">
              <h4 className="font-semibold text-gray-700">🎯 What you demonstrated:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {quiz.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star size={12} className="text-green-500 mt-1 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button 
              onClick={resetQuiz}
              variant="outline"
              className="border-gray-300"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${style.bg} ${style.border} shadow-sm`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={style.accent} size={24} />
            <div>
              <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
              <p className="text-sm text-gray-600 font-normal">{quiz.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={style.accent}>
            {quiz.ageGroup} years
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Question */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">
            {currentQ.question}
          </h4>

          <div className="space-y-2">
            {currentQ.options.map((option) => {
              const isSelected = answers[currentQ.id] === option.letter;
              const isCorrect = option.letter === currentQ.correctAnswer;
              const showResult = showResults && isSelected;

              return (
                <button
                  key={option.letter}
                  onClick={() => handleAnswerSelect(currentQ.id, option.letter)}
                  disabled={showResults}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? showResults
                        ? isCorrect
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                        : `${style.bg} ${style.border}`
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>{option.letter}.</strong> {option.text}
                    </span>
                    {showResult && (
                      isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {showResults && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Explanation:</strong> {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={goToPrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {answeredCount} of {quiz.questions.length} answered
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              onClick={submitQuiz}
              disabled={!canSubmit}
              className={style.button}
              size="sm"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={goToNext}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizCard;
