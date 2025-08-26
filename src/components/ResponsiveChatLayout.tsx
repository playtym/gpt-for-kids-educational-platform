import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Menu, MessageCircle, Plus, Trash2, RotateCcw, ChevronDown, BookOpen, Search, Palette, Zap, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEducational } from '@/contexts/EducationalContext';
import { useThreads, ChatMessage as ThreadMessage } from '@/contexts/ThreadContext';
import { useUser } from '@/contexts/UserContext';
import { agentService, AgeGroup } from '@/api/agentService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ContentRenderer from './ContentCards/ContentRenderer';

// Import mode-specific components
import ExploreMode from './modes/ExploreMode';
import LearnMode from './modes/LearnMode';
import CreateMode from './modes/CreateMode';
import StudyMode from './modes/StudyMode';

// Import response cards
import ExploreResponseCard from './cards/ExploreResponseCard';
import LearnResponseCard from './cards/LearnResponseCard';
import CreateResponseCard from './cards/CreateResponseCard';
import StudyResponseCard from './cards/StudyResponseCard';
import QuizCard from './cards/QuizCard';

type ChatMode = 'explore' | 'learn' | 'create' | 'curriculum';
type ChatMessage = ThreadMessage;

interface ResponsiveChatLayoutProps {
  className?: string;
  threadId?: string;
}

const modeConfig = {
  explore: {
    icon: Search,
    label: 'Explore',
    placeholder: 'What would you like to explore today?',
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    description: 'Discover new topics and satisfy your curiosity'
  },
  learn: {
    icon: BookOpen,
    label: 'Learn',
    placeholder: 'What would you like to learn?',
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Structured learning paths with quizzes'
  },
  create: {
    icon: Palette,
    label: 'Create',
    placeholder: 'What would you like to create?',
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Generate stories, art, and creative content'
  },
  curriculum: {
    icon: GraduationCap,
    label: 'Study',
    placeholder: 'What subject would you like to study?',
    color: 'bg-indigo-500',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'Curriculum-based learning and homework help'
  }
};

// Header component with mode toggle
const ChatHeader: React.FC<{
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  threadTitle?: string;
  timeSpent: string;
  userLevel: string;
  onNewChat: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  hasMessages: boolean;
}> = ({ 
  currentMode, 
  onModeChange, 
  threadTitle, 
  timeSpent, 
  userLevel, 
  onNewChat, 
  onClearChat, 
  onDeleteChat, 
  hasMessages 
}) => {
  const currentConfig = modeConfig[currentMode];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Mode selector and thread info */}
        <div className="flex items-center space-x-4">
          {/* Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentConfig.color}`} />
                <CurrentIcon size={16} />
                <span className="font-medium">{currentConfig.label}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {Object.entries(modeConfig).map(([mode, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => onModeChange(mode as ChatMode)}
                    className="flex items-start space-x-3 p-3"
                  >
                    <div className={`w-3 h-3 rounded-full ${config.color} mt-1`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Icon size={16} />
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Thread Info */}
          {threadTitle && (
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-medium text-gray-800">{threadTitle}</div>
                <div className="text-xs text-gray-500">
                  Time: {timeSpent} • Level: {userLevel}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onNewChat}>
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start new chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {hasMessages && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onClearChat}>
                    <RotateCcw size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {hasMessages && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this conversation? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteChat} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TooltipTrigger>
                <TooltipContent>Delete conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar component for desktop/tablet
const ChatSidebar: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { threads, currentThreadId, createThread, setCurrentThread, deleteThread, getThreadDepthLevel } = useThreads();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNewThread = () => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
    navigate(`/dashboard?thread=${newThreadId}`);
  };

  const handleSelectThread = (threadId: string) => {
    setCurrentThread(threadId);
    navigate(`/dashboard?thread=${threadId}`);
  };

  const handleDeleteThread = (threadId: string) => {
    deleteThread(threadId);
    if (currentThreadId === threadId) {
      navigate('/dashboard');
    }
    toast({
      title: "Chat Deleted",
      description: "The conversation has been removed.",
    });
  };

  const getModeInfo = (thread: any) => {
    const mode = thread.lastMode || 'explore';
    const config = modeConfig[mode as keyof typeof modeConfig] || modeConfig.explore;
    const Icon = config.icon;
    const colorClass = config.badgeColor;
    
    return { mode, Icon, colorClass, config };
  };

  const DepthBadge: React.FC<{ threadId: string; mode: string }> = ({ threadId, mode }) => {
    if (mode !== 'learn') return null;
    
    const depthLevel = getThreadDepthLevel(threadId);
    const thread = threads.find(t => t.id === threadId);
    const completedPaths = thread?.learnModeData?.completedPaths || 0;
    
    if (depthLevel === 0 && completedPaths === 0) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs ml-2">
              Level {depthLevel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-semibold">Learning Depth</div>
              <div>Certified Level: {depthLevel}</div>
              <div>Paths Completed: {completedPaths}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
          <Button
            onClick={handleNewThread}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus size={16} className="mr-1" />
            New
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {threads.length} {threads.length === 1 ? 'conversation' : 'conversations'}
        </div>
      </div>

      {/* Threads List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads.slice(0, 50).map(thread => {
            const { mode, Icon, colorClass } = getModeInfo(thread);
            
            return (
              <div
                key={thread.id}
                className={`group relative transition-all duration-200 ${
                  currentThreadId === thread.id 
                    ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div
                  onClick={() => handleSelectThread(thread.id)}
                  className="flex items-start justify-between p-3 rounded-lg cursor-pointer"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      <Icon size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="font-medium truncate text-sm text-gray-800">
                          {thread.title}
                        </div>
                        <DepthBadge threadId={thread.id} mode={mode} />
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${colorClass}`}>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {thread.totalMessages} msgs
                        </span>
                      </div>
                      
                      {thread.subjects.length > 0 && (
                        <div className="text-xs text-gray-500 truncate">
                          📚 {thread.subjects.slice(0, 2).join(', ')}
                          {thread.subjects.length > 2 && ` +${thread.subjects.length - 2}`}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(thread.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat Thread</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "<strong>{thread.title}</strong>"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteThread(thread.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
          
          {threads.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs">Start a new chat to begin learning!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Main responsive chat layout component
const ResponsiveChatLayout: React.FC<ResponsiveChatLayoutProps> = ({ className = '', threadId }) => {
  // Context hooks
  const { ageGroup, curriculumBoard, curriculumGrade } = useEducational();
  const { currentUser } = useUser();
  const { toast } = useToast();
  const { 
    currentThreadId, 
    createThread, 
    updateThread, 
    deleteThread, 
    setCurrentThread, 
    getCurrentThread 
  } = useThreads();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentMode, setCurrentMode] = useState<ChatMode>('explore');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate time spent
  const getTimeSpent = () => {
    const minutes = Math.floor((Date.now() - sessionStartTime) / 60000);
    if (minutes < 1) return 'Just started';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Load thread on mount or when threadId changes
  useEffect(() => {
    if (threadId && threadId !== currentThreadId) {
      setCurrentThread(threadId);
    }
  }, [threadId, currentThreadId, setCurrentThread]);

  // Update messages when current thread changes
  useEffect(() => {
    const currentThread = getCurrentThread();
    if (currentThread) {
      const convertedMessages: ChatMessage[] = currentThread.messages.map(msg => ({
        ...msg,
        mode: msg.mode as ChatMode,
      }));
      setMessages(convertedMessages);
      
      if (currentThread.messages.length > 0) {
        const lastMessage = currentThread.messages[currentThread.messages.length - 1];
        setCurrentMode((lastMessage.mode as ChatMode) || 'explore');
        if (currentThread.subjects.length > 0) {
          setSubject(currentThread.subjects[currentThread.subjects.length - 1]);
        }
      }
    } else {
      setMessages([]);
    }
  }, [currentThreadId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when mode changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentMode]);

  const addMessage = useCallback((content: string | any, type: 'user' | 'assistant', metadata?: any): ChatMessage => {
    let messageMode = currentMode;
    
    // Check metadata.mode first (for direct mode specification)
    if (type === 'assistant' && metadata?.mode) {
      messageMode = metadata.mode;
    } 
    // Fallback to content.type for backwards compatibility
    else if (type === 'assistant' && typeof content === 'object' && content?.type) {
      if (content.type.startsWith('learning_path')) {
        messageMode = 'learn';
      } else if (content.type === 'exploration') {
        messageMode = 'explore';
      } else if (content.type === 'creative') {
        messageMode = 'create';
      } else if (content.type === 'curriculum') {
        messageMode = 'curriculum';
      }
    }

    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      mode: messageMode,
      timestamp: new Date(),
      subject: messageMode === 'learn' ? subject : undefined,
      topic: messageMode === 'create' ? inputValue : undefined,
      metadata
    };
    
    setMessages(prev => {
      const newMessages = [...prev, message];
      
      setTimeout(() => {
        const threadMessages: ThreadMessage[] = newMessages.map(msg => ({
          ...msg,
          mode: msg.mode,
        }));
        
        if (currentThreadId) {
          updateThread(currentThreadId, threadMessages);
        } else {
          const threadMessage: ThreadMessage = {
            ...message,
            mode: message.mode,
          };
          const newThreadId = createThread(threadMessage);
          setCurrentThread(newThreadId);
        }
      }, 0);
      
      return newMessages;
    });
    
    return message;
  }, [currentMode, subject, inputValue, currentThreadId, updateThread, createThread, setCurrentThread]);

  const createNewThread = useCallback(() => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
    setMessages([]);
    setCurrentMode('explore');
    setSubject('');
    
    toast({
      title: "New Chat Started",
      description: "Ready for a new conversation!",
    });
  }, [createThread, setCurrentThread, toast]);

  const deleteCurrentThread = () => {
    if (currentThreadId) {
      deleteThread(currentThreadId);
      setCurrentThread(null);
      setMessages([]);
      
      toast({
        title: "Chat Deleted",
        description: "The conversation has been removed.",
      });
    }
  };

  const clearCurrentThread = () => {
    if (currentThreadId) {
      updateThread(currentThreadId, []);
    }
    setMessages([]);
    
    toast({
      title: "Chat Cleared",
      description: "Conversation history cleared.",
    });
  };

  const handleModeChange = (mode: ChatMode) => {
    if (mode === currentMode) return;
    
    // Prevent mode switching once conversation has started
    if (messages.length > 0) {
      toast({
        title: "Mode Lock",
        description: "You can't switch modes during an active conversation. Start a new chat to change modes.",
        variant: "default"
      });
      return;
    }
    
    setCurrentMode(mode);
  };

  const extractMessageContent = (content: any) => {
    if (typeof content === 'string') {
      return { content, metadata: {} };
    }
    
    if (typeof content === 'object' && content !== null) {
      if (content.content) {
        return { content: content.content, metadata: content.metadata || {}, question: content.question };
      }
      return { content: JSON.stringify(content), metadata: {} };
    }
    
    return { content: String(content), metadata: {} };
  };

  const handleSubmit = async (e?: React.FormEvent, customInput?: string, customMode?: ChatMode) => {
    e?.preventDefault();
    
    const query = customInput || inputValue;
    const mode = customMode || currentMode;
    const effectiveAgeGroup = ageGroup || '8-10';
    
    if (!query.trim()) return;

    // Create user message
    const userMessage = addMessage(query, 'user');
    
    // Clear input immediately
    if (!customInput) {
      setInputValue('');
    }
    
    setIsLoading(true);
    
    try {
      // Build context from recent messages with defensive programming
      const currentMessages = messages && messages.length > 0 ? messages : [userMessage];
      
      const contextMessages = [
        ...(currentMessages || []).slice(-5).map(msg => ({
          role: msg.type,
          content: extractMessageContent(msg.content).content,
          timestamp: msg.timestamp.toISOString()
        }))
      ];

      const response = await agentService.sendChatRequest({
        message: query,
        mode,
        ageGroup: effectiveAgeGroup,
        context: contextMessages,
        subject: mode === 'learn' ? subject : undefined,
        curriculumBoard: mode === 'curriculum' ? curriculumBoard : undefined,
        curriculumGrade: mode === 'curriculum' ? curriculumGrade : undefined
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get response');
      }
      
      // Add assistant response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: mode
      });
      
    } catch (error) {
      console.error('Chat error:', error);
      addMessage(
        "I'm having trouble right now. Please try again in a moment!",
        'assistant',
        { isError: true }
      );
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const currentThread = getCurrentThread();

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Desktop/Tablet Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar />
      </div>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <ChatSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Mode Toggle */}
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="m-2">
                  <Menu size={16} />
                </Button>
              </SheetTrigger>
            </Sheet>
          </div>

          {/* Chat Header */}
          <div className="flex-1">
            <ChatHeader
              currentMode={currentMode}
              onModeChange={handleModeChange}
              threadTitle={currentThread?.title !== 'New Chat' ? currentThread?.title : undefined}
              timeSpent={getTimeSpent()}
              userLevel={`Level ${currentUser.level}`}
              onNewChat={createNewThread}
              onClearChat={clearCurrentThread}
              onDeleteChat={deleteCurrentThread}
              hasMessages={messages.length > 0}
            />
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-white">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {messages.length === 0 && currentMode === 'explore' && (
              <ExploreMode
                onStartExploration={(topic, category) => {
                  handleSubmit(undefined, topic, 'explore');
                }}
                ageGroup={ageGroup || '8-10'}
                userId={currentUser.id}
              />
            )}

            {messages.length === 0 && currentMode === 'learn' && (
              <LearnMode
                onStartLearning={(query, _socraticMode, subject) => {
                  if (subject) setSubject(subject);
                  handleSubmit(undefined, query, 'learn');
                }}
                ageGroup={ageGroup || '8-10'}
                userId={currentUser.id}
              />
            )}

            {messages.length === 0 && currentMode === 'create' && (
              <CreateMode
                onStartCreation={(prompt, creationType, style) => {
                  handleSubmit(undefined, prompt, 'create');
                }}
                ageGroup={ageGroup || '8-10'}
                userId={currentUser.id}
              />
            )}

            {messages.length === 0 && currentMode === 'curriculum' && (
              <StudyMode
                onStartStudy={(action, subject, details) => {
                  const studyPrompt = details.query || `Help me with ${action} for ${subject} (${details.board} ${details.grade})`;
                  handleSubmit(undefined, studyPrompt, 'curriculum');
                }}
                ageGroup={ageGroup || '8-10'}
                curriculumBoard={curriculumBoard}
                curriculumGrade={curriculumGrade}
                userId={currentUser.id}
              />
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div>
                    {message.type === 'assistant' ? (
                      // Use specialized response cards for assistant messages
                      (() => {
                        const finalMode = message.mode || currentMode;
                        
                        switch (finalMode) {
                          case 'explore':
                            const { content: exploreContent, metadata: exploreMetadata } = extractMessageContent(message.content);
                            return (
                              <ExploreResponseCard
                                shortAnswer={exploreMetadata?.shortAnswer || exploreContent}
                                followUpQuestions={exploreMetadata?.followUpQuestions || ["🌟 Explore deeper aspects of this topic", "🔍 Discover related phenomena and connections"]}
                                relatedTopics={exploreMetadata?.relatedTopics || []}
                                relevantImage={exploreMetadata?.relevantImage}
                                onFollowUp={(question) => setInputValue(question)}
                                onExploreConnection={(connection) => setInputValue(connection)}
                              />
                            );
                          case 'learn':
                            const { content: learnContent, metadata: learnMetadata, question: learnQuestion } = extractMessageContent(message.content);
                            
                            if (learnMetadata?.isQuiz && learnMetadata?.quiz) {
                              return (
                                <QuizCard
                                  quiz={learnMetadata.quiz}
                                  metadata={learnMetadata}
                                  threadId={currentThreadId || undefined}
                                  onComplete={(results) => {
                                    console.log('📊 Quiz completed with results:', results);
                                  }}
                                />
                              );
                            }
                            
                            return (
                              <LearnResponseCard
                                content={learnContent}
                                question={learnQuestion}
                                metadata={learnMetadata}
                                onAnswer={(answer) => {
                                  setInputValue(answer);
                                }}
                                onNextStep={() => {}}
                                onAbandon={() => {}}
                                onStartQuiz={() => {}}
                                onFollowUpTopic={(topic) => {}}
                                isLoading={isLoading}
                                thinkingPrompts={learnMetadata?.thinkingPrompts || ["What do you think about this?", "How would you explain this to a friend?"]}
                                nextSteps={learnMetadata?.nextSteps || ["Ask a follow-up question", "Practice with examples"]}
                                subject={message.subject}
                                onThinkingPrompt={(prompt) => setInputValue(prompt)}
                              />
                            );
                          case 'create':
                            const { content: createContent } = extractMessageContent(message.content);
                            
                            // Find the corresponding user message for original input
                            const messageIndex = messages.findIndex(msg => msg.id === message.id);
                            const previousUserMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
                            const originalUserInput = previousUserMessage?.type === 'user' 
                              ? (typeof previousUserMessage.content === 'string' 
                                ? previousUserMessage.content 
                                : extractMessageContent(previousUserMessage.content).content)
                              : undefined;
                            
                            return (
                              <CreateResponseCard 
                                content={createContent}
                                originalUserInput={originalUserInput}
                                onInspiration={(prompt) => setInputValue(prompt)}
                                onNextCreation={(prompt) => setInputValue(prompt)}
                                onRecreateSection={(instruction) => {
                                  setInputValue(`Based on this feedback: "${instruction}"\n\nHere's my recreation:\n\n`);
                                }}
                              />
                            );
                          case 'curriculum':
                            const { content: curriculumContent } = extractMessageContent(message.content);
                            return (
                              <StudyResponseCard 
                                content={curriculumContent} 
                                onPracticeQuestion={(question) => setInputValue(question)}
                                onRelatedTopic={(topic) => setInputValue(topic)}
                              />
                            );
                          default:
                            const { content: defaultContent } = extractMessageContent(message.content);
                            return (
                              <ContentRenderer
                                content={defaultContent}
                                messageType={message.type}
                                timestamp={message.timestamp.toISOString()}
                                mode={currentMode}
                              />
                            );
                        }
                      })()
                    ) : (
                      <ContentRenderer
                        content={extractMessageContent(message.content).content}
                        messageType={message.type}
                        timestamp={message.timestamp.toISOString()}
                        mode={currentMode}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-white max-w-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-700">Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      
        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFileUpload}
                className="flex-shrink-0"
              >
                <Paperclip size={16} />
              </Button>
              
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={modeConfig[currentMode].placeholder}
                disabled={isLoading}
                className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              
              <Button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0 bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </form>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveChatLayout;
