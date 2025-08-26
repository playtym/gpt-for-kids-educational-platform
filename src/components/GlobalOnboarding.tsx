import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEducational, AgeGroup, CurriculumBoard } from '@/contexts/EducationalContext';
import { useUser } from '@/contexts/UserContext';
import { userStorageService } from '@/services/UserStorageService';
import { ChevronRight, ChevronLeft, Users, BookOpen, GraduationCap, Brain, Star, AlertTriangle, CheckCircle } from 'lucide-react';

interface GlobalOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRADE_OPTIONS = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade', 
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College/University',
  'Adult'
];

const BOARD_OPTIONS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'NCERT', label: 'NCERT' },
  { value: 'State Board', label: 'State Board' },
  { value: 'IB', label: 'International Baccalaureate' },
  { value: 'Cambridge', label: 'Cambridge' }
];

export const GlobalOnboarding: React.FC<GlobalOnboardingProps> = ({
  isOpen,
  onClose,
}) => {
  const { ageGroup, setAgeGroup, curriculumBoard, setCurriculumBoard } = useEducational();
  const { createUser, completeOnboarding, validateAgeGrade, switchUser } = useUser();
  
  const [step, setStep] = useState<'name' | 'age' | 'grade' | 'board' | 'summary'>('name');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    grade: '',
    board: ''
  });
  const [validationError, setValidationError] = useState<string>('');

  // Child-friendly pseudonym suggestions
  const pseudonymSuggestions = [
    'CuriousExplorer', 'CodeNinja', 'BookWorm', 'ScienceWiz', 'ArtMaster',
    'MathGenius', 'SpaceRanger', 'NatureLover', 'TechGuru', 'MusicMaker',
    'StoryTeller', 'PuzzleSolver', 'StarGazer', 'OceanExplorer', 'RobotBuilder',
    'DragonTamer', 'CastleBuilder', 'TimeTravel', 'MagicLearner', 'WonderKid'
  ];

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const currentUser = await userStorageService.getCurrentUser();
        if (currentUser && currentUser.hasCompletedOnboarding) {
          // User already exists and has completed onboarding
          // Load their data into the context
          setAgeGroup(currentUser.ageGroup);
          setCurriculumBoard(currentUser.curriculumBoard);
          
          // Close the onboarding modal
          onClose();
          return;
        }
        
        if (currentUser && !currentUser.hasCompletedOnboarding) {
          // User exists but hasn't completed onboarding, pre-fill the form
          setFormData({
            name: currentUser.name || '',
            age: currentUser.age?.toString() || '',
            grade: currentUser.grade || '',
            board: currentUser.curriculumBoard || ''
          });
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
      }
    };

    if (isOpen) {
      checkExistingUser();
    }
  }, [isOpen, onClose, setAgeGroup, setCurriculumBoard]);

  // Auto-suggest a random pseudonym when component mounts
  useEffect(() => {
    if (!formData.name) {
      generateRandomPseudonym();
    }
  }, []);

  const generateRandomPseudonym = () => {
    const randomPseudonym = pseudonymSuggestions[Math.floor(Math.random() * pseudonymSuggestions.length)];
    setFormData(prev => ({ ...prev, name: randomPseudonym }));
  };

  const getAgeGroup = (age: number): AgeGroup => {
    if (age <= 7) return '5-7';
    if (age <= 10) return '8-10';
    if (age <= 13) return '11-13';
    if (age <= 17) return '14-17';
    return '14-17'; // Default for 18+ to closest valid type
  };

  const getSuggestedGrade = (age: number): string => {
    const gradeMap: { [key: number]: string } = {
      5: 'Kindergarten', 6: '1st Grade', 7: '2nd Grade', 8: '3rd Grade',
      9: '4th Grade', 10: '5th Grade', 11: '6th Grade', 12: '7th Grade',
      13: '8th Grade', 14: '9th Grade', 15: '10th Grade', 16: '11th Grade', 
      17: '12th Grade', 18: 'College/University'
    };
    return gradeMap[age] || (age > 18 ? 'Adult' : '3rd Grade');
  };

  const handleNext = async () => {
    setValidationError('');

    if (step === 'name') {
      if (!formData.name.trim()) {
        setValidationError('Please enter your name');
        return;
      }
      setStep('age');
    } else if (step === 'age') {
      const age = parseInt(formData.age);
      if (!age || age < 4 || age > 100) {
        setValidationError('Please enter a valid age between 4 and 100');
        return;
      }
      // Auto-suggest grade based on age
      const suggestedGrade = getSuggestedGrade(age);
      setFormData({ ...formData, grade: suggestedGrade });
      setStep('grade');
    } else if (step === 'grade') {
      if (!formData.grade) {
        setValidationError('Please select your grade level');
        return;
      }
      
      // Validate age and grade combination
      const age = parseInt(formData.age);
      const validation = validateAgeGrade(age, formData.grade);
      
      if (!validation.isValid) {
        setValidationError(validation.suggestion || 'Age and grade combination seems unusual');
        return;
      }
      
      setStep('board');
    } else if (step === 'board') {
      if (!formData.board) {
        setValidationError('Please select your curriculum board');
        return;
      }
      setStep('summary');
    } else if (step === 'summary') {
      await handleComplete();
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'age') setStep('name');
    else if (step === 'grade') setStep('age');
    else if (step === 'board') setStep('grade');
    else if (step === 'summary') setStep('board');
  };

  const handleComplete = async () => {
    console.log('Starting onboarding completion with data:', formData);
    setValidationError('');

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 4 || age > 100) {
      setValidationError('Invalid age provided.');
      return;
    }
    const selectedAgeGroup = getAgeGroup(age);

    try {
      // Step 2: Create or update user in the UserContext
      console.log('Step 2: Creating/updating user in UserContext...');
      const contextUser = await createUser(formData.name, age, formData.grade, formData.board as CurriculumBoard);
      console.log('✅ User created/updated in context:', contextUser.id);

      // Step 3: Set educational context
      console.log('Step 3: Setting educational context...');
      setAgeGroup(selectedAgeGroup);
      setCurriculumBoard(formData.board as CurriculumBoard);
      console.log('✅ Educational context set');

      // Step 4: Mark onboarding as complete
      console.log('Step 4: Marking onboarding as complete...');
      await completeOnboarding(contextUser.id, {
        ageGroup: selectedAgeGroup,
        board: formData.board as CurriculumBoard,
      });
      console.log('✅ Onboarding marked as complete in context and storage');

      // Step 5: Store additional preferences
      console.log('Step 5: Storing additional preferences...');
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('preferredBoard', formData.board);
      localStorage.setItem('lastOnboardingCompleted', new Date().toISOString());
      console.log('✅ Additional preferences stored');

      console.log('🎉 Onboarding completed successfully for user:', contextUser.id);
      
      // Wait for state to propagate before closing
      await new Promise(resolve => setTimeout(resolve, 200));
      onClose();

    } catch (error) {
      console.error('❌ Error during onboarding completion:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    }
  };

  const getStepIcon = (stepName: string) => {
    const icons = {
      name: Users,
      age: Star,
      grade: GraduationCap,
      board: BookOpen,
      summary: CheckCircle
    };
    return icons[stepName as keyof typeof icons] || Users;
  };

  const renderStepContent = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-base font-medium">Choose a fun pseudonym! 🎭</Label>
              <p className="text-sm text-gray-600 mb-2">Pick a creative name that represents you in your learning journey</p>
              <div className="flex space-x-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., CuriousExplorer, CodeNinja, BookWorm..."
                  className="flex-1 text-lg p-3"
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPseudonym}
                  className="px-3 py-2 h-auto text-sm"
                  title="Generate new suggestion"
                >
                  🎲
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {pseudonymSuggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setFormData({ ...formData, name: suggestion })}
                    className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'age':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="age" className="text-base font-medium">How old are you?</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter your age"
                className="mt-2 text-lg p-3"
                min="4"
                max="100"
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
          </div>
        );

      case 'grade':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">What grade/level are you in? 🎓</Label>
              <p className="text-sm text-gray-600 mb-2">We've suggested a grade based on your age, but feel free to adjust it!</p>
              <Select 
                value={formData.grade} 
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
              >
                <SelectTrigger className="mt-2 text-lg p-3">
                  <SelectValue placeholder="Select your grade level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'board':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Which curriculum do you follow?</Label>
              <Select 
                value={formData.board} 
                onValueChange={(value) => setFormData({ ...formData, board: value })}
              >
                <SelectTrigger className="mt-2 text-lg p-3">
                  <SelectValue placeholder="Select your curriculum board" />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_OPTIONS.map((board) => (
                    <SelectItem key={board.value} value={board.value}>
                      {board.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto text-apple-green mb-4" />
              <h3 className="text-lg font-semibold mb-4">Ready to start learning!</h3>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age:</span>
                  <span>{formData.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Grade:</span>
                  <span>{formData.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Curriculum:</span>
                  <span>{BOARD_OPTIONS.find(b => b.value === formData.board)?.label}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const StepIcon = getStepIcon(step);
  const stepNumber = ['name', 'age', 'grade', 'board', 'summary'].indexOf(step) + 1;
  const totalSteps = 5;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl border-0" style={{ background: '#FFFFFF' }}>
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-lg" style={{ background: '#E8F5E8' }}>
              <StepIcon size={24} style={{ color: '#58A700' }} />
            </div>
            <span className="font-bold" style={{ color: '#3C3C43', fontFamily: '"feather", sans-serif' }}>Welcome to Plural!</span>
          </DialogTitle>
          <DialogDescription className="leading-relaxed" style={{ color: '#8E8E93', fontFamily: '"feather", sans-serif' }}>
            Let's set up your personalized learning profile in just a few simple steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Progress indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold" style={{ color: '#3C3C43', fontFamily: '"feather", sans-serif' }}>Step {stepNumber} of {totalSteps}</span>
              <span style={{ color: '#8E8E93', fontFamily: '"feather", sans-serif' }}>{Math.round((stepNumber / totalSteps) * 100)}% complete</span>
            </div>
            <div className="relative w-full rounded-full h-3" style={{ background: '#E5E5EA' }}>
              <div 
                className="h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ 
                  width: `${(stepNumber / totalSteps) * 100}%`,
                  background: '#58A700'
                }}
              />
              {/* Integrated step indicators */}
              <div className="absolute inset-0 flex justify-between items-center px-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      i < stepNumber 
                        ? 'bg-white shadow-sm' 
                        : i === stepNumber - 1
                        ? 'bg-white shadow-sm ring-1 ring-white/50'
                        : 'bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="bg-gray-50 rounded-xl p-6 min-h-[200px]">
            {renderStepContent()}
          </div>

          {/* Validation error */}
          {validationError && (
            <Alert className="border-red-200 bg-red-50 rounded-lg">
              <AlertTriangle size={16} className="text-red-600" />
              <AlertDescription className="text-red-700 font-medium">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between space-x-4 pt-4" style={{ borderTop: '1px solid #E5E5EA' }}>
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 'name'}
              className="flex-1 min-h-[44px] rounded-2xl border-2 disabled:opacity-50 font-bold"
              style={{
                borderColor: '#E5E5EA',
                background: '#FFFFFF',
                color: '#3C3C43',
                fontFamily: '"feather", sans-serif'
              }}
            >
              <ChevronLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 min-h-[44px] rounded-2xl text-white font-bold flex items-center justify-center space-x-2"
              style={{
                background: '#58A700',
                border: 'none',
                fontFamily: '"feather", sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4F9500';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#58A700';
              }}
            >
              <span>{step === 'summary' ? 'Complete Setup' : 'Next'}</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalOnboarding;
