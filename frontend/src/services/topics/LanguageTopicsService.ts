import { BaseTopicsService, QuickTopic, AgeGroupTopics, AgeGroup, Mode } from './BaseTopicsService';
import { 
  BookOpen, 
  Feather, 
  MessageCircle, 
  Mic, 
  PenTool, 
  Users, 
  Globe,
  Volume2,
  FileText,
  Languages
} from 'lucide-react';

/**
 * Language Arts topics service providing age-appropriate reading, writing, 
 * speaking, and language skills topics
 * Enhanced with LLM-based dynamic topic generation
 */
class LanguageTopicsService extends BaseTopicsService {
  
  /**
   * Get subject name for LLM generation
   */
  getSubjectName(): string {
    return 'language';
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
   * Early Elementary (Ages 5-6) Language Topics
   */
  private getEarlyElementaryTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'lang-k2-explore-1',
          title: 'Letter Sounds',
          description: 'Learn the sounds each letter makes',
          icon: Volume2,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'phonics'
        },
        {
          id: 'lang-k2-explore-2',
          title: 'Rhyming Words',
          description: 'Find words that sound alike',
          icon: Mic,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'phonics'
        },
        {
          id: 'lang-k2-explore-3',
          title: 'Picture Stories',
          description: 'Tell stories using pictures',
          icon: BookOpen,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'storytelling'
        },
        {
          id: 'lang-k2-explore-4',
          title: 'My Family',
          description: 'Talk about family members',
          icon: Users,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'vocabulary'
        }
      ],
      learn: [
        {
          id: 'lang-k2-learn-1',
          title: 'ABC Order',
          description: 'Put letters in alphabetical order',
          icon: BookOpen,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'alphabet'
        },
        {
          id: 'lang-k2-learn-2',
          title: 'Sight Words',
          description: 'Learn common words by sight',
          icon: FileText,
          difficulty: 'beginner',
          estimatedTime: '10 min',
          category: 'reading'
        },
        {
          id: 'lang-k2-learn-3',
          title: 'Simple Sentences',
          description: 'Make sentences with words',
          icon: MessageCircle,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'grammar'
        },
        {
          id: 'lang-k2-learn-4',
          title: 'Story Beginning and End',
          description: 'Understand how stories start and finish',
          icon: BookOpen,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'comprehension'
        }
      ],
      create: [
        {
          id: 'lang-k2-create-1',
          title: 'Draw and Write',
          description: 'Draw a picture and write about it',
          icon: PenTool,
          difficulty: 'beginner',
          estimatedTime: '20 min',
          category: 'writing'
        },
        {
          id: 'lang-k2-create-2',
          title: 'Make Rhymes',
          description: 'Create your own rhyming words',
          icon: Feather,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'creativity'
        },
        {
          id: 'lang-k2-create-3',
          title: 'Story Puppet Show',
          description: 'Act out a simple story',
          icon: Users,
          difficulty: 'beginner',
          estimatedTime: '25 min',
          category: 'performance'
        }
      ],
      study: [
        {
          id: 'lang-k2-study-1',
          title: 'Letter Practice',
          description: 'Practice writing letters',
          icon: PenTool,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'handwriting'
        },
        {
          id: 'lang-k2-study-2',
          title: 'Word Families',
          description: 'Study words that end the same',
          icon: BookOpen,
          difficulty: 'beginner',
          estimatedTime: '15 min',
          category: 'phonics'
        }
      ]
    };
  }

  /**
   * Late Elementary (Ages 7-8) Language Topics
   */
  private getLateElementaryTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'lang-elem-explore-1',
          title: 'Story Characters',
          description: 'Meet different characters in stories',
          icon: Users,
          difficulty: 'intermediate',
          estimatedTime: '15 min',
          category: 'literature'
        },
        {
          id: 'lang-elem-explore-2',
          title: 'Different Types of Books',
          description: 'Explore fiction and non-fiction',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'genres'
        },
        {
          id: 'lang-elem-explore-3',
          title: 'Describing Words',
          description: 'Find words that describe things',
          icon: Feather,
          difficulty: 'intermediate',
          estimatedTime: '15 min',
          category: 'vocabulary'
        },
        {
          id: 'lang-elem-explore-4',
          title: 'Around the World Words',
          description: 'Learn words from different languages',
          icon: Globe,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'culture'
        }
      ],
      learn: [
        {
          id: 'lang-elem-learn-1',
          title: 'Reading Comprehension',
          description: 'Understand what you read',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'comprehension'
        },
        {
          id: 'lang-elem-learn-2',
          title: 'Complete Sentences',
          description: 'Learn about subjects and verbs',
          icon: MessageCircle,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'grammar'
        },
        {
          id: 'lang-elem-learn-3',
          title: 'Story Structure',
          description: 'Beginning, middle, and end of stories',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'literature'
        },
        {
          id: 'lang-elem-learn-4',
          title: 'Spelling Patterns',
          description: 'Learn common spelling rules',
          icon: PenTool,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'spelling'
        }
      ],
      create: [
        {
          id: 'lang-elem-create-1',
          title: 'Write a Short Story',
          description: 'Create your own adventure story',
          icon: Feather,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'creative writing'
        },
        {
          id: 'lang-elem-create-2',
          title: 'Make a Comic Strip',
          description: 'Tell a story with pictures and words',
          icon: PenTool,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'visual storytelling'
        },
        {
          id: 'lang-elem-create-3',
          title: 'Poetry Corner',
          description: 'Write simple poems',
          icon: Feather,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'poetry'
        }
      ],
      study: [
        {
          id: 'lang-elem-study-1',
          title: 'Vocabulary Building',
          description: 'Learn new words every day',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '15 min',
          category: 'vocabulary'
        },
        {
          id: 'lang-elem-study-2',
          title: 'Reading Fluency',
          description: 'Practice reading smoothly',
          icon: Volume2,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'fluency'
        }
      ]
    };
  }

  /**
   * Middle Grade (Ages 9-10) Language Topics
   */
  private getMiddleGradeTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'lang-middle-explore-1',
          title: 'Author\'s Purpose',
          description: 'Why did the author write this?',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '20 min',
          category: 'analysis'
        },
        {
          id: 'lang-middle-explore-2',
          title: 'Word Origins',
          description: 'Where do words come from?',
          icon: Languages,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'etymology'
        },
        {
          id: 'lang-middle-explore-3',
          title: 'Different Cultures Stories',
          description: 'Stories from around the world',
          icon: Globe,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'multicultural'
        },
        {
          id: 'lang-middle-explore-4',
          title: 'How Language Changes',
          description: 'See how language evolves over time',
          icon: Languages,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'linguistics'
        }
      ],
      learn: [
        {
          id: 'lang-middle-learn-1',
          title: 'Paragraph Writing',
          description: 'Structure your ideas clearly',
          icon: FileText,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'writing structure'
        },
        {
          id: 'lang-middle-learn-2',
          title: 'Literary Devices',
          description: 'Metaphors, similes, and more',
          icon: Feather,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'literary analysis'
        },
        {
          id: 'lang-middle-learn-3',
          title: 'Research Skills',
          description: 'Find and use reliable information',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '35 min',
          category: 'research'
        },
        {
          id: 'lang-middle-learn-4',
          title: 'Presentation Skills',
          description: 'Share your ideas with confidence',
          icon: Mic,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'speaking'
        }
      ],
      create: [
        {
          id: 'lang-middle-create-1',
          title: 'Write a Report',
          description: 'Research and write about a topic',
          icon: FileText,
          difficulty: 'intermediate',
          estimatedTime: '45 min',
          category: 'informational writing'
        },
        {
          id: 'lang-middle-create-2',
          title: 'Create a Newspaper',
          description: 'Make your own news publication',
          icon: FileText,
          difficulty: 'intermediate',
          estimatedTime: '40 min',
          category: 'journalism'
        },
        {
          id: 'lang-middle-create-3',
          title: 'Write a Play',
          description: 'Create a script for actors',
          icon: Users,
          difficulty: 'intermediate',
          estimatedTime: '35 min',
          category: 'drama'
        }
      ],
      study: [
        {
          id: 'lang-middle-study-1',
          title: 'Grammar Rules',
          description: 'Master punctuation and sentence structure',
          icon: MessageCircle,
          difficulty: 'intermediate',
          estimatedTime: '25 min',
          category: 'grammar'
        },
        {
          id: 'lang-middle-study-2',
          title: 'Reading Strategies',
          description: 'Tools for understanding difficult texts',
          icon: BookOpen,
          difficulty: 'intermediate',
          estimatedTime: '30 min',
          category: 'comprehension'
        }
      ]
    };
  }

  /**
   * Middle School (Ages 11-13) Language Topics
   */
  private getMiddleSchoolTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'lang-ms-explore-1',
          title: 'Literary Genres',
          description: 'Explore mystery, fantasy, sci-fi, and more',
          icon: BookOpen,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'literature'
        },
        {
          id: 'lang-ms-explore-2',
          title: 'Language and Identity',
          description: 'How language shapes who we are',
          icon: Users,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'sociolinguistics'
        },
        {
          id: 'lang-ms-explore-3',
          title: 'Media Analysis',
          description: 'Understand how media influences us',
          icon: Globe,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'media literacy'
        },
        {
          id: 'lang-ms-explore-4',
          title: 'Historical Language',
          description: 'How people spoke in different time periods',
          icon: Languages,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'historical linguistics'
        }
      ],
      learn: [
        {
          id: 'lang-ms-learn-1',
          title: 'Essay Writing',
          description: 'Structure arguments and evidence',
          icon: FileText,
          difficulty: 'advanced',
          estimatedTime: '40 min',
          category: 'argumentative writing'
        },
        {
          id: 'lang-ms-learn-2',
          title: 'Character Analysis',
          description: 'Understand complex characters in literature',
          icon: Users,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'literary analysis'
        },
        {
          id: 'lang-ms-learn-3',
          title: 'Debate Skills',
          description: 'Present and defend your arguments',
          icon: MessageCircle,
          difficulty: 'advanced',
          estimatedTime: '40 min',
          category: 'rhetoric'
        },
        {
          id: 'lang-ms-learn-4',
          title: 'Research Methods',
          description: 'Advanced techniques for finding information',
          icon: BookOpen,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'research'
        }
      ],
      create: [
        {
          id: 'lang-ms-create-1',
          title: 'Write a Novel Chapter',
          description: 'Create compelling fiction',
          icon: Feather,
          difficulty: 'advanced',
          estimatedTime: '50 min',
          category: 'creative writing'
        },
        {
          id: 'lang-ms-create-2',
          title: 'Create a Podcast',
          description: 'Plan and record your own show',
          icon: Mic,
          difficulty: 'advanced',
          estimatedTime: '45 min',
          category: 'digital media'
        },
        {
          id: 'lang-ms-create-3',
          title: 'Write Poetry Collection',
          description: 'Explore different poetic forms',
          icon: Feather,
          difficulty: 'advanced',
          estimatedTime: '40 min',
          category: 'poetry'
        }
      ],
      study: [
        {
          id: 'lang-ms-study-1',
          title: 'Advanced Grammar',
          description: 'Complex sentence structures and usage',
          icon: MessageCircle,
          difficulty: 'advanced',
          estimatedTime: '30 min',
          category: 'grammar'
        },
        {
          id: 'lang-ms-study-2',
          title: 'Literary Analysis Skills',
          description: 'Tools for interpreting literature',
          icon: BookOpen,
          difficulty: 'advanced',
          estimatedTime: '35 min',
          category: 'analysis'
        }
      ]
    };
  }

  /**
   * High School (Ages 14-17) Language Topics
   */
  private getHighSchoolTopics(): AgeGroupTopics {
    return {
      explore: [
        {
          id: 'lang-hs-explore-1',
          title: 'World Literature',
          description: 'Great works from different cultures',
          icon: Globe,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'world literature'
        },
        {
          id: 'lang-hs-explore-2',
          title: 'Language Philosophy',
          description: 'How language shapes thought',
          icon: Languages,
          difficulty: 'expert',
          estimatedTime: '40 min',
          category: 'philosophy of language'
        },
        {
          id: 'lang-hs-explore-3',
          title: 'Digital Communication',
          description: 'How technology changes language',
          icon: Globe,
          difficulty: 'expert',
          estimatedTime: '35 min',
          category: 'digital literacy'
        },
        {
          id: 'lang-hs-explore-4',
          title: 'Literary Movements',
          description: 'Romanticism, Modernism, and beyond',
          icon: BookOpen,
          difficulty: 'expert',
          estimatedTime: '50 min',
          category: 'literary history'
        }
      ],
      learn: [
        {
          id: 'lang-hs-learn-1',
          title: 'College Essay Writing',
          description: 'Craft compelling personal statements',
          icon: FileText,
          difficulty: 'expert',
          estimatedTime: '60 min',
          category: 'academic writing'
        },
        {
          id: 'lang-hs-learn-2',
          title: 'Critical Theory',
          description: 'Advanced approaches to literature',
          icon: BookOpen,
          difficulty: 'expert',
          estimatedTime: '50 min',
          category: 'literary theory'
        },
        {
          id: 'lang-hs-learn-3',
          title: 'Public Speaking',
          description: 'Advanced presentation and rhetoric',
          icon: Mic,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'rhetoric'
        },
        {
          id: 'lang-hs-learn-4',
          title: 'Research Paper Writing',
          description: 'Academic research and documentation',
          icon: FileText,
          difficulty: 'expert',
          estimatedTime: '55 min',
          category: 'academic writing'
        }
      ],
      create: [
        {
          id: 'lang-hs-create-1',
          title: 'Write a Screenplay',
          description: 'Create scripts for film or stage',
          icon: FileText,
          difficulty: 'expert',
          estimatedTime: '60 min',
          category: 'screenwriting'
        },
        {
          id: 'lang-hs-create-2',
          title: 'Literary Magazine',
          description: 'Curate and publish student work',
          icon: BookOpen,
          difficulty: 'expert',
          estimatedTime: '55 min',
          category: 'publishing'
        },
        {
          id: 'lang-hs-create-3',
          title: 'Multimedia Presentation',
          description: 'Combine text, audio, and visuals',
          icon: Globe,
          difficulty: 'expert',
          estimatedTime: '50 min',
          category: 'digital composition'
        }
      ],
      study: [
        {
          id: 'lang-hs-study-1',
          title: 'AP Literature Prep',
          description: 'Advanced placement exam preparation',
          icon: BookOpen,
          difficulty: 'expert',
          estimatedTime: '45 min',
          category: 'test prep'
        },
        {
          id: 'lang-hs-study-2',
          title: 'SAT Writing Skills',
          description: 'Standardized test writing strategies',
          icon: FileText,
          difficulty: 'expert',
          estimatedTime: '40 min',
          category: 'test prep'
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
    
    // Context-based suggestions for language arts
    if (topic.toLowerCase().includes('write') || topic.toLowerCase().includes('story')) {
      suggestions.push(
        ...allTopics.create.filter(t => 
          t.category.includes('writing') || t.category.includes('creative')
        ).slice(0, 2)
      );
    }
    
    if (topic.toLowerCase().includes('read') || topic.toLowerCase().includes('book')) {
      suggestions.push(
        ...allTopics.learn.filter(t => 
          t.category.includes('reading') || t.category.includes('literature')
        ).slice(0, 2)
      );
    }
    
    if (topic.toLowerCase().includes('speak') || topic.toLowerCase().includes('present')) {
      suggestions.push(
        ...allTopics.learn.filter(t => 
          t.category.includes('speaking') || t.category.includes('presentation')
        ).slice(0, 2)
      );
    }
    
    // Fill remaining slots with explore topics
    while (suggestions.length < 4 && allTopics.explore.length > 0) {
      const randomTopic = allTopics.explore[Math.floor(Math.random() * allTopics.explore.length)];
      if (!suggestions.find(s => s.id === randomTopic.id)) {
        suggestions.push(randomTopic);
      }
    }
    
    return suggestions.slice(0, 4);
  }
}

// Export singleton instance
export const languageTopicsService = new LanguageTopicsService();
