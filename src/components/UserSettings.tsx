import React, { useState, useEffect } from 'react';
import { User as UserIcon, Settings, BookOpen, GraduationCap, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEducational, AgeGroup } from '@/contexts/EducationalContext';
import { useUser, User } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose, user }) => {
  const { 
    ageGroup, 
    setAgeGroup, 
    curriculumBoard, 
    setCurriculumBoard, 
  } = useEducational();
  
  const { updateUser, validateAgeGrade } = useUser();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    grade: user?.grade || ''
  });
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age?.toString() || '',
        grade: user.grade || ''
      });
    }
  }, [user]);

  const ageGroups = [
    { value: '5-7', label: 'Ages 5-7 (Early Elementary)' },
    { value: '8-10', label: 'Ages 8-10 (Elementary)' },
    { value: '11-13', label: 'Ages 11-13 (Middle School)' },
    { value: '14-17', label: 'Ages 14-17 (High School)' }
  ];

  const boards = [
    { value: 'NCERT', label: 'NCERT (National)', description: 'Indian National Curriculum' },
    { value: 'CBSE', label: 'CBSE', description: 'Central Board of Secondary Education' },
    { value: 'ICSE', label: 'ICSE', description: 'Indian Certificate of Secondary Education' },
    { value: 'IB', label: 'IB (International)', description: 'International Baccalaureate' },
    { value: 'Cambridge', label: 'Cambridge IGCSE', description: 'Cambridge International' },
    { value: 'State Board', label: 'State Board', description: 'Regional State Board' }
  ];

  const grades = [
    'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade',
    '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade',
    '10th Grade', '11th Grade', '12th Grade', 'College/University', 'Adult'
  ];

  const getAgeGroup = (age: number): AgeGroup => {
    if (age <= 7) return '5-7';
    if (age <= 10) return '8-10';
    if (age <= 13) return '11-13';
    return '14-17';
  };

  const handleSave = () => {
    setValidationError('');
    
    const age = parseInt(formData.age);
    if (!age || age < 4 || age > 100) {
      setValidationError('Please enter a valid age between 4 and 100');
      return;
    }

    if (!formData.grade) {
      setValidationError('Please select a grade level');
      return;
    }

    const validation = validateAgeGrade(age, formData.grade);
    if (!validation.isValid) {
      setValidationError(validation.suggestion || 'Age and grade combination seems unusual');
      return;
    }

    if (user) {
      const updatedUser = {
        name: formData.name,
        age: age,
        grade: formData.grade,
        board: curriculumBoard // Include curriculum board in user updates
      };
      
      updateUser(user.id, updatedUser);

      const newAgeGroup = getAgeGroup(age);
      setAgeGroup(newAgeGroup);
      
      toast({
        title: "Settings Saved! ✨",
        description: "Your learning preferences have been updated successfully.",
      });
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border-0">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserIcon size={20} className="text-blue-600" />
            </div>
            <span className="font-semibold text-gray-800">Learning Profile Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <Card className="border border-gray-200 rounded-xl bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 text-gray-700 font-medium">
                <UserIcon size={16} className="text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white rounded-lg border border-gray-100 mx-4 mb-4 p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="userName" className="text-sm font-medium">Name</Label>
                  <Input
                    id="userName"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="userAge" className="text-sm font-medium">Age</Label>
                  <Input
                    id="userAge"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="mt-1"
                    min="4"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

                    {/* Educational Board */}

          <Card className="border border-gray-200 rounded-xl bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 text-gray-700 font-medium">
                <BookOpen size={16} className="text-blue-600" />
                <span>Educational Board</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white rounded-lg border border-gray-100 mx-4 mb-4 p-4">
              <div className="space-y-3">
                <Select value={curriculumBoard || ''} onValueChange={setCurriculumBoard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your educational board" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.value} value={board.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{board.label}</span>
                          <span className="text-xs text-gray-500">{board.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 rounded-xl bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 text-gray-700 font-medium">
                <GraduationCap size={16} className="text-blue-600" />
                <span>Grade/Class</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white rounded-lg border border-gray-100 mx-4 mb-4 p-4">
              <Select 
                value={formData.grade} 
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your grade/class" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {validationError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle size={16} className="text-red-600" />
              <AlertDescription className="text-red-700">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="min-h-[44px] border-gray-300 hover:border-gray-400">
              Cancel
            </Button>
            <Button onClick={handleSave} className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettings;
