import { 
  Leaf, Rocket, Atom, Globe, Calculator, BookOpen, Beaker, Users, 
  Music, Palette, Wand2, Brain, Languages, History, Heart, Gamepad2,
  Camera, Lightbulb, Puzzle, Star, TreePine, Fish, Bird, Bug
} from 'lucide-react';

export interface QuickTopic {
  icon: any;
  title: string;
  color: string;
  questions: string[];
}

export interface AgeGroupTopics {
  explore: QuickTopic[];
  learn: QuickTopic[];
  create: QuickTopic[];
  study: QuickTopic[];
}

export type AgeGroup = '5-7' | '8-10' | '11-13' | '14-17';
export type Mode = 'explore' | 'learn' | 'create' | 'study';

class QuickTopicsService {
  private topicsByAge: Record<AgeGroup, AgeGroupTopics> = {
    '5-7': {
      explore: [
        { 
          icon: Leaf, 
          title: 'Nature', 
          color: 'text-green-600', 
          questions: [
            'Why are leaves green?', 
            'How do flowers grow?',
            'What do bees do?',
            'Why does it rain?'
          ] 
        },
        { 
          icon: Bird, 
          title: 'Animals', 
          color: 'text-blue-600', 
          questions: [
            'How do birds fly?', 
            'What do cats dream about?',
            'Why do dogs wag their tails?',
            'How do fish breathe underwater?'
          ] 
        },
        { 
          icon: Star, 
          title: 'Space', 
          color: 'text-purple-600', 
          questions: [
            'Why is the moon sometimes round?', 
            'Where do stars come from?',
            'What is the sun made of?',
            'Are there aliens in space?'
          ] 
        },
        { 
          icon: Heart, 
          title: 'Family', 
          color: 'text-pink-600', 
          questions: [
            'Why do we have families?', 
            'How are babies made?',
            'Why do we need friends?',
            'What makes people happy?'
          ] 
        }
      ],
      learn: [
        { 
          icon: Calculator, 
          title: 'Numbers', 
          color: 'text-blue-600', 
          questions: [
            'How do we count to 100?', 
            'What are big and small numbers?',
            'How do we add things together?',
            'What shapes can you find around us?'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'Letters', 
          color: 'text-green-600', 
          questions: [
            'How do letters make words?', 
            'What sounds do letters make?',
            'How do we read stories?',
            'Why do we write things down?'
          ] 
        },
        { 
          icon: Palette, 
          title: 'Colors', 
          color: 'text-orange-600', 
          questions: [
            'How do we make new colors?', 
            'What are primary colors?',
            'Why do things have different colors?',
            'How do artists paint pictures?'
          ] 
        },
        { 
          icon: Music, 
          title: 'Sounds', 
          color: 'text-purple-600', 
          questions: [
            'How do musical instruments work?', 
            'What makes loud and quiet sounds?',
            'Why do we like music?',
            'How do we sing songs?'
          ] 
        }
      ],
      create: [
        { 
          icon: BookOpen, 
          title: 'Stories', 
          color: 'text-blue-600', 
          questions: [
            'Tell a story about a friendly dragon', 
            'Create an adventure with talking animals',
            'Make up a tale about a magic tree',
            'Write about a day at the playground'
          ] 
        },
        { 
          icon: Users, 
          title: 'Characters', 
          color: 'text-green-600', 
          questions: [
            'Design a superhero who helps animals', 
            'Create a funny monster friend',
            'Make up a fairy who grants wishes',
            'Invent a robot that loves to play'
          ] 
        },
        { 
          icon: Music, 
          title: 'Songs', 
          color: 'text-purple-600', 
          questions: [
            'Make up a song about your favorite toy', 
            'Create a rhyme about going to bed',
            'Write a silly song about food',
            'Compose a tune about friendship'
          ] 
        },
        { 
          icon: Palette, 
          title: 'Art', 
          color: 'text-pink-600', 
          questions: [
            'Draw a picture of your dream house', 
            'Create art with different shapes',
            'Design a flag for your family',
            'Make a collage of happy things'
          ] 
        }
      ],
      study: [
        { 
          icon: Calculator, 
          title: 'Math Fun', 
          color: 'text-blue-600', 
          questions: [
            'Practice counting to 20', 
            'Learn about big and small',
            'Understanding shapes around us',
            'Simple addition with toys'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'Reading', 
          color: 'text-green-600', 
          questions: [
            'Letter recognition practice', 
            'Simple word building',
            'Picture book comprehension',
            'Phonics and sounds'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Discovery', 
          color: 'text-orange-600', 
          questions: [
            'How plants grow', 
            'Weather and seasons',
            'Our five senses',
            'How our body works'
          ] 
        },
        { 
          icon: Globe, 
          title: 'World', 
          color: 'text-purple-600', 
          questions: [
            'My family and community', 
            'Different places people live',
            'How we help each other',
            'Traditions and celebrations'
          ] 
        }
      ]
    },
    '8-10': {
      explore: [
        { 
          icon: Leaf, 
          title: 'Nature', 
          color: 'text-green-600', 
          questions: [
            'Why is grass green?', 
            'How do plants eat?',
            'What makes a rainbow?',
            'How do seasons change?'
          ] 
        },
        { 
          icon: Rocket, 
          title: 'Space', 
          color: 'text-purple-600', 
          questions: [
            'Why is space dark?', 
            'How do rockets fly?',
            'What are black holes?',
            'Could we live on Mars?'
          ] 
        },
        { 
          icon: Atom, 
          title: 'Science', 
          color: 'text-blue-600', 
          questions: [
            'What is electricity?', 
            'How do magnets work?',
            'Why do things float or sink?',
            'How do our eyes see colors?'
          ] 
        },
        { 
          icon: Globe, 
          title: 'World', 
          color: 'text-orange-600', 
          questions: [
            'How are mountains made?', 
            'Why do we have different languages?',
            'What causes earthquakes?',
            'How do oceans stay salty?'
          ] 
        }
      ],
      learn: [
        { 
          icon: Calculator, 
          title: 'Math', 
          color: 'text-blue-600', 
          questions: [
            'How does multiplication work?', 
            'What are fractions really?',
            'Why do we need geometry?',
            'How do we solve word problems?'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'Language', 
          color: 'text-green-600', 
          questions: [
            'What makes a good story?', 
            'How do we use grammar correctly?',
            'Why do words have different meanings?',
            'How do we become better writers?'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Science', 
          color: 'text-purple-600', 
          questions: [
            'How do experiments help us learn?', 
            'What is the scientific method?',
            'How do we know if something is true?',
            'Why do scientists ask questions?'
          ] 
        },
        { 
          icon: Globe, 
          title: 'History', 
          color: 'text-orange-600', 
          questions: [
            'How did civilizations develop?', 
            'What can we learn from the past?',
            'Why do we study ancient cultures?',
            'How do historians know what happened?'
          ] 
        }
      ],
      create: [
        { 
          icon: BookOpen, 
          title: 'Stories', 
          color: 'text-blue-600', 
          questions: [
            'Write a story about a brave mouse', 
            'Create an adventure in space',
            'Tell a tale about time travel',
            'Write about a world where animals talk'
          ] 
        },
        { 
          icon: Users, 
          title: 'Characters', 
          color: 'text-green-600', 
          questions: [
            'Design a friendly robot', 
            'Create a magical creature',
            'Invent a superhero with unique powers',
            'Make up a villain who becomes good'
          ] 
        },
        { 
          icon: Music, 
          title: 'Poems', 
          color: 'text-purple-600', 
          questions: [
            'Write a poem about friendship', 
            'Create a rhyme about nature',
            'Compose a song about your dreams',
            'Write a haiku about seasons'
          ] 
        },
        { 
          icon: Globe, 
          title: 'Worlds', 
          color: 'text-orange-600', 
          questions: [
            'Build an underwater city', 
            'Design a magical forest',
            'Create a floating island',
            'Invent a world made of clouds'
          ] 
        }
      ],
      study: [
        { 
          icon: Calculator, 
          title: 'Mathematics', 
          color: 'text-blue-600', 
          questions: [
            'Multiplication tables practice', 
            'Understanding fractions',
            'Basic geometry concepts',
            'Word problem strategies'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Science', 
          color: 'text-green-600', 
          questions: [
            'Life cycles and habitats', 
            'Matter and energy basics',
            'Simple machines',
            'Weather and climate'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'English', 
          color: 'text-purple-600', 
          questions: [
            'Reading comprehension skills', 
            'Creative writing techniques',
            'Grammar and punctuation',
            'Vocabulary building'
          ] 
        },
        { 
          icon: Globe, 
          title: 'Social Studies', 
          color: 'text-orange-600', 
          questions: [
            'Community and citizenship', 
            'Geography and maps',
            'Historical timelines',
            'Cultures around the world'
          ] 
        }
      ]
    },
    '11-13': {
      explore: [
        { 
          icon: Brain, 
          title: 'Psychology', 
          color: 'text-purple-600', 
          questions: [
            'How does memory work?', 
            'Why do we have emotions?',
            'What makes people different?',
            'How do we make decisions?'
          ] 
        },
        { 
          icon: Atom, 
          title: 'Technology', 
          color: 'text-blue-600', 
          questions: [
            'How do computers think?', 
            'What is artificial intelligence?',
            'How does the internet work?',
            'What is virtual reality?'
          ] 
        },
        { 
          icon: Globe, 
          title: 'Environment', 
          color: 'text-green-600', 
          questions: [
            'What is climate change?', 
            'How can we protect ecosystems?',
            'What is renewable energy?',
            'How do human actions affect nature?'
          ] 
        },
        { 
          icon: Users, 
          title: 'Society', 
          color: 'text-orange-600', 
          questions: [
            'How do governments work?', 
            'What creates social change?',
            'Why do cultures differ?',
            'How do economies function?'
          ] 
        }
      ],
      learn: [
        { 
          icon: Calculator, 
          title: 'Advanced Math', 
          color: 'text-blue-600', 
          questions: [
            'How do algebraic equations work?', 
            'What is the purpose of geometry?',
            'How do we analyze data?',
            'What are mathematical proofs?'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Sciences', 
          color: 'text-green-600', 
          questions: [
            'How do chemical reactions happen?', 
            'What are the laws of physics?',
            'How does genetics work?',
            'What is the scientific process?'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'Literature', 
          color: 'text-purple-600', 
          questions: [
            'How do authors create meaning?', 
            'What makes literature timeless?',
            'How do we analyze themes?',
            'What is effective communication?'
          ] 
        },
        { 
          icon: History, 
          title: 'History', 
          color: 'text-orange-600', 
          questions: [
            'How do historical events connect?', 
            'What drives social movements?',
            'How do we learn from the past?',
            'What shapes civilizations?'
          ] 
        }
      ],
      create: [
        { 
          icon: Camera, 
          title: 'Media', 
          color: 'text-blue-600', 
          questions: [
            'Create a documentary concept', 
            'Design a social media campaign',
            'Write a screenplay scene',
            'Plan a podcast episode'
          ] 
        },
        { 
          icon: Lightbulb, 
          title: 'Innovation', 
          color: 'text-green-600', 
          questions: [
            'Invent a solution to a real problem', 
            'Design an app for teenagers',
            'Create a sustainable product',
            'Plan a community project'
          ] 
        },
        { 
          icon: Music, 
          title: 'Expression', 
          color: 'text-purple-600', 
          questions: [
            'Compose music that tells a story', 
            'Write poetry about identity',
            'Create a performance piece',
            'Design visual art with meaning'
          ] 
        },
        { 
          icon: Puzzle, 
          title: 'Games', 
          color: 'text-orange-600', 
          questions: [
            'Design a board game', 
            'Create a mystery story',
            'Invent a new sport',
            'Build a video game concept'
          ] 
        }
      ],
      study: [
        { 
          icon: Calculator, 
          title: 'Mathematics', 
          color: 'text-blue-600', 
          questions: [
            'Algebra and linear equations', 
            'Geometry proofs and theorems',
            'Statistics and probability',
            'Pre-calculus concepts'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Science', 
          color: 'text-green-600', 
          questions: [
            'Chemistry bonding and reactions', 
            'Physics forces and motion',
            'Biology cells and genetics',
            'Earth science and astronomy'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'English', 
          color: 'text-purple-600', 
          questions: [
            'Literary analysis and themes', 
            'Essay writing and argumentation',
            'Grammar and syntax',
            'Research and citations'
          ] 
        },
        { 
          icon: Globe, 
          title: 'Social Studies', 
          color: 'text-orange-600', 
          questions: [
            'World history and civilizations', 
            'Government and civics',
            'Geography and human impact',
            'Economics and trade'
          ] 
        }
      ]
    },
    '14-17': {
      explore: [
        { 
          icon: Brain, 
          title: 'Philosophy', 
          color: 'text-purple-600', 
          questions: [
            'What is the meaning of existence?', 
            'How do we define consciousness?',
            'What is the nature of reality?',
            'How should we live ethically?'
          ] 
        },
        { 
          icon: Atom, 
          title: 'Future Tech', 
          color: 'text-blue-600', 
          questions: [
            'How will AI change society?', 
            'What is quantum computing?',
            'How might we colonize space?',
            'What are the ethics of biotechnology?'
          ] 
        },
        { 
          icon: Globe, 
          title: 'Global Issues', 
          color: 'text-green-600', 
          questions: [
            'How can we address inequality?', 
            'What drives international conflicts?',
            'How do we tackle climate crisis?',
            'What is sustainable development?'
          ] 
        },
        { 
          icon: Users, 
          title: 'Identity', 
          color: 'text-orange-600', 
          questions: [
            'How do we form our identity?', 
            'What influences our beliefs?',
            'How do we find our purpose?',
            'What shapes our worldview?'
          ] 
        }
      ],
      learn: [
        { 
          icon: Calculator, 
          title: 'Higher Math', 
          color: 'text-blue-600', 
          questions: [
            'How does calculus model change?', 
            'What are the foundations of mathematics?',
            'How do we apply statistics in research?',
            'What is mathematical modeling?'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Advanced Sciences', 
          color: 'text-green-600', 
          questions: [
            'How do we understand molecular biology?', 
            'What are the principles of thermodynamics?',
            'How does quantum mechanics work?',
            'What drives evolutionary processes?'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'Critical Thinking', 
          color: 'text-purple-600', 
          questions: [
            'How do we evaluate arguments?', 
            'What makes evidence convincing?',
            'How do we avoid logical fallacies?',
            'What is effective persuasion?'
          ] 
        },
        { 
          icon: History, 
          title: 'Complex Systems', 
          color: 'text-orange-600', 
          questions: [
            'How do societies evolve?', 
            'What drives economic cycles?',
            'How do political systems develop?',
            'What creates cultural change?'
          ] 
        }
      ],
      create: [
        { 
          icon: Lightbulb, 
          title: 'Research', 
          color: 'text-blue-600', 
          questions: [
            'Design an original research study', 
            'Create a policy proposal',
            'Develop a thesis argument',
            'Plan an investigative project'
          ] 
        },
        { 
          icon: Camera, 
          title: 'Digital Content', 
          color: 'text-green-600', 
          questions: [
            'Produce a professional video', 
            'Design a digital portfolio',
            'Create an interactive website',
            'Develop a mobile app prototype'
          ] 
        },
        { 
          icon: Users, 
          title: 'Social Impact', 
          color: 'text-purple-600', 
          questions: [
            'Launch a social awareness campaign', 
            'Organize a community initiative',
            'Start a student-led organization',
            'Plan a fundraising event'
          ] 
        },
        { 
          icon: Gamepad2, 
          title: 'Complex Projects', 
          color: 'text-orange-600', 
          questions: [
            'Design a business plan', 
            'Create a scientific experiment',
            'Develop a creative portfolio',
            'Build a working prototype'
          ] 
        }
      ],
      study: [
        { 
          icon: Calculator, 
          title: 'Mathematics', 
          color: 'text-blue-600', 
          questions: [
            'Calculus derivatives and integrals', 
            'Advanced algebra and functions',
            'Statistics and data analysis',
            'Discrete mathematics'
          ] 
        },
        { 
          icon: Beaker, 
          title: 'Sciences', 
          color: 'text-green-600', 
          questions: [
            'Organic chemistry mechanisms', 
            'Advanced physics concepts',
            'Molecular biology processes',
            'Environmental science'
          ] 
        },
        { 
          icon: BookOpen, 
          title: 'Humanities', 
          color: 'text-purple-600', 
          questions: [
            'Advanced literary analysis', 
            'Philosophical arguments',
            'Historical interpretation',
            'Rhetorical strategies'
          ] 
        },
        { 
          icon: Globe, 
          title: 'Social Sciences', 
          color: 'text-orange-600', 
          questions: [
            'Political theory and systems', 
            'Economic principles',
            'Psychological research methods',
            'Sociological perspectives'
          ] 
        }
      ]
    }
  };

  /**
   * Get quick topics for a specific age group and mode
   */
  getTopicsForAge(ageGroup: AgeGroup, mode: Mode): QuickTopic[] {
    return this.topicsByAge[ageGroup]?.[mode] || this.topicsByAge['8-10'][mode];
  }

  /**
   * Get all topics for a specific age group
   */
  getAllTopicsForAge(ageGroup: AgeGroup): AgeGroupTopics {
    return this.topicsByAge[ageGroup] || this.topicsByAge['8-10'];
  }

  /**
   * Get trending topics (placeholder for future implementation)
   */
  getTrendingTopics(ageGroup: AgeGroup, mode: Mode): QuickTopic[] {
    // Future implementation: fetch from API based on current trends
    return this.getTopicsForAge(ageGroup, mode).slice(0, 2);
  }

  /**
   * Get personalized topics based on user interests (placeholder)
   */
  getPersonalizedTopics(ageGroup: AgeGroup, mode: Mode, userInterests: string[]): QuickTopic[] {
    // Future implementation: filter topics based on user's previously selected interests
    const allTopics = this.getTopicsForAge(ageGroup, mode);
    
    if (userInterests.length === 0) {
      return allTopics;
    }

    // Simple filtering based on title matching interests
    return allTopics.filter(topic => 
      userInterests.some(interest => 
        topic.title.toLowerCase().includes(interest.toLowerCase()) ||
        topic.questions.some(q => q.toLowerCase().includes(interest.toLowerCase()))
      )
    );
  }

  /**
   * Get curriculum-aligned topics for study mode
   */
  getCurriculumTopics(
    ageGroup: AgeGroup, 
    board: string = 'CBSE', 
    grade: string = '8th'
  ): QuickTopic[] {
    // Future implementation: fetch curriculum-specific topics
    const studyTopics = this.getTopicsForAge(ageGroup, 'study');
    
    // For now, return the standard study topics
    // Later this can be enhanced to pull from curriculum APIs
    return studyTopics;
  }

  /**
   * Get seasonal or time-based topics
   */
  getSeasonalTopics(ageGroup: AgeGroup, mode: Mode): QuickTopic[] {
    const currentMonth = new Date().getMonth();
    const allTopics = this.getTopicsForAge(ageGroup, mode);
    
    // Simple seasonal filtering (placeholder for more sophisticated logic)
    if (currentMonth >= 11 || currentMonth <= 1) { // Winter
      return allTopics.filter(topic => 
        topic.title.toLowerCase().includes('winter') ||
        topic.questions.some(q => q.toLowerCase().includes('snow') || q.toLowerCase().includes('cold'))
      );
    }
    
    return allTopics.slice(0, 3); // Default selection
  }

  /**
   * Search topics by keyword
   */
  searchTopics(ageGroup: AgeGroup, mode: Mode, keyword: string): QuickTopic[] {
    const allTopics = this.getTopicsForAge(ageGroup, mode);
    const lowerKeyword = keyword.toLowerCase();
    
    return allTopics.filter(topic =>
      topic.title.toLowerCase().includes(lowerKeyword) ||
      topic.questions.some(q => q.toLowerCase().includes(lowerKeyword))
    );
  }
}

export const quickTopicsService = new QuickTopicsService();
export default quickTopicsService;
