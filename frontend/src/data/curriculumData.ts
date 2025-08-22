// Comprehensive curriculum data for different boards and grades
export interface Subject {
  id: string;
  name: string;
  description: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  topics: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedHours: number;
}

export interface CurriculumData {
  [board: string]: {
    [grade: string]: Subject[];
  };
}

export const curriculumData: CurriculumData = {
  'NCERT': {
    'Grade 1': [
      {
        id: 'math-1',
        name: 'Mathematics',
        description: 'Basic numbers, shapes, and patterns',
        chapters: [
          {
            id: 'math-1-ch1',
            name: 'Shapes and Space',
            description: 'Learning about basic shapes and spatial concepts',
            topics: ['Circles', 'Squares', 'Triangles', 'Above and Below', 'Inside and Outside'],
            difficulty: 'basic',
            estimatedHours: 8
          },
          {
            id: 'math-1-ch2',
            name: 'Numbers from One to Nine',
            description: 'Introduction to counting and basic numbers',
            topics: ['Counting 1-9', 'Number Recognition', 'More and Less', 'Number Writing'],
            difficulty: 'basic',
            estimatedHours: 10
          }
        ]
      },
      {
        id: 'english-1',
        name: 'English',
        description: 'Basic reading and language skills',
        chapters: [
          {
            id: 'english-1-ch1',
            name: 'A Happy Child',
            description: 'Stories and poems about childhood',
            topics: ['Story Reading', 'Picture Stories', 'Simple Words', 'Letter Sounds'],
            difficulty: 'basic',
            estimatedHours: 6
          }
        ]
      }
    ],
    'Grade 5': [
      {
        id: 'math-5',
        name: 'Mathematics',
        description: 'Numbers, geometry, and basic algebra',
        chapters: [
          {
            id: 'math-5-ch1',
            name: 'The Fish Tale',
            description: 'Large numbers and place value',
            topics: ['Place Value', 'Large Numbers', 'Comparing Numbers', 'Rounding Off'],
            difficulty: 'intermediate',
            estimatedHours: 12
          },
          {
            id: 'math-5-ch2',
            name: 'Shapes and Angles',
            description: 'Geometry concepts and angle measurement',
            topics: ['Types of Angles', 'Triangles', 'Quadrilaterals', 'Circles', 'Symmetry'],
            difficulty: 'intermediate',
            estimatedHours: 15
          },
          {
            id: 'math-5-ch3',
            name: 'Be My Multiple, I\'ll be Your Factor',
            description: 'Factors, multiples, and divisibility',
            topics: ['Factors', 'Multiples', 'Prime Numbers', 'Composite Numbers', 'Divisibility Rules'],
            difficulty: 'intermediate',
            estimatedHours: 10
          }
        ]
      },
      {
        id: 'science-5',
        name: 'Science',
        description: 'Environmental science and basic concepts',
        chapters: [
          {
            id: 'science-5-ch1',
            name: 'Super Senses',
            description: 'Understanding our five senses',
            topics: ['Five Senses', 'Animals and Senses', 'Sense Organs', 'Protection of Senses'],
            difficulty: 'basic',
            estimatedHours: 8
          },
          {
            id: 'science-5-ch2',
            name: 'A Snake Charmer\'s Story',
            description: 'Learning about snakes and their characteristics',
            topics: ['Types of Snakes', 'Snake Behavior', 'Snake Charmers', 'Snake Safety'],
            difficulty: 'intermediate',
            estimatedHours: 6
          }
        ]
      }
    ],
    'Grade 8': [
      {
        id: 'math-8',
        name: 'Mathematics',
        description: 'Algebra, geometry, and statistics',
        chapters: [
          {
            id: 'math-8-ch1',
            name: 'Rational Numbers',
            description: 'Properties and operations on rational numbers',
            topics: ['Properties of Rational Numbers', 'Addition and Subtraction', 'Multiplication and Division', 'Closure Property'],
            difficulty: 'intermediate',
            estimatedHours: 14
          },
          {
            id: 'math-8-ch2',
            name: 'Linear Equations in One Variable',
            description: 'Solving linear equations with one variable',
            topics: ['Simple Equations', 'Applications of Linear Equations', 'Reducing to Simple Form', 'Solving Word Problems'],
            difficulty: 'intermediate',
            estimatedHours: 16
          },
          {
            id: 'math-8-ch3',
            name: 'Understanding Quadrilaterals',
            description: 'Properties of quadrilaterals and polygons',
            topics: ['Polygons', 'Classification of Quadrilaterals', 'Properties of Parallelograms', 'Constructing Quadrilaterals'],
            difficulty: 'intermediate',
            estimatedHours: 12
          }
        ]
      },
      {
        id: 'science-8',
        name: 'Science',
        description: 'Physics, chemistry, and biology concepts',
        chapters: [
          {
            id: 'science-8-ch1',
            name: 'Crop Production and Management',
            description: 'Agricultural practices and crop management',
            topics: ['Agricultural Practices', 'Basic Practices of Crop Production', 'Preparation of Soil', 'Sowing', 'Adding Manure and Fertilizers'],
            difficulty: 'intermediate',
            estimatedHours: 10
          },
          {
            id: 'science-8-ch2',
            name: 'Microorganisms: Friend and Foe',
            description: 'Understanding microorganisms and their effects',
            topics: ['Microorganisms', 'Where do Microorganisms Live?', 'Microorganisms and Us', 'Harmful Microorganisms'],
            difficulty: 'intermediate',
            estimatedHours: 8
          }
        ]
      }
    ]
  },
  'CBSE': {
    'Grade 5': [
      {
        id: 'math-cbse-5',
        name: 'Mathematics',
        description: 'CBSE curriculum for Grade 5 Mathematics',
        chapters: [
          {
            id: 'math-cbse-5-ch1',
            name: 'Large Numbers',
            description: 'Understanding and working with large numbers',
            topics: ['Place Value System', 'Indian and International Number System', 'Comparing Numbers', 'Rounding Off Numbers'],
            difficulty: 'intermediate',
            estimatedHours: 14
          },
          {
            id: 'math-cbse-5-ch2',
            name: 'Addition and Subtraction',
            description: 'Operations with large numbers',
            topics: ['Addition of Large Numbers', 'Subtraction of Large Numbers', 'Estimation', 'Word Problems'],
            difficulty: 'intermediate',
            estimatedHours: 12
          }
        ]
      },
      {
        id: 'english-cbse-5',
        name: 'English',
        description: 'CBSE English curriculum with literature and language',
        chapters: [
          {
            id: 'english-cbse-5-ch1',
            name: 'Ice-cream Man',
            description: 'Poetry and comprehension',
            topics: ['Poem Recitation', 'Comprehension Questions', 'Vocabulary Building', 'Creative Writing'],
            difficulty: 'intermediate',
            estimatedHours: 6
          }
        ]
      }
    ],
    'Grade 10': [
      {
        id: 'math-cbse-10',
        name: 'Mathematics',
        description: 'Advanced mathematics for Grade 10',
        chapters: [
          {
            id: 'math-cbse-10-ch1',
            name: 'Real Numbers',
            description: 'Properties and operations on real numbers',
            topics: ['Euclid\'s Division Lemma', 'Fundamental Theorem of Arithmetic', 'Rational and Irrational Numbers', 'Decimal Expansions'],
            difficulty: 'advanced',
            estimatedHours: 18
          },
          {
            id: 'math-cbse-10-ch2',
            name: 'Polynomials',
            description: 'Understanding polynomials and their properties',
            topics: ['Polynomials in One Variable', 'Zeros of a Polynomial', 'Remainder Theorem', 'Factorization of Polynomials'],
            difficulty: 'advanced',
            estimatedHours: 16
          },
          {
            id: 'math-cbse-10-ch3',
            name: 'Pair of Linear Equations in Two Variables',
            description: 'Solving systems of linear equations',
            topics: ['Pair of Linear Equations', 'Graphical Method', 'Algebraic Methods', 'Applications of Linear Equations'],
            difficulty: 'advanced',
            estimatedHours: 20
          }
        ]
      },
      {
        id: 'science-cbse-10',
        name: 'Science',
        description: 'Integrated science covering physics, chemistry, and biology',
        chapters: [
          {
            id: 'science-cbse-10-ch1',
            name: 'Light - Reflection and Refraction',
            description: 'Properties of light and optical phenomena',
            topics: ['Reflection of Light', 'Spherical Mirrors', 'Refraction of Light', 'Lens Formula', 'Power of Lens'],
            difficulty: 'advanced',
            estimatedHours: 16
          },
          {
            id: 'science-cbse-10-ch2',
            name: 'Life Processes',
            description: 'Understanding life processes in living organisms',
            topics: ['Life Processes', 'Nutrition', 'Respiration', 'Transportation', 'Excretion'],
            difficulty: 'advanced',
            estimatedHours: 18
          }
        ]
      }
    ]
  }
};

// Helper functions to get curriculum data
export const getSubjectsForBoard = (board: string, grade: string): Subject[] => {
  return curriculumData[board]?.[grade] || [];
};

export const getChaptersForSubject = (board: string, grade: string, subjectId: string): Chapter[] => {
  const subjects = getSubjectsForBoard(board, grade);
  const subject = subjects.find(s => s.id === subjectId);
  return subject?.chapters || [];
};

export const getAllBoards = (): string[] => {
  return Object.keys(curriculumData);
};

export const getGradesForBoard = (board: string): string[] => {
  return Object.keys(curriculumData[board] || {});
};

// Practice question generation prompts
export const getPracticePrompt = (
  board: string, 
  grade: string, 
  subject: string, 
  chapter: string, 
  topics: string[],
  questionType: 'mixed' | 'mcq' | 'longform' = 'mixed'
): string => {
  const basePrompt = `Generate practice questions for ${board} ${grade} curriculum.
Subject: ${subject}
Chapter: ${chapter}
Topics: ${topics.join(', ')}

Requirements:`;

  const typeSpecificPrompt = {
    mixed: `
- Create 3 MCQ questions and 2 long-form questions
- MCQ format: {"type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}
- Long-form format: {"type": "longform", "question": "...", "context": "...", "rubric": ["Point 1", "Point 2"], "expectedLength": "medium"}
- Mix difficulty levels appropriate for ${grade}`,
    
    mcq: `
- Create 5 MCQ questions only
- Format: {"type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}
- Include easy, medium, and hard questions appropriate for ${grade}`,
    
    longform: `
- Create 3 long-form questions only  
- Format: {"type": "longform", "question": "...", "context": "...", "rubric": ["Point 1", "Point 2"], "expectedLength": "medium"}
- Focus on conceptual understanding and application for ${grade} level`
  };

  return basePrompt + typeSpecificPrompt[questionType] + `

Make questions engaging, curriculum-aligned, and age-appropriate. Provide clear explanations and grading rubrics.`;
};
