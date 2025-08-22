import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userContextService, UserProfile } from '@/services/userContextService';

interface UserPreferencesProps {
  userId?: string;
  ageGroup: string;
  onPreferencesUpdated?: (profile: UserProfile) => void;
  onClose?: () => void;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ 
  userId, 
  ageGroup, 
  onPreferencesUpdated,
  onClose 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      const existingProfile = userContextService.getUserProfile(userId);
      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        setProfile(userContextService.createDefaultProfile(userId, ageGroup));
      }
    }
  }, [userId, ageGroup]);

  const handleSave = () => {
    if (userId && profile) {
      setIsLoading(true);
      userContextService.saveUserProfile(userId, profile);
      onPreferencesUpdated?.(profile);
      setIsLoading(false);
      onClose?.();
    }
  };

  const updatePreferences = (key: string, value: any) => {
    if (profile) {
      setProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          [key]: value
        }
      });
    }
  };

  const updateSettings = (key: string, value: any) => {
    if (profile) {
      setProfile({
        ...profile,
        settings: {
          ...profile.settings,
          [key]: value
        }
      });
    }
  };

  const toggleSubject = (subject: string) => {
    if (profile) {
      const favorites = profile.preferences.favoriteSubjects;
      const newFavorites = favorites.includes(subject)
        ? favorites.filter(s => s !== subject)
        : [...favorites, subject];
      
      updatePreferences('favoriteSubjects', newFavorites);
    }
  };

  const toggleInterest = (interest: string) => {
    if (profile) {
      const interests = profile.preferences.interests;
      const newInterests = interests.includes(interest)
        ? interests.filter(i => i !== interest)
        : [...interests, interest];
      
      updatePreferences('interests', newInterests);
    }
  };

  if (!profile) {
    return <div>Loading preferences...</div>;
  }

  const subjects = ['Math', 'Science', 'Language Arts', 'History', 'Geography', 'Art', 'Music', 'Physical Education'];
  
  const interestsByAge = {
    '5-7': ['Animals', 'Colors', 'Shapes', 'Family', 'Toys', 'Food', 'Nature', 'Stories'],
    '8-10': ['Space', 'Dinosaurs', 'Sports', 'Technology', 'Adventure', 'Magic', 'Friendship', 'Environment'],
    '11-13': ['Gaming', 'Social Media', 'Movies', 'Music', 'Fashion', 'Travel', 'Coding', 'Photography'],
    '14-17': ['Career Planning', 'College Prep', 'Politics', 'Economics', 'Philosophy', 'Psychology', 'Innovation', 'Leadership']
  };

  const interests = interestsByAge[ageGroup as keyof typeof interestsByAge] || interestsByAge['8-10'];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Learning Preferences</CardTitle>
        <CardDescription>
          Help us personalize your learning experience by sharing your preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Favorite Subjects</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select the subjects you enjoy learning about most
              </p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant={profile.preferences.favoriteSubjects.includes(subject) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSubject(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Learning Style</h3>
              <p className="text-sm text-gray-600 mb-4">
                How do you learn best?
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'visual', label: 'Visual (Pictures & Diagrams)' },
                  { value: 'auditory', label: 'Auditory (Listening & Discussion)' },
                  { value: 'kinesthetic', label: 'Hands-on (Activities & Movement)' },
                  { value: 'mixed', label: 'Mixed (All of the above)' }
                ].map((style) => (
                  <Badge
                    key={style.value}
                    variant={profile.preferences.learningStyle === style.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updatePreferences('learningStyle', style.value)}
                  >
                    {style.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Difficulty Level</h3>
              <div className="flex gap-2">
                {[
                  { value: 'easy', label: 'Easy & Fun' },
                  { value: 'normal', label: 'Just Right' },
                  { value: 'challenging', label: 'Challenge Me!' }
                ].map((level) => (
                  <Badge
                    key={level.value}
                    variant={profile.preferences.difficulty === level.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updatePreferences('difficulty', level.value)}
                  >
                    {level.label}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Your Interests</h3>
              <p className="text-sm text-gray-600 mb-4">
                What topics are you curious about? This helps us create personalized content.
              </p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={profile.preferences.interests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Session Length</h3>
              <p className="text-sm text-gray-600 mb-4">
                How long do you usually like to learn for?
              </p>
              <div className="flex gap-2">
                {[
                  { value: 'short', label: '10-15 minutes' },
                  { value: 'medium', label: '20-30 minutes' },
                  { value: 'long', label: '45+ minutes' }
                ].map((length) => (
                  <Badge
                    key={length.value}
                    variant={profile.settings.sessionLength === length.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateSettings('sessionLength', length.value)}
                  >
                    {length.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Best Learning Time</h3>
              <div className="flex gap-2">
                {[
                  { value: 'morning', label: 'Morning' },
                  { value: 'afternoon', label: 'Afternoon' },
                  { value: 'evening', label: 'Evening' },
                  { value: 'any', label: 'Anytime' }
                ].map((time) => (
                  <Badge
                    key={time.value}
                    variant={profile.settings.timePreference === time.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => updateSettings('timePreference', time.value)}
                  >
                    {time.label}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPreferences;
