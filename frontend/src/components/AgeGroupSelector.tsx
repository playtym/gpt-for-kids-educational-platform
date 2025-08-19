import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEducational, AgeGroup } from '@/contexts/EducationalContext';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, BookOpen, Brain } from 'lucide-react';

interface AgeGroupSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
}

const ageGroupInfo = {
  '5-7': {
    icon: Users,
    title: 'Early Learners',
    description: 'Kindergarten - 1st Grade',
    color: 'bg-green-500',
    features: ['Simple vocabulary', 'Basic concepts', 'Fun activities'],
  },
  '8-10': {
    icon: BookOpen,
    title: 'Elementary Explorers',
    description: '2nd - 4th Grade',
    color: 'bg-blue-500',
    features: ['Elementary vocabulary', 'Interactive learning', 'Story building'],
  },
  '11-13': {
    icon: GraduationCap,
    title: 'Middle Grade Minds',
    description: '5th - 7th Grade',
    color: 'bg-purple-500',
    features: ['Complex concepts', 'Critical thinking', 'Research skills'],
  },
  '14-17': {
    icon: Brain,
    title: 'Advanced Scholars',
    description: '8th - 12th Grade',
    color: 'bg-orange-500',
    features: ['Advanced vocabulary', 'Deep analysis', 'Independent learning'],
  },
};

export const AgeGroupSelector: React.FC<AgeGroupSelectorProps> = ({
  isOpen,
  onClose,
  required = false,
}) => {
  const { ageGroup, setAgeGroup } = useEducational();

  const handleAgeGroupSelect = (selectedAge: AgeGroup) => {
    setAgeGroup(selectedAge);
    if (!required) {
      onClose();
    }
  };

  const canClose = !required || ageGroup !== null;

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="sm:max-w-2xl" hideCloseButton={required}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Choose Your Learning Level
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {required
              ? "Please select your age group to start your learning adventure!"
              : "Select the age group that best fits the learner"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {Object.entries(ageGroupInfo).map(([age, info]) => {
            const Icon = info.icon;
            const isSelected = ageGroup === age;

            return (
              <Button
                key={age}
                variant={isSelected ? "default" : "outline"}
                className={`p-6 h-auto flex flex-col items-start space-y-3 transition-all hover:scale-105 ${
                  isSelected ? 'ring-2 ring-purple-500 bg-gradient-to-r from-purple-600 to-blue-600' : ''
                }`}
                onClick={() => handleAgeGroupSelect(age as AgeGroup)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`p-2 rounded-full ${info.color} text-white`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">{info.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      Ages {age}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-left">
                  {info.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {info.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Button>
            );
          })}
        </div>

        {ageGroup && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-800 font-medium">
                Perfect! You've selected the {ageGroupInfo[ageGroup].title} level.
              </p>
            </div>
            <p className="text-green-600 text-sm mt-1">
              All content will be tailored for ages {ageGroup} with appropriate vocabulary and concepts.
            </p>
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
