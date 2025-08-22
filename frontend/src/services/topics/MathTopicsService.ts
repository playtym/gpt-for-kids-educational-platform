import { Calculator, Brain, Puzzle, Star, Gamepad2, Atom, Target, TrendingUp } from 'lucide-react';
import { BaseTopicsService, QuickTopic, AgeGroupTopics, AgeGroup } from './BaseTopicsService';

/**
 * Math-specific topics and questions for all age groups
 * Handles mathematical concepts, problem solving, and numerical thinking
 * Enhanced with LLM-based dynamic topic generation
 */
export class MathTopicsService extends BaseTopicsService {
  
  /**
   * Get subject name for LLM generation
   */
  getSubjectName(): string {
    return 'math';
  }

  /**
   * Get static/fallback topics when LLM is unavailable
   */
  getStaticTopicsForAge(ageGroup: AgeGroup): AgeGroupTopics {
    switch (ageGroup) {
      case '5-6':
        return this.getEarlyElementaryTopics();
      case '7-8':
        return this.getLateElementaryTopics();
      case '9-10':
        return this.getMiddleGradeTopics();
      case '11-13':
        return this.getMiddleSchoolTopics();
      case '14-17':
        return this.getHighSchoolTopics();
      default:
        return this.getMiddleGradeTopics();
    }
  }

  /**
   * Early Elementary (Ages 5-6) Math Topics
   */
  private getEarlyElementaryTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'math-k2-explore-1',
          title: 'Counting Fun',
          description: 'Count objects and learn number recognition',
          icon: Calculator,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'numbers',
          questions: [
            'How many toys do you see?',
            'What comes after 5?',
            'Can you count to 20?'
          ]
        },
        {
          id: 'math-k2-explore-2',
          title: 'Shape Hunt',
          description: 'Find and identify shapes around us',
          icon: Star,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'shapes',
          questions: [
            'What shape is a ball?',
            'How many sides does a triangle have?',
            'Can you find a circle in your room?'
          ]
        },
        {
          id: 'math-k2-explore-3',
          title: 'Bigger and Smaller',
          description: 'Compare sizes and amounts',
          icon: Brain,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'comparison',
          questions: [
            'Which pile has more blocks?',
            'Is an elephant bigger than a mouse?',
            'What\'s the tallest thing you can see?'
          ]
        }
      ],
      learn: [
        {
          id: 'math-k2-learn-1',
          title: 'Number Line',
          description: 'Learn how numbers are ordered',
          icon: TrendingUp,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'numbers',
          questions: [
            'What number comes between 3 and 5?',
            'How do we count forward?',
            'Can you show me where 7 goes?'
          ]
        },
        {
          id: 'math-k2-learn-2',
          title: 'Simple Adding',
          description: 'Learn to add small numbers',
          icon: Calculator,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'addition',
          questions: [
            'What is 2 + 1?',
            'If you have 3 apples and get 2 more, how many do you have?',
            'How do we make 5 using two numbers?'
          ]
        }
      ],
      create: [
        {
          id: 'math-k2-create-1',
          title: 'Number Stories',
          description: 'Make up stories with numbers',
          icon: Brain,
          difficulty: 'beginner',
          estimatedTime: '20 min',
          category: 'storytelling',
          questions: [
            'Can you tell a story about 3 little pigs?',
            'What happens when we add one more friend?',
            'How would you share 6 cookies with friends?'
          ]
        }
      ],
      study: [
        {
          id: 'math-k2-study-1',
          title: 'Number Practice',
          description: 'Practice writing and recognizing numbers',
          icon: Target,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'practice',
          questions: [
            'Can you write the number 8?',
            'Which number looks like a snake?',
            'Let\'s practice counting to 10'
          ]
        }
      ]
    };
  }

  /**
   * Late Elementary (Ages 7-8) Math Topics
   */
  private getLateElementaryTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'math-elem-explore-1',
          title: 'Two-Digit Numbers',
          description: 'Explore numbers larger than 10',
          icon: Calculator,
          difficulty: 'intermediate',
          estimatedTime: '15 min',
          category: 'numbers',
          questions: [
            'What does 23 mean?',
            'How do we count to 100?',
            'What comes after 39?'
          ]
        },
        {
          id: 'math-elem-explore-2',
          title: 'Patterns Everywhere',
          description: 'Find patterns in numbers and shapes',
          icon: Puzzle,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'patterns',
          questions: [
            'What comes next: 2, 4, 6, ?',
            'Can you make a pattern with shapes?',
            'What pattern do you see in even numbers?'
          ]
        }
      ],
      learn: [
        {
          id: 'math-elem-learn-1',
          title: 'Subtraction',
          description: 'Learn to take numbers away',
          icon: Calculator,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'subtraction',
          questions: [
            'What is 10 - 3?',
            'If you eat 2 of your 7 cookies, how many are left?',
            'How is subtraction different from addition?'
          ]
        },
        {
          id: 'math-elem-learn-2',
          title: 'Time Telling',
          description: 'Learn to read clocks',
          icon: Target,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'time',
          questions: [
            'What time does the clock show?',
            'How many minutes are in an hour?',
            'When do you eat lunch?'
          ]
        }
      ],
      create: [
        {
          id: 'math-elem-create-1',
          title: 'Math Games',
          description: 'Invent your own math games',
          icon: Gamepad2,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'games',
          questions: [
            'Can you make a counting game?',
            'How would you play addition with dice?',
            'What math game could you teach a friend?'
          ]
        }
      ],
      study: [
        {
          id: 'math-elem-study-1',
          title: 'Fact Families',
          description: 'Learn how addition and subtraction work together',
          icon: Brain,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'relationships',
          questions: [
            'If 5 + 3 = 8, what does 8 - 3 equal?',
            'How are these numbers related: 4, 6, 10?',
            'Can you make a fact family with 2, 7, and 9?'
          ]
        }
      ]
    };
  }

  /**
   * Middle Grade (Ages 9-10) Math Topics
   */
  private getMiddleGradeTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'math-middle-explore-1',
          title: 'Multiplication Magic',
          description: 'Discover the patterns in multiplication',
          icon: Star,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'multiplication',
          questions: [
            'What patterns do you see in the 5 times table?',
            'How is 6 × 4 related to 4 × 6?',
            'What\'s the fastest way to multiply by 10?'
          ]
        },
        {
          id: 'math-middle-explore-2',
          title: 'Fractions in Life',
          description: 'Find fractions in everyday things',
          icon: Puzzle,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'fractions',
          questions: [
            'How do we share a pizza fairly?',
            'What does half of your day look like?',
            'Can you find fourths in your house?'
          ]
        }
      ],
      learn: [
        {
          id: 'math-middle-learn-1',
          title: 'Long Division',
          description: 'Learn to divide larger numbers',
          icon: Calculator,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'division',
          questions: [
            'How do we divide 84 by 4?',
            'What steps do we follow in long division?',
            'How can we check our division answer?'
          ]
        },
        {
          id: 'math-middle-learn-2',
          title: 'Decimals',
          description: 'Understand numbers with decimal points',
          icon: Target,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'decimals',
          questions: [
            'What does 3.5 mean?',
            'How do we add 2.3 + 1.7?',
            'Which is bigger: 0.8 or 0.75?'
          ]
        }
      ],
      create: [
        {
          id: 'math-middle-create-1',
          title: 'Word Problem Writing',
          description: 'Create your own math problems',
          icon: Brain,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'problem-solving',
          questions: [
            'Can you write a problem about buying candy?',
            'How would you create a time problem?',
            'What real-life situation uses multiplication?'
          ]
        }
      ],
      study: [
        {
          id: 'math-middle-study-1',
          title: 'Times Table Mastery',
          description: 'Master multiplication facts',
          icon: TrendingUp,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'memorization',
          questions: [
            'Let\'s practice the 8 times table',
            'What tricks help you remember 7 × 8?',
            'Can you do these multiplication facts quickly?'
          ]
        }
      ]
    };
  }

  /**
   * Middle School (Ages 11-13) Math Topics
   */
  private getMiddleSchoolTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'math-ms-explore-1',
          title: 'Algebra Basics',
          description: 'Introduction to variables and equations',
          icon: Brain,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'algebra',
          questions: [
            'What does the letter x represent in math?',
            'How do we solve x + 5 = 12?',
            'Why do we use variables in math?'
          ]
        },
        {
          id: 'math-ms-explore-2',
          title: 'Geometry Shapes',
          description: 'Explore angles, area, and perimeter',
          icon: Star,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'geometry',
          questions: [
            'How do we find the area of a rectangle?',
            'What makes an angle acute or obtuse?',
            'How is perimeter different from area?'
          ]
        }
      ],
      learn: [
        {
          id: 'math-ms-learn-1',
          title: 'Percentages',
          description: 'Understand parts of 100',
          icon: Calculator,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'percentages',
          questions: [
            'What is 25% of 80?',
            'How do we calculate a 15% tip?',
            'If you got 18 out of 20 questions right, what\'s your percentage?'
          ]
        },
        {
          id: 'math-ms-learn-2',
          title: 'Negative Numbers',
          description: 'Work with numbers below zero',
          icon: TrendingUp,
          difficulty: 'advanced',
          estimatedTime: '25 min',
          category: 'integers',
          questions: [
            'What is -5 + 8?',
            'How do we subtract negative numbers?',
            'Where do we see negative numbers in real life?'
          ]
        }
      ],
      create: [
        {
          id: 'math-ms-create-1',
          title: 'Data Visualization',
          description: 'Create graphs and charts',
          icon: TrendingUp,
          difficulty: 'advanced',
          estimatedTime: '40 min',
          category: 'statistics',
          questions: [
            'How can we show survey data in a graph?',
            'What type of chart works best for your data?',
            'What story does your graph tell?'
          ]
        }
      ],
      study: [
        {
          id: 'math-ms-study-1',
          title: 'Equation Solving',
          description: 'Practice solving for unknown variables',
          icon: Target,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'algebra',
          questions: [
            'Solve: 3x + 7 = 22',
            'What steps do we use to isolate x?',
            'How can we check our answer?'
          ]
        }
      ]
    };
  }

  /**
   * High School (Ages 14-17) Math Topics
   */
  private getHighSchoolTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'math-hs-explore-1',
          title: 'Functions',
          description: 'Explore mathematical relationships',
          icon: TrendingUp,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'functions',
          questions: [
            'What is a function in mathematics?',
            'How do we graph y = 2x + 3?',
            'What does the slope of a line represent?'
          ]
        },
        {
          id: 'math-hs-explore-2',
          title: 'Trigonometry',
          description: 'Study triangles and their relationships',
          icon: Star,
          difficulty: 'expert',
          estimatedTime: '50 min',
          category: 'trigonometry',
          questions: [
            'What are sine, cosine, and tangent?',
            'How do we use trigonometry in real life?',
            'What is the Pythagorean theorem?'
          ]
        }
      ],
      learn: [
        {
          id: 'math-hs-learn-1',
          title: 'Quadratic Equations',
          description: 'Solve equations with squared terms',
          icon: Brain,
          difficulty: 'expert',
          estimatedTime: '40 min',
          category: 'algebra',
          questions: [
            'How do we solve x² + 5x + 6 = 0?',
            'What is the quadratic formula?',
            'How do we factor quadratic expressions?'
          ]
        },
        {
          id: 'math-hs-learn-2',
          title: 'Calculus Introduction',
          description: 'Understand rates of change',
          icon: Atom,
          difficulty: 'expert',
          estimatedTime: '50 min',
          category: 'calculus',
          questions: [
            'What is a derivative?',
            'How do we find the slope of a curve?',
            'What does integration represent?'
          ]
        }
      ],
      create: [
        {
          id: 'math-hs-create-1',
          title: 'Mathematical Modeling',
          description: 'Create models of real-world situations',
          icon: TrendingUp,
          difficulty: 'expert',
          estimatedTime: '60 min',
          category: 'modeling',
          questions: [
            'How can we model population growth?',
            'What equation describes a bouncing ball?',
            'How do we optimize a business problem?'
          ]
        }
      ],
      study: [
        {
          id: 'math-hs-study-1',
          title: 'SAT Math Prep',
          description: 'Practice for standardized tests',
          icon: Target,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'test-prep',
          questions: [
            'What math topics are on the SAT?',
            'How do we approach word problems efficiently?',
            'What are common test-taking strategies?'
          ]
        }
      ]
    };
  }

  /**
   * Get contextual suggestions based on topic
   */
  async getContextualSuggestions(topic: string, ageGroup: AgeGroup): Promise<QuickTopic[]> {
    const suggestions: QuickTopic[] = [];
    const allTopics = await this.getStaticTopicsForAge(ageGroup);
    
    // Context-based suggestions for math
    if (topic.toLowerCase().includes('number') || topic.toLowerCase().includes('count')) {
      suggestions.push(
        ...allTopics.explore.filter(t => 
          t.category.includes('numbers') || t.category.includes('counting')
        ).slice(0, 2)
      );
    }
    
    if (topic.toLowerCase().includes('shape') || topic.toLowerCase().includes('geometry')) {
      suggestions.push(
        ...allTopics.learn.filter(t => 
          t.category.includes('geometry') || t.category.includes('shapes')
        ).slice(0, 2)
      );
    }
    
    if (topic.toLowerCase().includes('add') || topic.toLowerCase().includes('multiply')) {
      suggestions.push(
        ...allTopics.study.filter(t => 
          t.category.includes('addition') || t.category.includes('multiplication')
        ).slice(0, 2)
      );
    }
    
    // Fill remaining slots with create topics
    while (suggestions.length < 4 && allTopics.create.length > 0) {
      const randomTopic = allTopics.create[Math.floor(Math.random() * allTopics.create.length)];
      if (!suggestions.find(s => s.id === randomTopic.id)) {
        suggestions.push(randomTopic);
      }
    }
    
    return suggestions.slice(0, 4);
  }
}

// Export singleton instance
export const mathTopicsService = new MathTopicsService();
