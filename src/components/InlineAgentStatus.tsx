import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface AgentStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  duration: number;
}

// Define mode-specific agent steps
const EXPLORE_STEPS: AgentStep[] = [
  {
    id: 'analyzing',
    title: 'Brain Wizard analyzing your question',
    subtitle: 'Understanding context and learning objectives...',
    icon: '🧠',
    duration: 1500
  },
  {
    id: 'planning',
    title: 'Learning Architect planning your journey',
    subtitle: 'Designing the perfect learning experience...',
    icon: '🎯',
    duration: 1200
  },
  {
    id: 'content',
    title: 'Content Alchemist crafting your response',
    subtitle: 'Creating engaging, age-appropriate content...',
    icon: '✨',
    duration: 1800
  },
  {
    id: 'enriching',
    title: 'Knowledge Weaver adding rich context',
    subtitle: 'Connecting concepts and adding examples...',
    icon: '🌟',
    duration: 1500
  },
  {
    id: 'images',
    title: 'Vision Artist finding perfect visuals',
    subtitle: 'Searching for educational images and diagrams...',
    icon: '🎨',
    duration: 1200
  },
  {
    id: 'safety',
    title: 'Guardian Angel ensuring kid-safe content',
    subtitle: 'Final safety check and content approval...',
    icon: '🛡️',
    duration: 1000
  }
];

const LEARN_STEPS: AgentStep[] = [
  {
    id: 'analyzing',
    title: 'Socratic Sage understanding your curiosity',
    subtitle: 'Analyzing your question and learning style...',
    icon: '🤔',
    duration: 1500
  },
  {
    id: 'planning',
    title: 'Learning Path Designer crafting your journey',
    subtitle: 'Creating personalized learning sequences...',
    icon: '🗺️',
    duration: 1800
  },
  {
    id: 'content',
    title: 'Wisdom Weaver preparing insights',
    subtitle: 'Gathering knowledge and examples...',
    icon: '📚',
    duration: 2000
  },
  {
    id: 'engagement',
    title: 'Question Master designing interactions',
    subtitle: 'Preparing thought-provoking questions...',
    icon: '❓',
    duration: 1500
  },
  {
    id: 'safety',
    title: 'Learning Guardian ensuring quality',
    subtitle: 'Verifying educational value and safety...',
    icon: '🛡️',
    duration: 1000
  }
];

const CREATE_STEPS: AgentStep[] = [
  {
    id: 'analyzing',
    title: 'Creative Muse reading your work',
    subtitle: 'Understanding your creative vision...',
    icon: '🎭',
    duration: 1500
  },
  {
    id: 'evaluating',
    title: 'Quality Inspector assessing strengths',
    subtitle: 'Identifying what shines in your creation...',
    icon: '⭐',
    duration: 1800
  },
  {
    id: 'scoring',
    title: 'Excellence Meter calculating quality',
    subtitle: 'Determining your creative achievement score...',
    icon: '📊',
    duration: 1200
  },
  {
    id: 'crafting',
    title: 'Feedback Artisan preparing guidance',
    subtitle: 'Creating encouraging, constructive feedback...',
    icon: '✍️',
    duration: 2000
  },
  {
    id: 'inspiring',
    title: 'Growth Catalyst finding opportunities',
    subtitle: 'Discovering your next creative steps...',
    icon: '🚀',
    duration: 1500
  },
  {
    id: 'safety',
    title: 'Creative Guardian ensuring positivity',
    subtitle: 'Final encouragement and safety check...',
    icon: '💚',
    duration: 1000
  }
];

const CURRICULUM_STEPS: AgentStep[] = [
  {
    id: 'analyzing',
    title: 'Curriculum Expert analyzing requirements',
    subtitle: 'Understanding academic standards and goals...',
    icon: '📋',
    duration: 1500
  },
  {
    id: 'planning',
    title: 'Academic Architect structuring content',
    subtitle: 'Organizing curriculum-aligned materials...',
    icon: '🏗️',
    duration: 1800
  },
  {
    id: 'content',
    title: 'Knowledge Builder creating lessons',
    subtitle: 'Developing comprehensive learning content...',
    icon: '📖',
    duration: 2000
  },
  {
    id: 'assessment',
    title: 'Progress Tracker adding evaluations',
    subtitle: 'Including assessments and milestones...',
    icon: '📈',
    duration: 1500
  },
  {
    id: 'safety',
    title: 'Academic Guardian ensuring quality',
    subtitle: 'Verifying educational standards compliance...',
    icon: '🎓',
    duration: 1000
  }
];

const MODE_STEPS = {
  explore: EXPLORE_STEPS,
  learn: LEARN_STEPS,
  create: CREATE_STEPS,
  curriculum: CURRICULUM_STEPS
};

interface InlineAgentStatusProps {
  isVisible: boolean;
  mode?: 'explore' | 'learn' | 'create' | 'curriculum';
  onComplete?: () => void;
  className?: string;
}

const InlineAgentStatus: React.FC<InlineAgentStatusProps> = ({ 
  isVisible, 
  mode = 'explore',
  onComplete,
  className = ""
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Get the steps for the current mode
  const agentSteps = MODE_STEPS[mode];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setIsCompleted(false);
      return;
    }

    const processSteps = async () => {
      for (let i = 0; i < agentSteps.length; i++) {
        setCurrentStepIndex(i);
        await new Promise(resolve => setTimeout(resolve, agentSteps[i].duration));
      }
      
      setIsCompleted(true);
      setTimeout(() => {
        onComplete?.();
      }, 800);
    };

    processSteps();
  }, [isVisible, onComplete, agentSteps]);

  if (!isVisible) return null;

  const currentStep = agentSteps[currentStepIndex];

  // Mode-specific completion messages
  const completionMessages = {
    explore: {
      title: '✨ Exploration team completed successfully!',
      subtitle: 'Your magical learning adventure is ready'
    },
    learn: {
      title: '📚 Learning architects finished crafting!',
      subtitle: 'Your personalized learning journey awaits'
    },
    create: {
      title: '🎨 Creative feedback team is done!',
      subtitle: 'Your inspiring feedback and score are ready'
    },
    curriculum: {
      title: '🎓 Curriculum experts have assembled!',
      subtitle: 'Your comprehensive learning plan is complete'
    }
  };

  const completion = completionMessages[mode];

  return (
    <div className={`flex items-center space-x-3 py-3 px-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-purple-200 rounded-lg ${className}`}>
      {isCompleted ? (
        <>
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-800">
              {completion.title}
            </div>
            <div className="text-xs text-green-600">
              {completion.subtitle}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="relative flex-shrink-0">
            <span className="text-lg animate-bounce">{currentStep.icon}</span>
            <div className="absolute -top-1 -right-1">
              <Sparkles size={12} className="text-purple-500 animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-purple-800 truncate">
              {currentStep.title}
            </div>
            <div className="text-xs text-purple-600 opacity-80">
              {currentStep.subtitle}
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InlineAgentStatus;
