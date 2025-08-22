import { Beaker, Atom, Leaf, Rocket, Globe, TreePine, Fish, Bird, Bug, Star, Microscope, Sun } from 'lucide-react';
import { BaseTopicsService, QuickTopic, AgeGroupTopics, AgeGroup } from './BaseTopicsService';

/**
 * Science-specific topics and questions for all age groups
 * Handles natural sciences, experiments, and scientific thinking
 * Enhanced with LLM-based dynamic topic generation
 */
export class ScienceTopicsService extends BaseTopicsService {
  
  /**
   * Get subject name for LLM generation
   */
  getSubjectName(): string {
    return 'science';
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
   * Early Elementary (Ages 5-6) Science Topics
   */
  private getEarlyElementaryTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'sci-k2-explore-1',
          title: 'Animal Friends',
          description: 'Learn about different animals and their homes',
          icon: Bird,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'animals',
          questions: [
            'What sound does a cow make?',
            'Where do fish live?',
            'How do birds fly?'
          ]
        },
        {
          id: 'sci-k2-explore-2',
          title: 'Plants Around Us',
          description: 'Discover how plants grow and what they need',
          icon: Leaf,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'plants',
          questions: [
            'What do plants need to grow?',
            'Why are leaves green?',
            'What part of the plant do we eat when we eat carrots?'
          ]
        },
        {
          id: 'sci-k2-explore-3',
          title: 'Weather Fun',
          description: 'Explore sunny, rainy, and snowy days',
          icon: Sun,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'weather',
          questions: [
            'What makes it rain?',
            'Why do we see rainbows?',
            'What clothes do we wear when it\'s cold?'
          ]
        },
        {
          id: 'sci-k2-explore-4',
          title: 'My Body',
          description: 'Learn about parts of the body and staying healthy',
          icon: Star,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'human body',
          questions: [
            'How many fingers do you have?',
            'What helps you see?',
            'Why do we need to brush our teeth?'
          ]
        }
      ],
      learn: [
        {
          id: 'sci-k2-learn-1',
          title: 'Senses',
          description: 'Discover how we use our five senses',
          icon: Star,
          difficulty: 'beginner',
          estimatedTime: '20 min',
          category: 'senses',
          questions: [
            'What are the five senses?',
            'How do we taste different flavors?',
            'What helps us hear sounds?'
          ]
        },
        {
          id: 'sci-k2-learn-2',
          title: 'Day and Night',
          description: 'Learn why we have day and night',
          icon: Sun,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'space',
          questions: [
            'When do we see the sun?',
            'What do we see in the night sky?',
            'Why does it get dark at night?'
          ]
        }
      ],
      create: [
        {
          id: 'sci-k2-create-1',
          title: 'Nature Collection',
          description: 'Collect and sort things from nature',
          icon: Leaf,
          difficulty: 'beginner',
          estimatedTime: '25 min',
          category: 'collecting',
          questions: [
            'What can you find outside?',
            'How can we group leaves by shape?',
            'What makes rocks different from each other?'
          ]
        },
        {
          id: 'sci-k2-create-2',
          title: 'Simple Experiments',
          description: 'Try easy experiments with water and objects',
          icon: Beaker,
          difficulty: 'beginner',
          estimatedTime: '20 min',
          category: 'experiments',
          questions: [
            'What happens when we mix colors?',
            'Which objects float in water?',
            'How can we make a rainbow with water?'
          ]
        }
      ],
      study: [
        {
          id: 'sci-k2-study-1',
          title: 'Animal Homes',
          description: 'Learn where different animals live',
          icon: Bird,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'habitats',
          questions: [
            'Where do bears sleep in winter?',
            'What is a bird\'s home called?',
            'Do all animals live in the same places?'
          ]
        }
      ]
    };
  }

  /**
   * Late Elementary (Ages 7-8) Science Topics
   */
  private getLateElementaryTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'sci-elem-explore-1',
          title: 'Life Cycles',
          description: 'Discover how living things grow and change',
          icon: Bug,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'biology',
          questions: [
            'How does a caterpillar become a butterfly?',
            'What stages do plants go through?',
            'How do baby animals grow up?'
          ]
        },
        {
          id: 'sci-elem-explore-2',
          title: 'Magnets',
          description: 'Explore how magnets work',
          icon: Atom,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'physics',
          questions: [
            'What things stick to magnets?',
            'Do magnets work through paper?',
            'Why do some magnets push apart?'
          ]
        },
        {
          id: 'sci-elem-explore-3',
          title: 'Rocks and Minerals',
          description: 'Learn about different types of rocks',
          icon: Globe,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'geology',
          questions: [
            'How are rocks formed?',
            'What makes some rocks shiny?',
            'Can you find crystals in rocks?'
          ]
        }
      ],
      learn: [
        {
          id: 'sci-elem-learn-1',
          title: 'States of Matter',
          description: 'Understand solids, liquids, and gases',
          icon: Beaker,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'chemistry',
          questions: [
            'What happens when ice melts?',
            'How is steam different from water?',
            'Can we change a solid into a liquid?'
          ]
        },
        {
          id: 'sci-elem-learn-2',
          title: 'Food Chains',
          description: 'Learn how animals depend on each other for food',
          icon: Fish,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'ecology',
          questions: [
            'What do rabbits eat?',
            'What eats rabbits?',
            'How do all living things depend on plants?'
          ]
        }
      ],
      create: [
        {
          id: 'sci-elem-create-1',
          title: 'Weather Station',
          description: 'Build tools to measure weather',
          icon: Sun,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'meteorology',
          questions: [
            'How can we measure rainfall?',
            'What direction is the wind blowing?',
            'How can we tell if it\'s getting warmer?'
          ]
        }
      ],
      study: [
        {
          id: 'sci-elem-study-1',
          title: 'Plant Parts',
          description: 'Learn the different parts of plants and their jobs',
          icon: Leaf,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'botany',
          questions: [
            'What job do roots do?',
            'Why do plants have flowers?',
            'How do leaves help plants make food?'
          ]
        }
      ]
    };
  }

  /**
   * Middle Grade (Ages 9-10) Science Topics
   */
  private getMiddleGradeTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'sci-middle-explore-1',
          title: 'Solar System',
          description: 'Explore planets, moons, and space',
          icon: Rocket,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'astronomy',
          questions: [
            'How many planets are in our solar system?',
            'What makes Earth special for life?',
            'How long does it take to travel to Mars?'
          ]
        },
        {
          id: 'sci-middle-explore-2',
          title: 'Ecosystems',
          description: 'Discover how living and non-living things interact',
          icon: TreePine,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'ecology',
          questions: [
            'What is an ecosystem?',
            'How do animals adapt to their environment?',
            'What happens when one species disappears?'
          ]
        },
        {
          id: 'sci-middle-explore-3',
          title: 'Simple Machines',
          description: 'Learn about levers, pulleys, and inclined planes',
          icon: Atom,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'physics',
          questions: [
            'How does a lever make work easier?',
            'What simple machines do you use every day?',
            'How do gears work together?'
          ]
        }
      ],
      learn: [
        {
          id: 'sci-middle-learn-1',
          title: 'Electricity',
          description: 'Understand how electricity works',
          icon: Star,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'physics',
          questions: [
            'What is an electric circuit?',
            'How do batteries work?',
            'Why do we use rubber around electric wires?'
          ]
        },
        {
          id: 'sci-middle-learn-2',
          title: 'Human Body Systems',
          description: 'Learn how body systems work together',
          icon: Star,
          difficulty: 'intermediate',
          estimatedTime: '35 min',
          category: 'anatomy',
          questions: [
            'How does your heart pump blood?',
            'What happens to food after you swallow it?',
            'How do your lungs help you breathe?'
          ]
        }
      ],
      create: [
        {
          id: 'sci-middle-create-1',
          title: 'Invention Lab',
          description: 'Design solutions to everyday problems',
          icon: Atom,
          difficulty: 'intermediate',
          estimatedTime: '40 min',
          category: 'engineering',
          questions: [
            'How could you design a better umbrella?',
            'What invention would help animals?',
            'How can we make transportation better?'
          ]
        }
      ],
      study: [
        {
          id: 'sci-middle-study-1',
          title: 'Scientific Method',
          description: 'Learn how scientists ask and answer questions',
          icon: Microscope,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'methodology',
          questions: [
            'What makes a good scientific question?',
            'How do we test our ideas?',
            'Why do we repeat experiments?'
          ]
        }
      ]
    };
  }

  /**
   * Middle School (Ages 11-13) Science Topics
   */
  private getMiddleSchoolTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'sci-ms-explore-1',
          title: 'Genetics',
          description: 'Discover how traits are passed from parents to children',
          icon: Atom,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'biology',
          questions: [
            'Why do you look like your parents?',
            'What is DNA?',
            'How do scientists study genes?'
          ]
        },
        {
          id: 'sci-ms-explore-2',
          title: 'Chemical Reactions',
          description: 'Explore how substances change and combine',
          icon: Beaker,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'chemistry',
          questions: [
            'What happens when baking soda meets vinegar?',
            'How do we know a chemical reaction occurred?',
            'What is the difference between mixing and reacting?'
          ]
        },
        {
          id: 'sci-ms-explore-3',
          title: 'Climate Change',
          description: 'Understand how Earth\'s climate is changing',
          icon: Globe,
          difficulty: 'advanced',
          estimatedTime: '40 min',
          category: 'environmental science',
          questions: [
            'What causes climate change?',
            'How do we study past climates?',
            'What can we do to help our planet?'
          ]
        }
      ],
      learn: [
        {
          id: 'sci-ms-learn-1',
          title: 'Atomic Structure',
          description: 'Learn about atoms and the periodic table',
          icon: Atom,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'chemistry',
          questions: [
            'What are atoms made of?',
            'How is the periodic table organized?',
            'What makes elements different from each other?'
          ]
        },
        {
          id: 'sci-ms-learn-2',
          title: 'Forces and Motion',
          description: 'Understand Newton\'s laws of motion',
          icon: Rocket,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'physics',
          questions: [
            'What is Newton\'s first law?',
            'How does friction affect motion?',
            'What is the relationship between force and acceleration?'
          ]
        }
      ],
      create: [
        {
          id: 'sci-ms-create-1',
          title: 'Experimental Design',
          description: 'Design and conduct your own experiments',
          icon: Microscope,
          difficulty: 'advanced',
          estimatedTime: '45 min',
          category: 'methodology',
          questions: [
            'What question will your experiment answer?',
            'What variables will you control?',
            'How will you collect and analyze data?'
          ]
        }
      ],
      study: [
        {
          id: 'sci-ms-study-1',
          title: 'Cell Biology',
          description: 'Study the basic units of life',
          icon: Microscope,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'biology',
          questions: [
            'What are the parts of a cell?',
            'How are plant cells different from animal cells?',
            'How do cells reproduce?'
          ]
        }
      ]
    };
  }

  /**
   * High School (Ages 14-17) Science Topics
   */
  private getHighSchoolTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'sci-hs-explore-1',
          title: 'Quantum Physics',
          description: 'Explore the strange world of subatomic particles',
          icon: Atom,
          difficulty: 'expert',
          estimatedTime: '50 min',
          category: 'physics',
          questions: [
            'What is quantum mechanics?',
            'How can particles be in two places at once?',
            'What are the practical applications of quantum physics?'
          ]
        },
        {
          id: 'sci-hs-explore-2',
          title: 'Biotechnology',
          description: 'Discover how biology and technology work together',
          icon: Microscope,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'biology',
          questions: [
            'How is genetic engineering changing medicine?',
            'What are the ethics of biotechnology?',
            'How do we create medicines using bacteria?'
          ]
        },
        {
          id: 'sci-hs-explore-3',
          title: 'Astrophysics',
          description: 'Study black holes, galaxies, and the universe',
          icon: Rocket,
          difficulty: 'expert',
          estimatedTime: '55 min',
          category: 'astronomy',
          questions: [
            'How do we detect black holes?',
            'What is dark matter?',
            'How did the universe begin?'
          ]
        }
      ],
      learn: [
        {
          id: 'sci-hs-learn-1',
          title: 'Organic Chemistry',
          description: 'Study carbon-based molecules and their reactions',
          icon: Beaker,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'chemistry',
          questions: [
            'What makes carbon so special for life?',
            'How do we name organic compounds?',
            'What are the major types of organic reactions?'
          ]
        },
        {
          id: 'sci-hs-learn-2',
          title: 'Molecular Biology',
          description: 'Understand how genes control cellular processes',
          icon: Atom,
          difficulty: 'expert',
          estimatedTime: '40 min',
          category: 'biology',
          questions: [
            'How do genes make proteins?',
            'What is CRISPR gene editing?',
            'How do we study gene expression?'
          ]
        }
      ],
      create: [
        {
          id: 'sci-hs-create-1',
          title: 'Research Project',
          description: 'Conduct original scientific research',
          icon: Microscope,
          difficulty: 'expert',
          estimatedTime: '60 min',
          category: 'research',
          questions: [
            'What original question will you investigate?',
            'How will you design a rigorous experiment?',
            'How will you present your findings to the scientific community?'
          ]
        }
      ],
      study: [
        {
          id: 'sci-hs-study-1',
          title: 'AP Science Prep',
          description: 'Prepare for advanced placement science exams',
          icon: Star,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'test prep',
          questions: [
            'What are the key concepts for your AP exam?',
            'How do you approach AP-style problems?',
            'What lab skills do you need to demonstrate?'
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
    
    // Context-based suggestions for science
    if (topic.toLowerCase().includes('animal') || topic.toLowerCase().includes('living')) {
      suggestions.push(
        ...allTopics.explore.filter(t => 
          t.category.includes('biology') || t.category.includes('animals')
        ).slice(0, 2)
      );
    }
    
    if (topic.toLowerCase().includes('space') || topic.toLowerCase().includes('planet')) {
      suggestions.push(
        ...allTopics.learn.filter(t => 
          t.category.includes('astronomy') || t.category.includes('space')
        ).slice(0, 2)
      );
    }
    
    if (topic.toLowerCase().includes('experiment') || topic.toLowerCase().includes('test')) {
      suggestions.push(
        ...allTopics.create.filter(t => 
          t.category.includes('experiments') || t.category.includes('methodology')
        ).slice(0, 2)
      );
    }
    
    // Fill remaining slots with study topics
    while (suggestions.length < 4 && allTopics.study.length > 0) {
      const randomTopic = allTopics.study[Math.floor(Math.random() * allTopics.study.length)];
      if (!suggestions.find(s => s.id === randomTopic.id)) {
        suggestions.push(randomTopic);
      }
    }
    
    return suggestions.slice(0, 4);
  }
}

// Export singleton instance
export const scienceTopicsService = new ScienceTopicsService();
