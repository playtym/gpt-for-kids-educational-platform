import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Brain, Target, Clock, Users, TrendingUp } from 'lucide-react';
import { useEducational } from '@/contexts/EducationalContext';
import { useThreads } from '@/contexts/ThreadContext';
import { 
  getSubjectsForBoard, 
  getChaptersForSubject, 
  getPracticePrompt,
  Subject,
  Chapter 
} from '@/data/curriculumData';

interface StudyModeProps {
  onStartPractice: (prompt: string, mode: string) => void;
}

const StudyMode: React.FC<StudyModeProps> = ({ onStartPractice }) => {
  const { curriculumBoard, curriculumGrade } = useEducational();
  const { createThread } = useThreads();
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Load subjects when board/grade changes
  useEffect(() => {
    if (curriculumBoard && curriculumGrade) {
      const availableSubjects = getSubjectsForBoard(curriculumBoard, curriculumGrade);
      setSubjects(availableSubjects);
      setSelectedSubject(null);
      setSelectedChapter(null);
      setChapters([]);
    }
  }, [curriculumBoard, curriculumGrade]);

  // Load chapters when subject changes
  useEffect(() => {
    if (curriculumBoard && curriculumGrade && selectedSubject) {
      const availableChapters = getChaptersForSubject(curriculumBoard, curriculumGrade, selectedSubject.id);
      setChapters(availableChapters);
      setSelectedChapter(null);
    }
  }, [curriculumBoard, curriculumGrade, selectedSubject]);

  const handleSubjectChange = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    setSelectedSubject(subject || null);
  };

  const handleChapterChange = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    setSelectedChapter(chapter || null);
  };

  const startPractice = (type: 'mixed' | 'mcq' | 'longform') => {
    if (!curriculumBoard || !curriculumGrade || !selectedSubject || !selectedChapter) {
      return;
    }

    const prompt = getPracticePrompt(
      curriculumBoard,
      curriculumGrade,
      selectedSubject.name,
      selectedChapter.name,
      selectedChapter.topics,
      type
    );

    onStartPractice(prompt, 'curriculum');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-orange-100 text-orange-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!curriculumBoard || !curriculumGrade) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <BookOpen size={48} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600">Study Mode Setup Required</h3>
            <p className="text-gray-500">
              Please set your curriculum board and grade in user settings to access study mode.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="text-indigo-600" size={24} />
            <span>Study Mode</span>
            <Badge variant="secondary" className="ml-2">
              {curriculumBoard} {curriculumGrade}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Subject and Chapter Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Your Study Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <Select value={selectedSubject?.id || ''} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject to study" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex items-center space-x-2">
                      <span>{subject.name}</span>
                      <span className="text-xs text-gray-500">• {subject.chapters.length} chapters</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubject && (
              <p className="text-sm text-gray-600">{selectedSubject.description}</p>
            )}
          </div>

          {/* Chapter Dropdown */}
          {selectedSubject && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Chapter</label>
              <Select value={selectedChapter?.id || ''} onValueChange={handleChapterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chapter to focus on" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{chapter.name}</span>
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge variant="outline" className={getDifficultyColor(chapter.difficulty)}>
                            {chapter.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            <Clock size={12} className="inline mr-1" />
                            {chapter.estimatedHours}h
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedChapter && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{selectedChapter.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedChapter.topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Practice Options */}
      {selectedChapter && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Target className="text-green-600" size={20} />
              <span>Practice Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mixed Practice */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-purple-600" size={16} />
                  <h4 className="font-semibold">Mixed Practice</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Combination of MCQs and long-form questions for comprehensive practice
                </p>
                <Button 
                  onClick={() => startPractice('mixed')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Start Mixed Practice
                </Button>
              </div>

              <Separator orientation="vertical" className="hidden md:block" />

              {/* MCQ Practice */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Brain className="text-blue-600" size={16} />
                  <h4 className="font-semibold">MCQ Practice</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Quick multiple choice questions for rapid concept testing
                </p>
                <Button 
                  onClick={() => startPractice('mcq')}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Start MCQ Practice
                </Button>
              </div>

              <Separator orientation="vertical" className="hidden md:block" />

              {/* Long-form Practice */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="text-green-600" size={16} />
                  <h4 className="font-semibold">Essay Practice</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Detailed questions for in-depth understanding and writing skills
                </p>
                <Button 
                  onClick={() => startPractice('longform')}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                >
                  Start Essay Practice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter Information */}
      {selectedChapter && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chapter Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-indigo-600">{selectedChapter.topics.length}</div>
                <div className="text-sm text-gray-600">Topics</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{selectedChapter.estimatedHours}</div>
                <div className="text-sm text-gray-600">Hours</div>
              </div>
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${
                  selectedChapter.difficulty === 'basic' ? 'text-green-600' :
                  selectedChapter.difficulty === 'intermediate' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {selectedChapter.difficulty}
                </div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600">{curriculumBoard}</div>
                <div className="text-sm text-gray-600">Board</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudyMode;
