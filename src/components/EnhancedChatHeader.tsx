import React, { useState } from 'react';
import { Star, Trophy, Menu, X, Plus } from 'lucide-react';
import { useThreads } from '@/contexts/ThreadContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import EnhancedThreadsSidebar from '@/components/EnhancedThreadsSidebar';

interface EnhancedChatHeaderProps {
  threadTitle?: string;
  currentMode?: 'explore' | 'learn' | 'create' | 'practice' | 'curriculum';
  isMobile?: boolean;
}

const EnhancedChatHeader: React.FC<EnhancedChatHeaderProps> = ({ 
  threadTitle,
  currentMode = 'explore',
  isMobile = false
}) => {
  const { threads, getThreadDepthLevel, createThread, setCurrentThread } = useThreads();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Find current thread to get depth level
  const currentThread = threads.find(t => t.title === threadTitle);
  const currentDepthLevel = currentThread ? getThreadDepthLevel(currentThread.id) : 0;

  const handleNewThread = () => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
  };

  if (isMobile) {
    // Mobile Layout: Duolingo-inspired green header
    return (
      <div 
        className="sticky top-0 z-50 flex-shrink-0" 
        style={{ 
          background: 'linear-gradient(135deg, #58A700 0%, #4A8B00 100%)',
          boxShadow: '0 2px 10px rgba(88, 167, 0, 0.2)'
        }}
      >
        {/* Main Header Bar with Duolingo-style design */}
        <div className="flex items-center justify-between px-4 py-4">
          {/* Left: Brand Logo with white text */}
          <div className="flex items-center">
            <span 
              className="text-2xl font-bold text-white select-none"
              style={{
                fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '24px',
                fontWeight: '800',
                letterSpacing: '-0.5px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              Plural
            </span>
          </div>

          {/* Right: Action buttons with Duolingo-style design */}
          <div className="flex items-center space-x-3">
            {/* New Chat Button - Duolingo style floating action */}
            <Button
              onClick={handleNewThread}
              className="flex items-center justify-center rounded-full active:scale-95 transition-all duration-200 shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                padding: '0'
              }}
            >
              <Plus size={20} className="text-white" style={{ color: '#FFFFFF' }} />
            </Button>

            {/* Menu Button - Duolingo style */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="rounded-full active:scale-95 transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: '44px',
                    height: '44px',
                    padding: '0'
                  }}
                >
                  <Menu size={20} className="text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 bg-white">
                <div className="h-full flex flex-col">
                  <div 
                    className="flex items-center justify-between p-4 text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #58A700 0%, #4A8B00 100%)'
                    }}
                  >
                    <span className="font-bold text-lg">Conversations</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <EnhancedThreadsSidebar hideHeader={true} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Chat Title Bar - Duolingo style with softer green */}
        {threadTitle && (
          <div 
            className="px-4 py-2 border-t"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderTopColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-center">
              <div className="font-semibold text-white truncate text-sm text-center max-w-full">
                {threadTitle}
              </div>
              {currentMode === 'learn' && currentDepthLevel > 0 && (
                <div className="flex items-center ml-2 text-xs text-white/80">
                  <Star size={12} />
                  <span className="ml-1">L{currentDepthLevel}</span>
                  <Trophy size={12} className="ml-1" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout: Centered title only
  return (
    <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200">
      {/* Center Section: Thread Title */}
      <div className="text-center max-w-md">
        <div className="font-medium text-gray-800 truncate">
          {threadTitle || 'New Chat'}
        </div>
        {threadTitle && currentMode === 'learn' && currentDepthLevel > 0 && (
          <div className="flex items-center justify-center space-x-1 text-xs text-green-600 mt-1">
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
