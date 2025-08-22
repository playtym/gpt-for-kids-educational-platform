import React from 'react';
import { Star, Trophy } from 'lucide-react';
import { useThreads } from '@/contexts/ThreadContext';

interface EnhancedChatHeaderProps {
  threadTitle?: string;
  currentMode?: 'explore' | 'learn' | 'create' | 'practice' | 'curriculum';
}

const EnhancedChatHeader: React.FC<EnhancedChatHeaderProps> = ({ 
  threadTitle,
  currentMode = 'explore'
}) => {
  const { threads, getThreadDepthLevel } = useThreads();
  
  // Find current thread to get depth level
  const currentThread = threads.find(t => t.title === threadTitle);
  const currentDepthLevel = currentThread ? getThreadDepthLevel(currentThread.id) : 0;

  return (
    <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200">
      {/* Center Section: Thread Title */}
      <div className="text-center max-w-md">
        <div className="font-medium text-gray-800 truncate">
          {threadTitle || 'New Chat'}
        </div>
        {threadTitle && currentMode === 'learn' && currentDepthLevel > 0 && (
          <div className="flex items-center justify-center space-x-1 text-xs text-yellow-600 mt-1">
            <Star size={10} />
            <span>Depth Level {currentDepthLevel}</span>
            <Trophy size={10} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatHeader;
