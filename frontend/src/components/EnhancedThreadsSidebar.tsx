import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreads } from '@/contexts/ThreadContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, MessageCircle, Trash2, BookOpen, Search, Palette, Zap, GraduationCap, Star, Trophy } from 'lucide-react';

const modeIcons = {
  'learn': BookOpen,
  'explore': Search,
  'create': Palette,
  'practice': Zap,
  'curriculum': GraduationCap,
  'default': MessageCircle
};

const modeColors = {
  'learn': 'bg-blue-100 text-blue-700 border-blue-200',
  'explore': 'bg-green-100 text-green-700 border-green-200',
  'create': 'bg-purple-100 text-purple-700 border-purple-200',
  'practice': 'bg-orange-100 text-orange-700 border-orange-200',
  'curriculum': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'default': 'bg-gray-100 text-gray-700 border-gray-200'
};

interface ThreadDeleteDialogProps {
  threadId: string;
  threadTitle: string;
  onDelete: (threadId: string) => void;
  children: React.ReactNode;
}

const ThreadDeleteDialog: React.FC<ThreadDeleteDialogProps> = ({ threadId, threadTitle, onDelete, children }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Chat Thread</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "<strong>{threadTitle}</strong>"? This action cannot be undone and all conversation history will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onDelete(threadId)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
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
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 ml-2">
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
            {depthLevel > 0 && <div className="text-yellow-600 mt-1">🏆 Earned by scoring 80%+ on quizzes</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const EnhancedThreadsSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { threads, currentThreadId, createThread, setCurrentThread, deleteThread, getThreadDepthLevel } = useThreads();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleNewThread = () => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
  };

  const handleSelectThread = (threadId: string) => {
    setCurrentThread(threadId);
    navigate(`/dashboard?thread=${threadId}`);
  };

  const handleDeleteThread = (threadId: string) => {
    setDeletingId(threadId);
    deleteThread(threadId);
    if (currentThreadId === threadId) {
      navigate('/dashboard');
    }
    setTimeout(() => setDeletingId(null), 300);
  };

  const getModeInfo = (thread: any) => {
    const mode = thread.lastMode || 'default';
    const Icon = modeIcons[mode as keyof typeof modeIcons] || modeIcons.default;
    const colorClass = modeColors[mode as keyof typeof modeColors] || modeColors.default;
    
    return { mode, Icon, colorClass };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
        
        {/* New Thread Button */}
        <Button
          onClick={handleNewThread}
          className="w-full justify-start py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors font-medium"
        >
          <Plus size={18} className="mr-3" />
          New Conversation
        </Button>
      </div>
      
      {/* Threads List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {threads.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle size={32} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 font-medium">No conversations yet</p>
                <p className="text-xs text-gray-500 mt-1">Start a new conversation to begin learning</p>
              </div>
            ) : (
              threads.slice(0, 20).map(thread => {
                const { mode, Icon, colorClass } = getModeInfo(thread);
                const isDeleting = deletingId === thread.id;
                const isActive = currentThreadId === thread.id;
                
                return (
                  <div
                    key={thread.id}
                    className={`group relative transition-all duration-200 ${
                      isDeleting ? 'opacity-50 scale-95' : ''
                    } ${
                      isActive ? 'bg-blue-50 border border-blue-200 rounded-lg' : 'hover:bg-gray-50 rounded-lg'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectThread(thread.id)}
                      className="flex items-start justify-between p-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium truncate text-sm text-gray-900">{thread.title}</h3>
                            <DepthBadge threadId={thread.id} mode={mode} />
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className={`text-xs ${colorClass}`}>
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {thread.totalMessages} messages
                            </span>
                          </div>
                          
                          {thread.subjects.length > 0 && (
                            <div className="text-xs text-gray-500 truncate">
                              📚 {thread.subjects.slice(0, 2).join(', ')}
                              {thread.subjects.length > 2 && ` +${thread.subjects.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ThreadDeleteDialog
                        threadId={thread.id}
                        threadTitle={thread.title}
                        onDelete={handleDeleteThread}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </ThreadDeleteDialog>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default EnhancedThreadsSidebar;
