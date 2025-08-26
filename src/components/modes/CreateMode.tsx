import React, { useState } from 'react';
import { Wand2, PenTool, FileText, MessageSquare, Scroll, BookOpen, Users, Lightbulb } from 'lucide-react';
import { type AgeGroup } from '@/services/QuickTopicsService';

interface CreateModeProps {
  onStartCreation: (prompt: string, medium: string, mode: string) => void;
  ageGroup: string;
  userId?: string;
  isMobile?: boolean;
}

const CreateMode: React.FC<CreateModeProps> = ({ onStartCreation, ageGroup, userId, isMobile = false }) => {
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);

  const quickTopics = [
    {
      id: 'short-stories',
      name: 'Short Stories',
      icon: BookOpen,
      color: '#FF2D92',
      description: 'Craft compelling narratives with strong characters',
      prompts: [
        'Help me develop a character for my story',
        'I want to improve my story structure',
        'Guide me through creating plot tension',
        'Help me write better dialogue'
      ]
    },
    {
      id: 'poetry',
      name: 'Poetry',
      icon: PenTool,
      color: '#5856D6',
      description: 'Express emotions through rhythm and verse',
      prompts: [
        'Help me write a poem about nature',
        'I want to experiment with different poetry forms',
        'Guide me through creating imagery',
        'Help me improve my rhyme and meter'
      ]
    },
    {
      id: 'essays',
      name: 'Essays',
      icon: FileText,
      color: '#30B0C7',
      description: 'Develop clear arguments and persuasive writing',
      prompts: [
        'Help me structure my persuasive essay',
        'I want to strengthen my arguments',
        'Guide me through research and evidence',
        'Help me improve my thesis statement'
      ]
    },
    {
      id: 'logical-arguments',
      name: 'Logical Arguments',
      icon: Lightbulb,
      color: '#32D74B',
      description: 'Build reasoning and critical thinking skills',
      prompts: [
        'Help me construct a logical argument',
        'I want to identify logical fallacies',
        'Guide me through evidence evaluation',
        'Help me strengthen my reasoning'
      ]
    },
    {
      id: 'debate',
      name: 'Debate',
      icon: MessageSquare,
      color: '#FF6B35',
      description: 'Practice argumentation with AI opponents',
      prompts: [
        'Challenge my position on climate change',
        'Debate me about school uniforms',
        'Test my arguments about technology',
        'Help me prepare for a debate tournament'
      ]
    },
    {
      id: 'interactive-stories',
      name: 'Interactive Stories',
      icon: Users,
      color: '#8E8E93',
      description: 'Create branching narratives with choices',
      prompts: [
        'Help me design story branches',
        'I want to create meaningful choices',
        'Guide me through interactive plotting',
        'Help me balance story paths'
      ]
    },
    {
      id: 'screenplays',
      name: 'Screenplays',
      icon: Scroll,
      color: '#FF3B30',
      description: 'Write scripts for visual storytelling',
      prompts: [
        'Help me format a screenplay properly',
        'I want to improve my scene descriptions',
        'Guide me through character dialogue',
        'Help me structure my three-act script'
      ]
    }
  ];

  const handleTopicSelect = (topic: typeof quickTopics[0]) => {
    setSelectedMedium(topic.id);
  };

  const handlePromptSelect = (prompt: string, topicId: string) => {
    onStartCreation(prompt, topicId, 'creative-guidance');
  };

  if (selectedMedium) {
    const topic = quickTopics.find(t => t.id === selectedMedium);
    if (!topic) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <topic.icon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} style={{ color: topic.color }} />
            <div>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{topic.name}</h2>
              {!isMobile && <p className="text-sm text-gray-600">{topic.description}</p>}
            </div>
          </div>
          <button
            onClick={() => setSelectedMedium(null)}
            className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 hover:text-gray-700 font-medium`}
          >
            ← Back
          </button>
        </div>

        <div className="grid gap-3">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-2`}>How can I help you create?</h3>
          {topic.prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptSelect(prompt, topic.id)}
              className={`${isMobile ? 'p-3' : 'p-4'} text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group`}
            >
              <div className="flex items-start space-x-3">
                <Wand2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mt-0.5 text-gray-400 group-hover:text-gray-600`} />
                <span className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-800 group-hover:text-gray-900`}>{prompt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-end h-full max-w-2xl mx-auto px-4 pb-4">
      {/* Clean suggestion card */}
      <div 
        className="w-full rounded-xl"
        style={{
          background: 'white',
          border: '1px solid #E5E5EA',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: isMobile ? '12px' : '16px'
        }}
      >
        <div className="text-center space-y-2 mb-4">
          <div className="flex items-center justify-center space-x-2">
            <Wand2 size={16} className="text-green-600" />
            <h2 
              className="font-medium"
              style={{ 
                fontSize: isMobile ? '15px' : '15px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                color: '#000000'
              }}
            >
              Create
            </h2>
          </div>
          {!isMobile && (
            <p 
              className="text-gray-600"
              style={{
                fontSize: '13px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
              }}
            >
              Choose what you'd like to create and get step-by-step guidance
            </p>
          )}
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-3 gap-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
          {quickTopics.slice(0, isMobile ? 6 : quickTopics.length).map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicSelect(topic)}
              className={`${isMobile ? 'p-1.5' : 'p-4'} rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group text-center space-y-3`}
            >
              <topic.icon 
                className={`${isMobile ? 'w-4 h-4' : 'w-8 h-8'} mx-auto group-hover:scale-110 transition-transform`} 
                style={{ color: topic.color }} 
              />
              <div>
                <h3 
                  className="group-hover:text-gray-700"
                  style={{
                    fontSize: isMobile ? '11px' : '14px',
                    fontWeight: '500',
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                  }}
                >
                  {topic.name}
                </h3>
                {!isMobile && (
                  <p 
                    className="mt-1"
                    style={{
                      fontSize: '11px',
                      color: '#8E8E93',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                    }}
                  >
                    {topic.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {!isMobile && (
          <div 
            className="text-center mt-4"
            style={{
              fontSize: '12px',
              color: '#8E8E93',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}
          >
            💡 I'll provide structured feedback with quality scoring and guide you step-by-step through the creative process
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMode;
