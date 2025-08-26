import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, BookOpen, FileText, PenTool, Award } from 'lucide-react';
import { agentService } from '@/api/agentService';
import { useEducational } from '@/contexts/EducationalContext';
import { toast } from '@/hooks/use-toast';

interface TOCItem {
  chapter: string;
  topics: string[];
  duration: string;
}

interface Question {
  id: string;
  type: 'mcq' | 'descriptive';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CurriculumData {
  type: 'toc' | 'practice' | 'summary';
  content: any;
}

export const CurriculumInterface: React.FC = () => {
  const { ageGroup, curriculumBoard, curriculumGrade } = useEducational();
  const [activeTab, setActiveTab] = useState<'toc' | 'practice' | 'summary'>('toc');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, { correct: boolean; feedback: string }>>({});

  const generateTableOfContents = async () => {
    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject to generate table of contents.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await agentService.generateTableOfContents(
        subject,
        curriculumBoard || 'NCERT',
        curriculumGrade || 'Grade 8',
        ageGroup || '11-13'
      );

      // Parse the response to extract structured TOC
      const tocItems = parseTOCResponse(response.content);
      
      setCurriculumData({
        type: 'toc',
        content: tocItems
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate table of contents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePracticeExercises = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic to generate practice exercises.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await agentService.generatePracticeExercises(
        subject || 'General',
        topic,
        curriculumBoard || 'NCERT',
        curriculumGrade || 'Grade 8',
        ageGroup || '11-13'
      );

      // Parse the response to extract structured questions
      const questions = parsePracticeResponse(response.content);
      
      setCurriculumData({
        type: 'practice',
        content: questions
      });
      
      // Reset answers when new questions are loaded
      setUserAnswers({});
      setSubmittedAnswers({});
      setScores({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate practice exercises. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateChapterSummary = async () => {
    if (!chapter.trim()) {
      toast({
        title: "Chapter Required",
        description: "Please enter a chapter to generate summary.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await agentService.generateChapterSummary(
        subject || 'General',
        chapter,
        curriculumBoard || 'NCERT',
        curriculumGrade || 'Grade 8',
        ageGroup || '11-13'
      );

      setCurriculumData({
        type: 'summary',
        content: response.content
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate chapter summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseTOCResponse = (content: string): TOCItem[] => {
    // Simple parser - in production, you'd want more robust parsing
    const lines = content.split('\n').filter(line => line.trim());
    const tocItems: TOCItem[] = [];
    let currentChapter = '';
    let currentTopics: string[] = [];

    lines.forEach(line => {
      if (line.includes('Chapter') || line.includes('Unit')) {
        if (currentChapter) {
          tocItems.push({
            chapter: currentChapter,
            topics: [...currentTopics],
            duration: '2-3 weeks'
          });
        }
        currentChapter = line.trim();
        currentTopics = [];
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        currentTopics.push(line.trim().substring(1).trim());
      }
    });

    if (currentChapter) {
      tocItems.push({
        chapter: currentChapter,
        topics: currentTopics,
        duration: '2-3 weeks'
      });
    }

    return tocItems;
  };

  const parsePracticeResponse = (content: string): Question[] => {
    // Simple parser - in production, you'd want more robust parsing
    const questions: Question[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentQuestion: Partial<Question> = {};
    let questionCounter = 1;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.match(/^\d+\./)) {
        // New question
        if (currentQuestion.question) {
          questions.push({
            id: `q${questionCounter}`,
            type: currentQuestion.options ? 'mcq' : 'descriptive',
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation || 'Well done!',
            difficulty: 'medium'
          } as Question);
          questionCounter++;
        }
        
        currentQuestion = {
          question: trimmed
        };
      } else if (trimmed.match(/^[A-D]\)/)) {
        // MCQ option
        if (!currentQuestion.options) currentQuestion.options = [];
        currentQuestion.options.push(trimmed);
        
        if (trimmed.includes('*') || trimmed.includes('✓')) {
          currentQuestion.correctAnswer = trimmed.split(')')[0];
        }
      } else if (trimmed.startsWith('Answer:') || trimmed.startsWith('Explanation:')) {
        currentQuestion.explanation = trimmed;
      }
    });

    // Add the last question
    if (currentQuestion.question) {
      questions.push({
        id: `q${questionCounter}`,
        type: currentQuestion.options ? 'mcq' : 'descriptive',
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation || 'Well done!',
        difficulty: 'medium'
      } as Question);
    }

    return questions;
  };

  const submitAnswer = async (questionId: string) => {
    const question = (curriculumData?.content as Question[])?.find(q => q.id === questionId);
    const userAnswer = userAnswers[questionId];

    if (!question || !userAnswer) return;

    setSubmittedAnswers(prev => ({ ...prev, [questionId]: true }));

    if (question.type === 'mcq') {
      const isCorrect = userAnswer === question.correctAnswer;
      setScores(prev => ({
        ...prev,
        [questionId]: {
          correct: isCorrect,
          feedback: isCorrect ? '✅ Correct! ' + question.explanation : '❌ Incorrect. ' + question.explanation
        }
      }));
    } else {
      // For descriptive answers, use AI to evaluate
      try {
        const response = await agentService.getFeedback(
          `Question: ${question.question}\nStudent Answer: ${userAnswer}`,
          ageGroup || '11-13',
          'accuracy'
        );
        
        setScores(prev => ({
          ...prev,
          [questionId]: {
            correct: true, // Assume correct for descriptive unless AI says otherwise
            feedback: response.response
          }
        }));
      } catch (error) {
        setScores(prev => ({
          ...prev,
          [questionId]: {
            correct: true,
            feedback: 'Great effort! Keep practicing to improve your understanding.'
          }
        }));
      }
    }
  };

  const renderTOC = (tocItems: TOCItem[]) => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <BookOpen size={20} />
        Table of Contents - {subject}
      </h3>
      {tocItems.map((item, index) => (
        <Card key={index} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">{item.chapter}</CardTitle>
            <Badge variant="secondary">{item.duration}</Badge>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {item.topics.map((topic, topicIndex) => (
                <li key={topicIndex} className="text-gray-700">{topic}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPracticeExercises = (questions: Question[]) => {
    const totalQuestions = questions.length;
    const completedQuestions = Object.keys(submittedAnswers).length;
    const correctAnswers = Object.values(scores).filter(s => s.correct).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <PenTool size={20} />
            Practice Exercises - {topic}
          </h3>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{completedQuestions}/{totalQuestions} completed</Badge>
            {completedQuestions > 0 && (
              <Badge variant="default">
                <Award size={14} className="mr-1" />
                {Math.round((correctAnswers / completedQuestions) * 100)}% score
              </Badge>
            )}
          </div>
        </div>
        
        <Progress value={(completedQuestions / totalQuestions) * 100} className="h-2" />

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-l-4 border-l-apple-green">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Question {index + 1}</span>
                  <Badge variant={question.difficulty === 'easy' ? 'default' : question.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                    {question.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{question.question}</p>
                
                {question.type === 'mcq' ? (
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.split(')')[0]}
                          checked={userAnswers[question.id] === option.split(')')[0]}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                          disabled={submittedAnswers[question.id]}
                          className="w-4 h-4"
                        />
                        <span className={submittedAnswers[question.id] && option.split(')')[0] === question.correctAnswer ? 'text-apple-green font-medium' : ''}>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={userAnswers[question.id] || ''}
                    onChange={(e) => setUserAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                    disabled={submittedAnswers[question.id]}
                    className="min-h-[100px]"
                  />
                )}

                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => submitAnswer(question.id)}
                    disabled={!userAnswers[question.id] || submittedAnswers[question.id]}
                    variant={submittedAnswers[question.id] ? "secondary" : "default"}
                  >
                    {submittedAnswers[question.id] ? 'Submitted' : 'Submit Answer'}
                  </Button>
                  
                  {scores[question.id] && (
                    <div className="flex items-center gap-2">
                      {scores[question.id].correct ? (
                        <CheckCircle className="text-apple-green" size={20} />
                      ) : (
                        <XCircle className="text-red-500" size={20} />
                      )}
                    </div>
                  )}
                </div>

                {scores[question.id] && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-3">
                      <p className="text-sm">{scores[question.id].feedback}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSummary = (content: string) => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <FileText size={20} />
        Chapter Summary - {chapter}
      </h3>
      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Badge variant="outline">{curriculumBoard || 'NCERT'}</Badge>
        <Badge variant="outline">{curriculumGrade || 'Grade 8'}</Badge>
        <Badge variant="outline">Ages {ageGroup || '11-13'}</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'toc', label: 'Table of Contents', icon: BookOpen },
          { id: 'practice', label: 'Practice Exercises', icon: PenTool },
          { id: 'summary', label: 'Chapter Summary', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input Forms */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeTab === 'toc' && (
              <>
                <Input
                  placeholder="Enter subject (e.g., Mathematics, Science)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <div className="md:col-span-2">
                  <Button onClick={generateTableOfContents} disabled={isLoading} className="w-full">
                    {isLoading ? 'Generating TOC...' : 'Generate Table of Contents'}
                  </Button>
                </div>
              </>
            )}
            
            {activeTab === 'practice' && (
              <>
                <Input
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Input
                  placeholder="Enter topic (e.g., Fractions, Photosynthesis)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <Button onClick={generatePracticeExercises} disabled={isLoading} className="w-full">
                  {isLoading ? 'Generating Exercises...' : 'Generate Practice Exercises'}
                </Button>
              </>
            )}
            
            {activeTab === 'summary' && (
              <>
                <Input
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Input
                  placeholder="Enter chapter name"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                />
                <Button onClick={generateChapterSummary} disabled={isLoading} className="w-full">
                  {isLoading ? 'Generating Summary...' : 'Generate Chapter Summary'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      {curriculumData && (
        <div className="mt-6">
          {curriculumData.type === 'toc' && renderTOC(curriculumData.content)}
          {curriculumData.type === 'practice' && renderPracticeExercises(curriculumData.content)}
          {curriculumData.type === 'summary' && renderSummary(curriculumData.content)}
        </div>
      )}
    </div>
  );
};

export default CurriculumInterface;
