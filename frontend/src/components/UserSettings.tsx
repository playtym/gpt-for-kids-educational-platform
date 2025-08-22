import React, { useState, useEffect } from 'react';
import { User, Settings, BookOpen, GraduationCap, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEducational, AgeGroup, CurriculumBoard, CurriculumGrade } from '@/contexts/EducationalContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface UserSettingsProps {
  trigger?: React.ReactNode;
  asContent?: boolean; // New prop to render just content without Dialog wrapper
}

const UserSettings: React.FC<UserSettingsProps> = ({ trigger, asContent = false }) => {
  const { 
    ageGroup, 
    setAgeGroup, 
    curriculumBoard, 
    setCurriculumBoard, 
    curriculumGrade, 
    setCurriculumGrade 
  } = useEducational();
  
  const { currentUser, updateUser, validateAgeGrade } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    age: currentUser?.age?.toString() || '',
    grade: currentUser?.grade || ''
  });
  const [validationError, setValidationError] = useState<string>('');

  // Update form data when current user changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        age: currentUser.age?.toString() || '',
        grade: currentUser.grade || ''
      });
    }
  }, [currentUser]);

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

    // Validate age and grade combination
    const validation = validateAgeGrade(age, formData.grade);
    if (!validation.isValid) {
      setValidationError(validation.suggestion || 'Age and grade combination seems unusual');
      return;
    }

    if (currentUser) {
      // Update user in context
      const updatedUser = {
        name: formData.name,
        age: age,
        grade: formData.grade
      };
      
      console.log('Updating user with data:', updatedUser);
      updateUser(currentUser.id, updatedUser);

      // Update age group based on new age
      const newAgeGroup = getAgeGroup(age);
      setAgeGroup(newAgeGroup);
      
      console.log('User updated successfully:', currentUser.id);
    }
    
    toast({
      title: "Settings Saved! ✨",
      description: "Your learning preferences have been updated successfully.",
    });
    
    setIsOpen(false);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
      <Settings size={18} className="text-gray-600" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border-0">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
            <span className="font-semibold text-gray-800">Learning Profile Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Personal Information */}
          <Card className="border border-gray-200 rounded-xl bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 text-gray-700 font-medium">
                <User size={16} className="text-blue-600" />
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

          {/* Learning Preferences */}
          <Card className="border border-gray-200 rounded-xl bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2 text-gray-700 font-medium">
                <Calendar size={16} className="text-blue-600" />
                <span>Age Group</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white rounded-lg border border-gray-100 mx-4 mb-4 p-4">
              <Select value={ageGroup || ''} onValueChange={(value) => setAgeGroup(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your age group" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((age) => (
                    <SelectItem key={age.value} value={age.value}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Grade/Class */}
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

          {/* Validation Error */}
          {validationError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle size={16} className="text-red-600" />
              <AlertDescription className="text-red-700">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Settings Summary */}
          {currentUser && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-800">Current Settings</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700">
                <div className="space-y-1">
                  <div><strong>Name:</strong> {formData.name || 'Not set'}</div>
                  <div><strong>Age:</strong> {formData.age || 'Not set'}</div>
                  <div><strong>Grade:</strong> {formData.grade || 'Not set'}</div>
                  <div><strong>Age Group:</strong> {ageGroup}</div>
                  {curriculumBoard && <div><strong>Board:</strong> {curriculumBoard}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="min-h-[44px] border-gray-300 hover:border-gray-400">
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
