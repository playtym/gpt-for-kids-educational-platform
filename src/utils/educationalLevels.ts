import { AgeGroup } from '@/contexts/EducationalContext';

export interface EducationalLevel {
  ageGroup: AgeGroup;
  estimatedGrade: string;
  gradeRange: string[];
  description: string;
  cognitiveLevel: string;
  attentionSpan: string;
  vocabulary: string;
  complexity: string;
}

// Function to determine age group and grade from exact age
export const getEducationalLevelFromAge = (age: number): EducationalLevel => {
  if (age >= 5 && age <= 7) {
    return {
      ageGroup: '5-7',
      estimatedGrade: age === 5 ? 'Kindergarten' : age === 6 ? '1st Grade' : '2nd Grade',
      gradeRange: ['Kindergarten', '1st Grade', '2nd Grade'],
      description: 'Early Learning • Play-based discovery',
      cognitiveLevel: 'concrete operational beginning',
      attentionSpan: '5-10 minutes',
      vocabulary: 'simple',
      complexity: 'basic'
    };
  } else if (age >= 8 && age <= 10) {
    return {
      ageGroup: '8-10',
      estimatedGrade: age === 8 ? '2nd Grade' : age === 9 ? '3rd Grade' : '4th Grade',
      gradeRange: ['2nd Grade', '3rd Grade', '4th Grade', '5th Grade'],
      description: 'Elementary • Building foundations',
      cognitiveLevel: 'concrete operational',
      attentionSpan: '10-20 minutes',
      vocabulary: 'elementary',
      complexity: 'intermediate'
    };
  } else if (age >= 11 && age <= 13) {
    return {
      ageGroup: '11-13',
      estimatedGrade: age === 11 ? '5th Grade' : age === 12 ? '6th Grade' : '7th Grade',
      gradeRange: ['4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade'],
      description: 'Middle School • Critical thinking',
      cognitiveLevel: 'formal operational beginning',
      attentionSpan: '20-30 minutes',
      vocabulary: 'middle',
      complexity: 'advanced'
    };
  } else if (age >= 14 && age <= 17) {
    return {
      ageGroup: '14-17',
      estimatedGrade: age === 14 ? '8th Grade' : age === 15 ? '9th Grade' : age === 16 ? '10th Grade' : '11th Grade',
      gradeRange: ['7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'],
      description: 'High School • Advanced learning',
      cognitiveLevel: 'formal operational',
      attentionSpan: '30-45 minutes',
      vocabulary: 'advanced',
      complexity: 'complex'
    };
  }
  
  // Default fallback
  return {
    ageGroup: '8-10',
    estimatedGrade: '3rd Grade',
    gradeRange: ['2nd Grade', '3rd Grade', '4th Grade', '5th Grade'],
    description: 'Elementary • Building foundations',
    cognitiveLevel: 'concrete operational',
    attentionSpan: '10-20 minutes',
    vocabulary: 'elementary',
    complexity: 'intermediate'
  };
};

// Function to get age group info for display
export const getAgeGroupInfo = (ageGroup: AgeGroup) => {
  const ageGroupData = {
    '5-7': {
      title: 'Early Learners',
      description: 'Kindergarten - 2nd Grade',
      features: ['Simple vocabulary', 'Basic concepts', 'Fun activities'],
      color: 'bg-green-500',
      icon: '👶'
    },
    '8-10': {
      title: 'Elementary Explorers',
      description: '2nd - 5th Grade',
      features: ['Elementary vocabulary', 'Interactive learning', 'Story building'],
      color: 'bg-blue-500',
      icon: '📚'
    },
    '11-13': {
      title: 'Middle Grade Minds',
      description: '5th - 8th Grade',
      features: ['Complex concepts', 'Critical thinking', 'Research skills'],
      color: 'bg-purple-500',
      icon: '🎓'
    },
    '14-17': {
      title: 'Advanced Scholars',
      description: '8th - 12th Grade',
      features: ['Advanced vocabulary', 'Deep analysis', 'Independent learning'],
      color: 'bg-orange-500',
      icon: '🧠'
    }
  };

  return ageGroupData[ageGroup] || ageGroupData['8-10'];
};

// Function to validate age input
export const isValidAge = (age: string | number): boolean => {
  const numAge = typeof age === 'string' ? parseInt(age) : age;
  return !isNaN(numAge) && numAge >= 5 && numAge <= 17;
};

// Function to get grade level number for sorting/comparison
export const getGradeLevel = (grade: string): number => {
  const gradeMap: { [key: string]: number } = {
    'Kindergarten': 0,
    '1st Grade': 1,
    '2nd Grade': 2,
    '3rd Grade': 3,
    '4th Grade': 4,
    '5th Grade': 5,
    '6th Grade': 6,
    '7th Grade': 7,
    '8th Grade': 8,
    '9th Grade': 9,
    '10th Grade': 10,
    '11th Grade': 11,
    '12th Grade': 12
  };
  
  return gradeMap[grade] || 3; // Default to 3rd grade
};
