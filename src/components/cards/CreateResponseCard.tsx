import React from 'react';
import CreativeCard from '../ContentCards/CreativeCard';

interface CreateResponseCardProps {
  content: string;
  originalUserInput?: string;
  inspirationPrompts?: string[];
  nextCreationIdeas?: string[];
  ageLevel?: '5-7' | '8-10' | '11-13' | '14-17';
  onInspiration: (prompt: string) => void;
  onNextCreation: (idea: string) => void;
  onRecreateSection?: (instruction: string) => void;
  onShare?: () => void;
  onRemix?: () => void;
}

const CreateResponseCard: React.FC<CreateResponseCardProps> = ({
  content,
  originalUserInput,
  onInspiration,
  onNextCreation,
  onRecreateSection
}) => {
  return (
    <CreativeCard 
      content={content}
      originalUserInput={originalUserInput}
      timestamp={new Date()}
      medium="Creative Work"
      onRecreateSection={onRecreateSection}
    />
  );
};

export default CreateResponseCard;
