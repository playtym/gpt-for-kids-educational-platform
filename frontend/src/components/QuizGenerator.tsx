import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, XCircle, Brain, Search, Zap } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: Array<{
    letter: string;
    text: string;
  }>;
  type: string;
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  answerKey: Array<{
    questionId: number;
    correctAnswer: string;
    explanation: string;
  }>;
  sources: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
  learningObjectives: string[];
  metadata: {
    generatedAt: string;
    searchResultsUsed: number;
    questionsCount: number;
    fallback?: boolean;
  };
}

interface QuizGeneratorProps {
  ageGroup: string;
  context?: string[];
  onQuizGenerated?: (quiz: QuizData) => void;
}

export function QuizGenerator({ ageGroup, context = [], onQuizGenerated }: QuizGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [quizType, setQuizType] = useState('generate');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = `/api/quiz/${quizType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          ageGroup,
          context,
          questionCount
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setQuiz(data.quiz);
        setUserAnswers({});
        setShowAnswers(false);
        onQuizGenerated?.(data.quiz);
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = () => {
    setShowAnswers(true);
  };

  const getQuizTypeInfo = (type: string) => {
    switch (type) {
      case 'quick':
        return {
          icon: <Zap className="w-4 h-4" />,
          label: 'Quick Quiz',
          description: 'Fast quiz without web search (3 questions)'
        };
      case 'comprehensive':
        return {
          icon: <Brain className="w-4 h-4" />,
          label: 'Comprehensive Quiz',
          description: 'In-depth quiz with web search (10 questions)'
        };
      default:
        return {
          icon: <Search className="w-4 h-4" />,
          label: 'Standard Quiz',
          description: 'Balanced quiz with web search (5 questions)'
        };
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setUserAnswers({});
    setShowAnswers(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Generator Controls */}
      {!quiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Quiz Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic for the quiz..."
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quiz Type</label>
                <Select value={quizType} onValueChange={setQuizType} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Quiz (3 questions)</SelectItem>
                    <SelectItem value="generate">Standard Quiz (5 questions)</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive Quiz (10 questions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {quizType === 'generate' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Questions</label>
                  <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="7">7 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              {getQuizTypeInfo(quizType).icon}
              <div>
                <p className="font-medium">{getQuizTypeInfo(quizType).label}</p>
                <p className="text-sm text-gray-600">{getQuizTypeInfo(quizType).description}</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <Button 
              onClick={generateQuiz} 
              disabled={isLoading || !topic.trim()}
              className="w-full"
            >
              {isLoading ? 'Generating Quiz...' : 'Generate Quiz'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Quiz */}
      {quiz && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl">{quiz.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                </div>
                <Button variant="outline" onClick={resetQuiz}>
                  New Quiz
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Quiz Questions */}
          {quiz.questions?.map((question, index) => (
            <Card key={question.id} className="relative">
              <CardHeader>
                <CardTitle className="text-base">
                  Question {index + 1}: {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options?.map((option) => {
                    const isSelected = userAnswers[question.id] === option.letter;
                    const correctAnswer = quiz.answerKey?.find(a => a.questionId === question.id)?.correctAnswer;
                    const isCorrect = option.letter === correctAnswer;
                    const showResult = showAnswers && isSelected;

                    return (
                      <button
                        key={option.letter}
                        onClick={() => !showAnswers && handleAnswerSelect(question.id, option.letter)}
                        disabled={showAnswers}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? showAnswers
                              ? isCorrect
                                ? 'bg-green-50 border-green-300'
                                : 'bg-red-50 border-red-300'
                              : 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            <strong>{option.letter})</strong> {option.text}
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

                {showAnswers && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Explanation:</strong> {quiz.answerKey?.find(a => a.questionId === question.id)?.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit/Results */}
          {quiz.questions && quiz.questions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                {!showAnswers ? (
                  <Button onClick={submitQuiz} className="w-full" size="lg">
                    Submit Quiz
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Quiz Results</h3>
                      <p className="text-gray-600">
                        You answered {Object.values(userAnswers).filter((answer, index) => 
                          answer === quiz.answerKey?.[index]?.correctAnswer
                        ).length} out of {quiz.questions.length} questions correctly!
                      </p>
                    </div>

                    {quiz.learningObjectives && quiz.learningObjectives.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Learning Objectives:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {quiz.learningObjectives.map((objective, index) => (
                            <li key={index}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {quiz.sources && quiz.sources.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Sources Used:</h4>
                        <div className="space-y-2">
                          {quiz.sources.map((source, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {source.title}
                              </a>
                              <p className="text-gray-600 mt-1">{source.snippet}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
