import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface AgentStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  duration: number;
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: 'analyzing',
    title: 'Brain Wizard analyzing your question',
    subtitle: 'Understanding context and learning objectives...',
    icon: '🧠',
    duration: 1200
  },
  {
    id: 'planning',
    title: 'Learning Architect planning your journey',
    subtitle: 'Designing the perfect learning experience...',
    icon: '🎯',
    duration: 1000
  },
  {
    id: 'content',
    title: 'Content Alchemist crafting your response',
    subtitle: 'Creating engaging, age-appropriate content...',
    icon: '✨',
    duration: 1500
  },
  {
    id: 'enriching',
    title: 'Knowledge Weaver adding rich context',
    subtitle: 'Connecting concepts and adding examples...',
    icon: '🌟',
    duration: 1200
  },
  {
    id: 'images',
    title: 'Vision Artist finding perfect visuals',
    subtitle: 'Searching for educational images and diagrams...',
    icon: '🎨',
    duration: 1000
  },
  {
    id: 'safety',
    title: 'Guardian Angel ensuring kid-safe content',
    subtitle: 'Final safety check and content approval...',
    icon: '🛡️',
    duration: 800
  }
];

interface InlineAgentStatusProps {
  isVisible: boolean;
  onComplete?: () => void;
  className?: string;
}

const InlineAgentStatus: React.FC<InlineAgentStatusProps> = ({ 
  isVisible, 
  onComplete,
  className = ""
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setIsCompleted(false);
      return;
    }

    const processSteps = async () => {
      for (let i = 0; i < AGENT_STEPS.length; i++) {
        setCurrentStepIndex(i);
        await new Promise(resolve => setTimeout(resolve, AGENT_STEPS[i].duration));
      }
      
      setIsCompleted(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    };

    processSteps();
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const currentStep = AGENT_STEPS[currentStepIndex];

  return (
    <div className={`flex items-center space-x-3 py-3 px-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-purple-200 rounded-lg ${className}`}>
      {isCompleted ? (
        <>
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-800">
              ✨ All agents completed successfully!
            </div>
            <div className="text-xs text-green-600">
              Your magical learning experience is ready
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
