import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useEducational, AgeGroup } from '@/contexts/EducationalContext';
import { ChevronUp, ChevronDown, Users, BookOpen, GraduationCap, Brain, Star, ArrowRight } from 'lucide-react';
import { getEducationalLevelFromAge, isValidAge as validateAge, getAgeGroupInfo } from '@/utils/educationalLevels';

interface SimpleAgeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
}

export const SimpleAgeSelector: React.FC<SimpleAgeSelectorProps> = ({
  isOpen,
  onClose,
  required = false,
}) => {
  const { ageGroup, setAgeGroup } = useEducational();
  const [childAge, setChildAge] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [step, setStep] = useState<'age' | 'confirm'>('age');
  const [educationalLevel, setEducationalLevel] = useState<any>(null);

  const handleAgeSubmit = () => {
    const age = parseInt(childAge);
    if (childAge && validateAge(age)) {
      const level = getEducationalLevelFromAge(age);
      setEducationalLevel(level);
      setSelectedGrade(level.estimatedGrade);
      setStep('confirm');
    }
  };

  const handleConfirm = () => {
    if (educationalLevel) {
      setAgeGroup(educationalLevel.ageGroup);
      
      // Store additional info in localStorage for reference
      localStorage.setItem('childAge', childAge);
      localStorage.setItem('estimatedGrade', selectedGrade);
      
      if (!required) {
        onClose();
      }
    }
  };

  const handleAdjustGrade = (direction: 'up' | 'down') => {
    if (!educationalLevel) return;
    
    const currentIndex = educationalLevel.gradeRange.indexOf(selectedGrade);
    
    if (direction === 'up' && currentIndex < educationalLevel.gradeRange.length - 1) {
      setSelectedGrade(educationalLevel.gradeRange[currentIndex + 1]);
    } else if (direction === 'down' && currentIndex > 0) {
      setSelectedGrade(educationalLevel.gradeRange[currentIndex - 1]);
    }
  };

  const canClose = !required || ageGroup !== null;
  const isValidAgeInput = childAge && validateAge(parseInt(childAge));

  const currentLevel = isValidAgeInput ? getEducationalLevelFromAge(parseInt(childAge)) : null;
  const ageGroupInfo = currentLevel ? getAgeGroupInfo(currentLevel.ageGroup) : null;
  
  // Get appropriate icon
  const getIcon = () => {
    if (!currentLevel) return Users;
    switch (currentLevel.ageGroup) {
      case '5-7': return Users;
      case '8-10': return BookOpen;
      case '11-13': return GraduationCap;
      case '14-17': return Brain;
      default: return Users;
    }
  };
  
  const Icon = getIcon();

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="sm:max-w-lg" hideCloseButton={required}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {step === 'age' ? "What's your child's age?" : "Let's confirm the learning level"}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {step === 'age' 
              ? "We'll automatically find the perfect learning level based on their age"
              : "We can adjust this up or down if needed"
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'age' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="age" className="text-sm font-medium">
                Child's Age (5-17 years)
              </Label>
              <Input
                id="age"
                type="number"
                min="5"
                max="17"
                placeholder="Enter age..."
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="text-center text-lg font-semibold"
                autoFocus
              />
            </div>

            {isValidAgeInput && currentLevel && ageGroupInfo && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-full ${ageGroupInfo.color} text-white`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      Perfect! Age {childAge}
                    </h3>
                    <p className="text-sm text-gray-600">{currentLevel.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="text-green-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">
                    Estimated Level: {currentLevel.estimatedGrade}
                  </span>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  Ages {currentLevel.ageGroup} learning group
                </Badge>
              </div>
            )}

            <Button 
              onClick={handleAgeSubmit}
              disabled={!isValidAgeInput}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Continue
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {step === 'confirm' && educationalLevel && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${getAgeGroupInfo(educationalLevel.ageGroup).color} text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    Age {childAge} • {educationalLevel.description.split(' • ')[0]}
                  </h3>
                  <p className="text-sm text-gray-600">{educationalLevel.description.split(' • ')[1]}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Learning Level (you can adjust this)
                </Label>
                
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdjustGrade('down')}
                    disabled={educationalLevel.gradeRange.indexOf(selectedGrade) === 0}
                  >
                    <ChevronDown size={16} />
                  </Button>
                  
                  <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 min-w-[120px]">
                    <div className="font-semibold text-gray-800">{selectedGrade}</div>
                    <div className="text-xs text-gray-500">Current level</div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdjustGrade('up')}
                    disabled={educationalLevel.gradeRange.indexOf(selectedGrade) === educationalLevel.gradeRange.length - 1}
                  >
                    <ChevronUp size={16} />
                  </Button>
                </div>
                
                <p className="text-xs text-center text-gray-500">
                  Available range: {educationalLevel.gradeRange[0]} - {educationalLevel.gradeRange[educationalLevel.gradeRange.length - 1]}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('age')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Looks Good!
                <Star size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {ageGroup && step === 'confirm' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-800 font-medium text-sm">
                Perfect! Learning level set to {selectedGrade}
              </p>
            </div>
          </div>
        )}

        {canClose && !required && (
          <div className="flex justify-end mt-4">
            <Button onClick={onClose} variant="outline">
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
