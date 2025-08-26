import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreads } from '@/contexts/ThreadContext';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, MessageCircle, Trash2, BookOpen, Search, Palette, Zap, GraduationCap, Star, Trophy, CheckSquare, Square, User, Settings } from 'lucide-react';
import { brandColors, tailwindClasses } from '@/styles/brandGuidelines';

const modeIcons = {
  'learn': BookOpen,
  'explore': Search,
  'create': Palette,
  'practice': Zap,
  'curriculum': GraduationCap,
  'default': MessageCircle
};

const modeColors = {
  'learn': 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
  'explore': 'bg-apple-green/10 text-apple-green border-apple-green/20',
  'create': 'bg-apple-purple/10 text-apple-purple border-apple-purple/20',
  'practice': 'bg-apple-orange/10 text-apple-orange border-apple-orange/20',
  'curriculum': 'bg-apple-indigo/10 text-apple-indigo border-apple-indigo/20',
  'default': 'bg-apple-gray-200 text-apple-gray-700 border-apple-gray-300'
};

interface ThreadDeleteDialogProps {
  threadIds: string[];
  threadTitles: string[];
  onDelete: (threadIds: string[]) => void;
  children: React.ReactNode;
}

const ThreadDeleteDialog: React.FC<ThreadDeleteDialogProps> = ({ threadIds, threadTitles, onDelete, children }) => {
  const isMultiple = threadIds.length > 1;
  const displayTitle = isMultiple 
    ? `${threadIds.length} conversations` 
    : threadTitles[0] || 'this conversation';
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">
            Delete {isMultiple ? 'Conversations' : 'Chat Thread'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            <span>Are you sure you want to delete <strong className="text-gray-900">{displayTitle}</strong>? 
            This action cannot be undone and all conversation history will be lost.</span>
            {isMultiple && (
              <div className="mt-2 text-sm">
                <span className="font-medium block">Conversations to be deleted:</span>
                <div className="mt-1 max-h-32 overflow-y-auto">
                  {threadTitles.map((title, index) => (
                    <div key={index} className="truncate">• {title}</div>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={tailwindClasses.secondaryButton}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onDelete(threadIds)}
            className={tailwindClasses.dangerButton}
          >
            Delete {isMultiple ? 'All' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface DepthBadgeProps {
  threadId: string;
  mode: string;
}

const DepthBadge: React.FC<DepthBadgeProps> = ({ threadId, mode }) => {
  const { getThreadDepthLevel, threads } = useThreads();
  
  if (mode !== 'learn') return null;
  
  const depthLevel = getThreadDepthLevel(threadId);
  const thread = threads.find(t => t.id === threadId);
  const completedPaths = thread?.learnModeData?.completedPaths || 0;
  
  if (depthLevel === 0 && completedPaths === 0) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-apple-yellow/10 text-apple-yellow border-apple-yellow/20 ml-2">
            <Star size={10} className="mr-1" />
            Level {depthLevel}
            {depthLevel > 0 && <Trophy size={10} className="ml-1" />}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-semibold">Learning Depth</div>
            <div>Certified Level: {depthLevel}</div>
            <div>Paths Completed: {completedPaths}</div>
            {depthLevel > 0 && <div className="text-apple-yellow mt-1">🏆 Earned by scoring 80%+ on quizzes</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface EnhancedThreadsSidebarProps {
  hideHeader?: boolean;
}

const EnhancedThreadsSidebar: React.FC<EnhancedThreadsSidebarProps> = ({ hideHeader = false }) => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const { threads, currentThreadId, createThread, setCurrentThread, deleteThread, getThreadDepthLevel } = useThreads();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const handleNewThread = () => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
    // Exit multi-select mode when creating new thread
    setIsMultiSelectMode(false);
    setSelectedThreads(new Set());
  };

  const handleSelectThread = (threadId: string) => {
    if (isMultiSelectMode) {
      const newSelected = new Set(selectedThreads);
      if (newSelected.has(threadId)) {
        newSelected.delete(threadId);
      } else {
        newSelected.add(threadId);
      }
      setSelectedThreads(newSelected);
    } else {
      setCurrentThread(threadId);
      navigate(`/dashboard?thread=${threadId}`);
    }
  };

  const handleDeleteThreads = (threadIds: string[]) => {
    threadIds.forEach(threadId => {
      setDeletingId(threadId);
      deleteThread(threadId);
      if (currentThreadId === threadId) {
        navigate('/dashboard');
      }
    });
    
    // Clear selection and exit multi-select mode
    setSelectedThreads(new Set());
    setIsMultiSelectMode(false);
    
    setTimeout(() => setDeletingId(null), 300);
  };

  const handleDeleteSingleThread = (threadId: string) => {
    handleDeleteThreads([threadId]);
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedThreads(new Set());
  };

  const selectAllThreads = () => {
    const allThreadIds = new Set(threads.map(thread => thread.id));
    setSelectedThreads(allThreadIds);
  };

  const clearSelection = () => {
    setSelectedThreads(new Set());
  };

  const getModeInfo = (thread: any) => {
    const mode = thread.lastMode || 'default';
    const Icon = modeIcons[mode as keyof typeof modeIcons] || modeIcons.default;
    const colorClass = modeColors[mode as keyof typeof modeColors] || modeColors.default;
    
    return { mode, Icon, colorClass };
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Clean Header */}
      {!hideHeader && (
        <div 
          className="p-4"
          style={{ 
            borderBottom: '1px solid #E5E5EA',
            background: '#FFFFFF'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="font-medium"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontSize: '15px',
                fontWeight: '600',
                color: '#3C3C43'
              }}
            >
              Conversations
            </h2>
            
            {threads.length > 0 && (
              <button
                onClick={toggleMultiSelectMode}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isMultiSelectMode 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMultiSelectMode ? "Exit multi-select" : "Select multiple"}
              >
                {isMultiSelectMode ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            )}
          </div>

          {/* Multi-select controls */}
          {isMultiSelectMode && threads.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedThreads.size} of {threads.length} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllThreads}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {selectedThreads.size > 0 && (
                <ThreadDeleteDialog
                  threadIds={Array.from(selectedThreads)}
                  threadTitles={threads
                    .filter(t => selectedThreads.has(t.id))
                    .map(t => t.title)
                  }
                  onDelete={handleDeleteThreads}
                >
                  <button
                    className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete Selected ({selectedThreads.size})
                  </button>
                </ThreadDeleteDialog>
              )}
            </div>
          )}
          
          {/* Duolingo-style New Thread Button */}
          <button
            onClick={handleNewThread}
            className="w-full flex items-center justify-center px-4 py-3 rounded-2xl font-bold transition-all duration-200"
            style={{
              background: brandColors.primary.green,
              color: 'white',
              border: 'none',
              fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '15px',
              fontWeight: '700'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = brandColors.primary.greenHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = brandColors.primary.green;
            }}
          >
            <Plus size={18} className="mr-2" />
            New Conversation
          </button>
        </div>
      )}
      
      {/* Threads List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-4 space-y-2">
            {threads.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle size={32} className="mx-auto mb-3" style={{ color: '#AFAFAF' }} />
                <p 
                  className="font-semibold mb-1"
                  style={{ 
                    color: '#3C3C43',
                    fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  No conversations yet
                </p>
                <p 
                  style={{ 
                    color: '#AFAFAF',
                    fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '13px'
                  }}
                >
                  Start a new conversation to begin learning
                </p>
              </div>
            ) : (
              threads.slice(0, 20).map(thread => {
                const { mode, Icon, colorClass } = getModeInfo(thread);
                const isDeleting = deletingId === thread.id;
                const isActive = currentThreadId === thread.id;
                const isSelected = selectedThreads.has(thread.id);
                
                return (
                  <div
                    key={thread.id}
                    className={`group transition-all duration-200 rounded-xl p-3 cursor-pointer mx-3 mb-2 relative ${
                      isDeleting ? 'opacity-50 scale-95' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? brandColors.primary.green : (isSelected ? '#E8F5E8' : '#FFFFFF'),
                      border: `1px solid ${isActive ? brandColors.primary.green : (isSelected ? brandColors.primary.green : '#E5E5EA')}`,
                      boxShadow: isActive ? `0 2px 8px rgba(88, 167, 0, 0.2)` : '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && !isSelected) {
                        e.currentTarget.style.background = '#F7F7F7';
                        e.currentTarget.style.borderColor = '#D1D1D6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && !isSelected) {
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E5E5EA';
                      }
                    }}
                  >
                    {/* Multi-select checkbox */}
                    {isMultiSelectMode && (
                      <div 
                        className="absolute top-3 left-3 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectThread(thread.id);
                        }}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-green-600 border-green-600' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => handleSelectThread(thread.id)}
                      className={`flex items-start justify-between w-full ${isMultiSelectMode ? 'ml-8' : ''}`}
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          <Icon 
                            size={16} 
                            className={`transition-colors duration-200 ${
                              isActive ? 'text-white' : (isSelected ? 'text-green-700' : 'text-gray-600')
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 
                              className={`truncate font-semibold ${
                                isActive ? 'text-white' : (isSelected ? 'text-green-900' : 'text-gray-900')
                              }`}
                              style={{ 
                                fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                            >
                              {thread.title}
                            </h3>
                            <DepthBadge threadId={thread.id} mode={mode} />
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-1">
                            <div 
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                isActive 
                                  ? 'bg-white bg-opacity-20 text-white' 
                                  : isSelected 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                              style={{
                                fontFamily: '"feather", sans-serif'
                              }}
                            >
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </div>
                            <span 
                              className={`text-xs ${
                                isActive 
                                  ? 'text-white text-opacity-80' 
                                  : isSelected 
                                    ? 'text-green-700'
                                    : 'text-gray-500'
                              }`}
                              style={{ 
                                fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif'
                              }}
                            >
                              {thread.totalMessages} messages
                            </span>
                          </div>
                          
                          {thread.subjects.length > 0 && (
                            <div 
                              className={`text-xs truncate ${
                                isActive 
                                  ? 'text-white text-opacity-70' 
                                  : isSelected 
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                              }`}
                              style={{ 
                                fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif'
                              }}
                            >
                              📚 {thread.subjects.slice(0, 2).join(', ')}
                              {thread.subjects.length > 2 && ` +${thread.subjects.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Single delete button (only show when not in multi-select mode) */}
                      {!isMultiSelectMode && (
                        <ThreadDeleteDialog
                          threadIds={[thread.id]}
                          threadTitles={[thread.title]}
                          onDelete={handleDeleteThreads}
                        >
                          <button
                            className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                            style={{
                              background: '#FF3B30',
                              color: 'white'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#D70015';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FF3B30';
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </ThreadDeleteDialog>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* User Profile Section */}
        {currentUser && (
          <div 
            className="p-3 mx-3 mb-3 rounded-xl border"
            style={{
              backgroundColor: '#F7F7F7',
              borderColor: '#E5E5EA'
            }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: '#58A700',
                  color: 'white'
                }}
              >
                {currentUser.avatar || currentUser.name?.charAt(0)?.toUpperCase() || <User size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="font-medium truncate"
                  style={{
                    fontSize: '13px',
                    color: '#3C3C43',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                  }}
                >
                  {currentUser.name}
                </p>
                <p 
                  className="truncate"
                  style={{
                    fontSize: '11px',
                    color: '#8E8E93',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                  }}
                >
                  {currentUser.grade}
                </p>
              </div>
              <button
                className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => {
                  // Add settings functionality here if needed
                }}
              >
                <Settings size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedThreadsSidebar;
