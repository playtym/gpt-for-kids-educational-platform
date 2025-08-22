import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Send, BookOpen, Brain, MessageCircle, HelpCircle, Sparkles, ChevronDown, Plus, Trash2, RotateCcw, Paperclip, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEducational } from '@/contexts/EducationalContext';
import { useThreads, ChatMessage as ThreadMessage } from '@/contexts/ThreadContext';
import { agentService, AgeGroup } from '@/api/agentService';
import { useToast } from '@/hooks/use-toast';
import GuideDialog from '@/components/GuideDialog';
import ContentRenderer from './ContentCards/ContentRenderer';
import { memoryService } from '@/services/memoryService';
import EnhancedChatHeader from '@/components/EnhancedChatHeader';
import InlineAgentStatus from '@/components/InlineAgentStatus';

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

// Use the ChatMessage from ThreadContext
type ChatMessage = ThreadMessage;

interface UnifiedChatInterfaceProps {
  className?: string;
  threadId?: string; // Allow loading a specific thread
}

const modeConfig = {
  explore: {
    icon: Search,
    label: 'Explore',
    placeholder: 'Ask about anything you want to discover...',
    color: 'bg-blue-500',
    description: 'General exploration and discovery',
    gradient: 'from-blue-500 to-blue-600'
  },
  learn: {
    icon: Brain,
    label: 'Learn',
    placeholder: 'What would you like to learn about?',
    color: 'bg-purple-500',
    description: 'Deep understanding with guided learning',
    gradient: 'from-purple-500 to-purple-600'
  },
  create: {
    icon: BookOpen,
    label: 'Create',
    placeholder: 'What would you like to create or write?',
    color: 'bg-green-500',
    description: 'Creative storytelling and imagination',
    gradient: 'from-green-500 to-green-600'
  },
  curriculum: {
    icon: Sparkles,
    label: 'Study',
    placeholder: 'Which subject or chapter would you like to study?',
    color: 'bg-indigo-500',
    description: 'Structured curriculum-based learning',
    gradient: 'from-indigo-500 to-indigo-600'
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Space Explorer':
      return '#8B5CF6'; // purple
    case 'Ocean Voyager':
      return '#0EA5E9'; // blue
    case 'Desert Adventurer':
      return '#F97316'; // orange
    case 'Forest Ranger':
      return '#10B981'; // green
    case 'Science Explorer':
      return '#6366F1'; // indigo
    case 'Creative Writer':
      return '#EC4899'; // pink
    case 'Problem Solver':
      return '#8B5CF6'; // purple
    default:
      return '#6B7280'; // gray
  }
};

export const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({ className = '', threadId }) => {
  const { ageGroup, curriculumBoard, curriculumGrade } = useEducational();
  const { toast } = useToast();
  const { 
    threads, 
    currentThreadId, 
    createThread, 
    updateThread, 
    deleteThread, 
    setCurrentThread, 
    getCurrentThread,
    generateThreadTitle 
  } = useThreads();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentMode, setCurrentMode] = useState<ChatMode>('explore');
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [showAgentStatus, setShowAgentStatus] = useState(false);
  
  // UI state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastModeChangeRef = useRef<number>(0);

  // Helper function to extract content and metadata from message
  const extractMessageContent = (messageContent: any) => {
    if (typeof messageContent === 'string') {
      return { content: messageContent, metadata: null, question: undefined };
    }
    if (typeof messageContent === 'object' && messageContent) {
      // Handle new structured exploration response format
      if (messageContent.type === 'exploration') {
        return {
          content: messageContent.shortAnswer || 'No content available',
          metadata: {
            shortAnswer: messageContent.shortAnswer,
            followUpQuestions: messageContent.followUpQuestions || [],
            relatedTopics: messageContent.relatedTopics || [],
            relevantImage: messageContent.relevantImage || null,
            ageGroup: messageContent.ageGroup,
            inputType: messageContent.inputType
          },
          question: undefined
        };
      }
      
      // Handle learning path response formats
      if (messageContent.type && messageContent.type.startsWith('learning_path')) {
        return {
          content: messageContent.content || 'No content available',
          question: messageContent.question,
          metadata: {
            ...messageContent.metadata,
            isLearningPath: true,
            feedbackType: messageContent.type === 'learning_feedback' ? 'answer_evaluation' : undefined,
            stepType: messageContent.type
          }
        };
      }
      
      // Handle legacy format
      return {
        content: messageContent.content || 'No content available',
        metadata: messageContent.metadata || null,
        question: messageContent.question
      };
    }
    return { content: 'No content available', metadata: null, question: undefined };
  };

  // Load thread on mount or when threadId changes
  useEffect(() => {
    try {
      if (threadId && threadId !== currentThreadId) {
        setCurrentThread(threadId);
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      toast({
        title: "Error",
        description: "Failed to load thread. Please try again.",
        variant: "destructive"
      });
    }
  }, [threadId, currentThreadId, setCurrentThread, toast]);

  // Update messages when current thread changes
  useEffect(() => {
    try {
      const currentThread = getCurrentThread();
      if (currentThread && Array.isArray(currentThread.messages)) {
        // Convert thread messages to component messages with safe mapping
        const convertedMessages: ChatMessage[] = currentThread.messages
          .filter(msg => msg && typeof msg === 'object') // Filter out invalid messages
          .map(msg => ({
            ...msg,
            mode: (msg.mode as ChatMode) || 'explore', // Fallback mode
            timestamp: msg.timestamp || new Date(), // Fallback timestamp
          }));
        setMessages(convertedMessages);
        
        if (currentThread.messages.length > 0) {
          const lastMessage = currentThread.messages[currentThread.messages.length - 1];
          if (lastMessage && lastMessage.mode) {
            setCurrentMode((lastMessage.mode as ChatMode) || 'explore');
          }
          if (currentThread.subjects && currentThread.subjects.length > 0) {
            setSubject(currentThread.subjects[currentThread.subjects.length - 1] || '');
          }
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error updating messages from thread:', error);
      setMessages([]); // Reset to safe state
      toast({
        title: "Error",
        description: "Failed to load conversation history.",
        variant: "destructive"
      });
    }
  }, [currentThreadId, getCurrentThread, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when mode changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentMode]);

  const addMessage = useCallback((content: string | any, type: 'user' | 'assistant', metadata?: any): ChatMessage => {
    // Detect mode from content type for assistant messages
    let messageMode = currentMode;
    if (type === 'assistant' && typeof content === 'object' && content?.type) {
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
      
      // Use a timeout to defer thread operations to avoid render-time state updates
      setTimeout(() => {
        // Convert to thread messages for storage
        const threadMessages: ThreadMessage[] = newMessages.map(msg => ({
          ...msg,
          mode: msg.mode,
          socraticMode: msg.socraticMode,
        }));
        
        // Update or create thread
        if (currentThreadId) {
          updateThread(currentThreadId, threadMessages);
        } else {
          // Create new thread with the first message
          const threadMessage: ThreadMessage = {
            ...message,
            mode: message.mode,
            socraticMode: message.socraticMode,
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
      description: "Start a conversation and watch it appear on your adventure map!",
    });
  }, [createThread, setCurrentThread, toast]);

  const deleteCurrentThread = () => {
    if (currentThreadId) {
      deleteThread(currentThreadId);
      setCurrentThread(null);
      setMessages([]);
      
      toast({
        title: "Thread Deleted",
        description: "The conversation has been removed from your map.",
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
      description: "Conversation history cleared. Keep chatting to build a new adventure!",
    });
  };

  const handleModeChange = (mode: ChatMode) => {
    try {
      if (mode === currentMode) {
        return;
      }
      
      // Validate mode is a valid option
      if (!modeConfig[mode]) {
        console.error('Invalid mode:', mode);
        return;
      }
      
      // Prevent rapid mode switching
      const now = Date.now();
      if (lastModeChangeRef.current && (now - lastModeChangeRef.current) < 500) {
        return;
      }
      lastModeChangeRef.current = now;
      
      setCurrentMode(mode);
      
      // Force focus to input after mode change
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Add a context message when switching modes (only if there are existing messages)
      if (messages.length > 0) {
        addMessage(
          `🔄 Switched to ${modeConfig[mode].label} mode. ${modeConfig[mode].description}.`,
          'assistant',
          { isSystemMessage: true }
        );
      }
    } catch (error) {
      console.error('Error changing mode:', error);
      toast({
        title: "Error",
        description: "Failed to change mode. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to process API requests
  const processApiRequest = async (threadId: string, query: string, mode: ChatMode, effectiveAgeGroup: AgeGroup, existingUserMessage?: ChatMessage) => {
    // Get relevant context from memory service
    const memoryContext = await memoryService.getRelevantContext({
      threadId: threadId,
      currentMessage: query,
      context: {
        mode,
        subject: mode === 'learn' ? subject : undefined,
        ageGroup: effectiveAgeGroup,
        board: mode === 'curriculum' ? curriculumBoard : undefined,
        grade: mode === 'curriculum' ? curriculumGrade : undefined
      },
      limit: 10,
      relevanceThreshold: 0.3
    });

    // Get current messages for context - if we have an existing user message, use current messages
    // otherwise use the messages state
    const currentMessages = existingUserMessage ? 
      [...messages, existingUserMessage] : 
      messages;
      
    // Convert messages to context format for API and include memory context
    const contextMessages = [
      {
        role: 'assistant' as const,
        content: `CONVERSATION MEMORY:\n${memoryContext.contextPrompt}`,
        timestamp: new Date().toISOString()
      },
      ...currentMessages.slice(-5).map(msg => ({
        role: msg.type,
        content: extractMessageContent(msg.content).content,
        timestamp: msg.timestamp.toISOString()
      }))
    ];

    // Use the new agent service for unified chat
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

    // Process assistant message with memory service
    await memoryService.processMessage(
      threadId,
      typeof response.response === 'string' ? response.response : JSON.stringify(response.response),
      'assistant',
      {
        mode,
        subject: mode === 'learn' ? subject : undefined,
        ageGroup: effectiveAgeGroup,
        board: mode === 'curriculum' ? curriculumBoard : undefined,
        grade: mode === 'curriculum' ? curriculumGrade : undefined,
        agent: response.agent
      }
    );

    // Add assistant response
    addMessage(response.response, 'assistant', { 
      apiResponse: response,
      mode,
      contextLength: response.contextLength,
      memoryEntriesUsed: memoryContext.entries.length
    });
  };

  // Helper function to process learning journey requests
  const processLearningJourney = async (threadId: string, query: string, effectiveAgeGroup: AgeGroup, existingUserMessage?: ChatMessage) => {
    try {
      // Check if this is the start of a new learning conversation or continuing one
      const isNewLearningConversation = messages.length === 0 || !messages.some(msg => 
        msg.type === 'assistant' && 
        msg.metadata?.isLearningPath === true
      );
      
      let response;
      
      if (isNewLearningConversation) {
        // Start a new learning journey
        response = await agentService.startLearningJourney(threadId, query, effectiveAgeGroup);
      } else {
        // Continue existing learning journey by processing the student's answer
        response = await agentService.processLearningAnswer(threadId, query, effectiveAgeGroup);
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process learning journey');
      }
      
      // Handle the response properly based on its type
      const responseContent = typeof response.response === 'string' 
        ? response.response 
        : JSON.stringify(response.response);
      
      // Process the learning response with memory service
      await memoryService.processMessage(
        threadId,
        responseContent,
        'assistant',
        {
          mode: 'learn',
          subject: subject,
          ageGroup: effectiveAgeGroup,
          agent: response.agent,
          isLearningPath: true
        }
      );
      
      // Add learning journey response with the structured response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: 'learn',
        isLearningPath: true,
        contextLength: response.contextLength
      });
      
    } catch (error) {
      console.error('Learning journey error:', error);
      // Don't hide the error - let it surface for debugging
      throw error;
    }
  };

  const handleSubmit = async (e?: React.FormEvent, customInput?: string, customMode?: ChatMode) => {
    e?.preventDefault();
    
    const query = customInput || inputValue;
    const mode = customMode || currentMode;
    let currentThread = getCurrentThread();
    const effectiveAgeGroup = ageGroup || '8-10'; // Use same fallback as mode components
    
    if (!query.trim()) {
      return;
    }

    if (!currentThread && !isCreatingThread) {
      // Create new thread and process the message
      setIsCreatingThread(true);
      
      // Create user message first
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        mode: mode,
        timestamp: new Date(),
        subject: mode === 'learn' ? subject : undefined,
        metadata: {}
      };
      
      const newThreadId = createThread(userMessage);
      setCurrentThread(newThreadId);
      
      // Immediately add the user message to local state to ensure it displays
      setMessages([userMessage]);
      
      // Clear input immediately since we're processing the message
      if (!customInput) {
        setInputValue('');
      }
      
      // Continue processing with the new thread
      setIsCreatingThread(false);
      setIsLoading(true);
      setShowAgentStatus(true);
      
      // Process the API request directly since we already have the user message in the thread
      try {
        if (mode === 'learn') {
          // Always use structured learning journey for Learn mode
          await processLearningJourney(newThreadId, query, effectiveAgeGroup, userMessage);
        } else {
          await processApiRequest(newThreadId, query, mode, effectiveAgeGroup, userMessage);
        }
      } catch (error) {
        console.error('Error processing message in new thread:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setShowAgentStatus(false);
      }
      return;
    } else if (isCreatingThread) {
      // If thread creation is in progress, wait and retry
      return;
    }

    // Add user message
    addMessage(query, 'user');
    
    // Process user message with memory service
    await memoryService.processMessage(
      currentThread.id,
      query,
      'user',
      {
        mode,
        subject: mode === 'learn' ? subject : undefined,
        ageGroup: effectiveAgeGroup,
        board: mode === 'curriculum' ? curriculumBoard : undefined,
        grade: mode === 'curriculum' ? curriculumGrade : undefined
      }
    );
    
    // Clear input
    if (!customInput) {
      setInputValue('');
    }
    
    setIsLoading(true);
    setShowAgentStatus(true);

    try {
      // Check if we should start a learning journey or use regular API
      if (mode === 'learn') {
        // Always use structured learning journey for Learn mode
        await processLearningJourney(currentThread.id, query, effectiveAgeGroup);
      } else {
        // Use the reusable processApiRequest function
        await processApiRequest(currentThread.id, query, mode, effectiveAgeGroup);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Show the actual error instead of generic message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
      
      // Don't add fallback message - let the error surface
      throw error;
    } finally {
      setIsLoading(false);
      setShowAgentStatus(false);
    }
  };

  // Learning path interaction handlers
  const handleLearningAnswer = async (threadId: string, answer: string) => {
    setIsLoading(true);
    setShowAgentStatus(true);
    try {
      const response = await agentService.processLearningAnswer(threadId, answer, ageGroup || '8-10');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process learning answer');
      }
      
      // Add the response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: 'learn',
        isLearningPath: true,
        contextLength: response.contextLength
      });
      
    } catch (error) {
      console.error('Learning answer processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process your answer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowAgentStatus(false);
    }
  };

  const handleNextStep = async (threadId: string) => {
    setIsLoading(true);
    try {
      const response = await agentService.continueToNextStep(threadId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to continue to next step');
      }
      
      // Add the response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: 'learn',
        isLearningPath: true,
        contextLength: response.contextLength
      });
      
    } catch (error) {
      console.error('Next step error:', error);
      // Don't hide the error with a fallback - let it surface
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbandonJourney = async (threadId: string, reason: string = 'user_choice') => {
    setIsLoading(true);
    try {
      const response = await agentService.abandonLearningJourney(threadId, reason);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to abandon learning journey');
      }
      
      // Add the response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: 'learn',
        isLearningPath: true,
        contextLength: response.contextLength
      });
      
      toast({
        title: "Learning Journey Paused",
        description: "You can always start a new learning journey anytime!",
      });
      
    } catch (error) {
      console.error('Abandon journey error:', error);
      toast({
        title: "Error",
        description: "Failed to pause learning journey.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpTopic = async (threadId: string, topic: string) => {
    setIsLoading(true);
    try {
      const effectiveAgeGroup = ageGroup || '8-10';
      const response = await agentService.startFollowUpJourney(threadId, topic, effectiveAgeGroup);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to start follow-up journey');
      }
      
      // Add the response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: 'learn',
        isLearningPath: true,
        contextLength: response.contextLength
      });
      
      toast({
        title: "New Learning Journey Started!",
        description: `Let's explore: ${topic}`,
      });
      
    } catch (error) {
      console.error('Follow-up topic error:', error);
      toast({
        title: "Error",
        description: "Failed to start new learning journey.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (threadId: string) => {
    setIsLoading(true);
    try {
      // Get all learning context from current thread
      const currentThread = getCurrentThread();
      const learningContext = currentThread?.messages.filter(msg => 
        msg.mode === 'learn' && msg.metadata?.isLearningPath
      ) || [];

      const response = await agentService.generateLearningQuiz(threadId, learningContext);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate learning quiz');
      }
      
      // Add the response
      addMessage(response.response, 'assistant', { 
        apiResponse: response,
        mode: 'learn',
        isLearningPath: true,
        isQuiz: true,
        contextLength: response.contextLength
      });
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate practice quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoDeep = async (messageContent: string, messageSubject?: string) => {
    const exploreSubject = messageSubject || subject || 'this topic';
    
    // Set the subject for learning mode
    if (!subject && messageSubject) {
      setSubject(messageSubject);
    }
    
    // Switch to learn mode if not already
    setCurrentMode('learn');
    
    const deepQuery = `Let's explore this topic in much greater depth: ${messageContent.substring(0, 200)}...`;
    
    // Use the structured learning mode directly
    setTimeout(() => {
      handleSubmit(undefined, deepQuery, 'learn');
    }, 100);
  };

  // File handling functions
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if age group is selected for file upload
    if (!ageGroup) {
      addMessage('❌ Please select an age group before uploading files. You can do this from the Dashboard.', 'assistant');
      return;
    }

    // Validate file types (images only for explore mode)
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select image files only for explore mode.');
      return;
    }

    // For now, handle only the first image
    const imageFile = imageFiles[0];
    setUploadedFiles([imageFile]);
    setIsProcessingFile(true);

    try {
      // Add a message indicating image is being processed
      addMessage(`🔄 Analyzing image: ${imageFile.name}`, 'user');
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('message', `Analyze this image: ${imageFile.name}`);
      formData.append('mode', 'explore');
      formData.append('ageGroup', ageGroup);
      formData.append('context', JSON.stringify([]));

      // Send to the image upload endpoint
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process image');
      }

      const result = await response.json();
      
      // Add the AI response
      addMessage(result.response, 'assistant', 'explore');
      
      // Clear uploaded files
      setUploadedFiles([]);
      
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
      
    } catch (error) {
      console.error('Error processing image:', error);
      addMessage(`❌ Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assistant');
      setUploadedFiles([]);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getMessageIcon = (message: ChatMessage) => {
    if (message.type === 'user') return null;
    
    const config = modeConfig[message.mode];
    const Icon = config.icon;
    return <Icon size={16} className="text-white" />;
  };

  const getMessageBadgeColor = (message: ChatMessage) => {
    return modeConfig[message.mode].color;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Enhanced Header */}
      <EnhancedChatHeader 
        currentMode={currentMode}
        threadTitle={getCurrentThread()?.title}
      />

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && currentMode === 'explore' && (
            <ExploreMode
              onStartExploration={(topic, category) => {
                
                // Trigger the submission directly (thread will be created in handleSubmit if needed)
                handleSubmit(undefined, topic, 'explore');
              }}
              ageGroup={ageGroup || '8-10'}
              userId={threadId || 'anonymous'}
            />
          )}

          {messages.length === 0 && currentMode === 'learn' && (
            <LearnMode
              onStartLearning={(query, _socraticMode, subject) => {
                if (subject) setSubject(subject);
                
                // Trigger the submission directly (thread will be created in handleSubmit if needed)
                handleSubmit(undefined, query, 'learn');
              }}
              ageGroup={ageGroup || '8-10'}
              userId={threadId || 'anonymous'}
            />
          )}

          {messages.length === 0 && currentMode === 'create' && (
            <CreateMode
              onStartCreation={(prompt, creationType, style) => {
                
                // Trigger the submission directly (thread will be created in handleSubmit if needed)
                handleSubmit(undefined, prompt, 'create');
              }}
              ageGroup={ageGroup || '8-10'}
              userId={threadId || 'anonymous'}
            />
          )}

          {messages.length === 0 && currentMode === 'curriculum' && (
            <StudyMode
              onStartStudy={(action, subject, details) => {
                // Use the actual question from details.query instead of constructing a generic prompt
                const studyPrompt = details.query || `Help me with ${action} for ${subject} (${details.board} ${details.grade})`;
                
                // Trigger the submission directly (thread will be created in handleSubmit if needed)
                handleSubmit(undefined, studyPrompt, 'curriculum');
              }}
              ageGroup={ageGroup || '8-10'}
              curriculumBoard={curriculumBoard}
              curriculumGrade={curriculumGrade}
              userId={threadId || 'anonymous'}
            />
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message Header */}
                {message.type === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge 
                      className={`${getMessageBadgeColor(message)} text-white flex items-center space-x-1`}
                    >
                      {getMessageIcon(message)}
                      <span className="text-xs">{modeConfig[message.mode].label}</span>
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                {/* Message Content */}
                <div>
                  {message.type === 'assistant' ? (
                    // Use specialized response cards for assistant messages
                    (() => {
                      switch (message.mode || currentMode) {
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
                          
                          // Handle quiz responses specially
                          if (learnMetadata?.isQuiz && learnMetadata?.quiz) {
                            return (
                              <QuizCard
                                quiz={learnMetadata.quiz}
                                metadata={learnMetadata}
                                threadId={currentThreadId || undefined}
                                onComplete={(results) => {
                                  // Could add message about quiz completion
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
                                // Handle structured learning answer
                                if (learnMetadata?.isLearningPath && currentThreadId) {
                                  handleLearningAnswer(currentThreadId, answer);
                                } else {
                                  setInputValue(answer);
                                }
                              }}
                              onNextStep={() => {
                                // Handle structured learning next step
                                if (learnMetadata?.isLearningPath && currentThreadId) {
                                  handleNextStep(currentThreadId);
                                }
                              }}
                              onAbandon={() => {
                                // Handle structured learning abandonment
                                if (learnMetadata?.isLearningPath && currentThreadId) {
                                  handleAbandonJourney(currentThreadId);
                                }
                              }}
                              onStartQuiz={() => {
                                // Handle practice quiz
                                if (currentThreadId) {
                                  handleStartQuiz(currentThreadId);
                                }
                              }}
                              onFollowUpTopic={(topic) => {
                                // Start follow-up learning journey
                                if (currentThreadId) {
                                  handleFollowUpTopic(currentThreadId, topic);
                                }
                              }}
                              isLoading={isLoading}
                              // Legacy props for backward compatibility
                              thinkingPrompts={(learnMetadata || message.metadata)?.thinkingPrompts || ["What do you think about this?", "How would you explain this to a friend?"]}
                              nextSteps={(learnMetadata || message.metadata)?.nextSteps || ["Ask a follow-up question", "Practice with examples"]}
                              subject={message.subject}
                              onThinkingPrompt={(prompt) => setInputValue(prompt)}
                            />
                          );
                        case 'create':
                          const { content: createContent, metadata: createMetadata } = extractMessageContent(message.content);
                          return (
                            <CreateResponseCard
                              content={createContent}
                              inspirationPrompts={(createMetadata || message.metadata)?.inspirationPrompts || ["Make it even more creative!", "Add your own twist to this"]}
                              nextCreationIdeas={(createMetadata || message.metadata)?.nextCreationIdeas || ["Create something new", "Try a different style"]}
                              ageLevel={ageGroup}
                              onInspiration={(prompt) => setInputValue(prompt)}
                              onNextCreation={(idea) => setInputValue(idea)}
                            />
                          );
                        case 'curriculum':
                          const { content: studyContent, metadata: studyMetadata } = extractMessageContent(message.content);
                          return (
                            <StudyResponseCard
                              content={studyContent}
                              subject={message.subject || subject}
                              practiceQuestions={(studyMetadata || message.metadata)?.practiceQuestions || ["Test your understanding", "Try a practice problem"]}
                              relatedTopics={(studyMetadata || message.metadata)?.relatedTopics || []}
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
                    // Use default renderer for user messages
                    <ContentRenderer
                      content={extractMessageContent(message.content).content}
                      messageType={message.type}
                      timestamp={message.timestamp.toISOString()}
                      mode={currentMode}
                    />
                  )}
                    
                  {/* Action Buttons for Assistant Messages */}
                  {message.type === 'assistant' && !message.metadata?.isSystemMessage && !message.metadata?.isError && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-100">
                      {/* Quiz functionality only available at learning path completion */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Agent Status */}
          {showAgentStatus && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[80%]">
                <InlineAgentStatus 
                  isVisible={showAgentStatus} 
                  onComplete={() => setShowAgentStatus(false)}
                />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Professional styling */}
      <div className="p-6 border-t border-gray-200 bg-white">
        {/* File upload display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200">
                {file.type.includes('pdf') ? <FileText size={16} className="text-red-500" /> : <Image size={16} className="text-blue-500" />}
                <span className="truncate max-w-32 font-medium">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-red-50 hover:text-red-600 rounded-full"
                  onClick={() => removeFile(index)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* Mode Selector - Professional styling */}
          <DropdownMenu key={`mode-selector-${currentMode}`}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 px-4 py-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                {React.createElement(modeConfig[currentMode].icon, { size: 18 })}
                <span className="hidden sm:inline text-sm font-medium">{modeConfig[currentMode].label}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2">
              {Object.entries(modeConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleModeChange(key as ChatMode)}
                  className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-colors ${
                    currentMode === key ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-md bg-${config.color.split('-')[1]}-100 text-${config.color.split('-')[1]}-600`}>
                    {React.createElement(config.icon, { size: 16 })}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center justify-between text-sm">
                      {config.label}
                      {currentMode === key && <span className="text-blue-600 text-lg">●</span>}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{config.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder={modeConfig[currentMode].placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pr-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm rounded-lg py-3 min-h-[44px] resize-none"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {/* File Upload Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-100 rounded-full"
                    onClick={handleFileSelect}
                    disabled={isProcessingFile}
                  >
                    <Paperclip size={16} className="text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload PDF or image files</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors font-medium min-h-[44px]"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline text-sm">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send size={16} />
                <span className="hidden sm:inline text-sm">Send</span>
              </div>
            )}
          </Button>
        </form>
        
        {/* Hidden file input */}
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
  );
};

export default UnifiedChatInterface;
