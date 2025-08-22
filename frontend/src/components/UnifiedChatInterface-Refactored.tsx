import React, { useState, useEffect } from 'react';
import { useEducational } from '@/contexts/EducationalContext';
import { useThreads, ChatMessage as ThreadMessage } from '@/contexts/ThreadContext';
import { agentService, SocraticMode as AgentSocraticMode, AgeGroup } from '@/api/agentService';
import { useToast } from '@/hooks/use-toast';
import { memoryService } from '@/services/memoryService';

// Import new modular components
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import InputArea from './chat/InputArea';

type ChatMode = 'explore' | 'learn' | 'create' | 'curriculum';
type SocraticMode = AgentSocraticMode;
type ChatMessage = ThreadMessage;

interface UnifiedChatInterfaceProps {
  className?: string;
  threadId?: string;
}

const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({
  className = '',
  threadId
}) => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('explore');
  const [currentSocraticMode, setCurrentSocraticMode] = useState<SocraticMode>('questioning');

  // Contexts and hooks
  const { selectedAgeGroup, currentSubject } = useEducational();
  const { 
    currentThreadId,
    createThread,
    updateThread,
    deleteThread,
    getCurrentThread,
    setCurrentThread
  } = useThreads();
  const { toast } = useToast();

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
        socraticMode: msg.socraticMode as SocraticMode | undefined,
      }));
      setMessages(convertedMessages);
      
      if (currentThread.messages.length > 0) {
        const lastMessage = currentThread.messages[currentThread.messages.length - 1];
        setCurrentMode((lastMessage.mode as ChatMode) || 'explore');
        if (lastMessage.socraticMode) {
          setCurrentSocraticMode(lastMessage.socraticMode as SocraticMode);
        }
      }
    } else {
      setMessages([]);
    }
  }, [currentThreadId, getCurrentThread]);

  // Add message to thread and update memory
  const addMessageToThread = (message: ChatMessage): ChatMessage => {
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, message];
      
      // Update thread if it exists
      if (currentThreadId) {
        updateThread(currentThreadId, newMessages);
      } else {
        // Create new thread if none exists
        const threadMessage = {
          ...message,
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
        };
        const newThreadId = createThread(threadMessage);
        setCurrentThread(newThreadId);
      }
      
      return newMessages;
    });
    
    return message;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: Date.now(),
      mode: currentMode,
      socraticMode: currentSocraticMode
    };

    // Add user message to thread
    addMessageToThread(userMessage);

    // Clear input and set loading
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      // Build context from recent messages
      const context = messages.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        timestamp: msg.timestamp
      }));

      // Get AI response
      const response = await agentService.chat({
        message: currentInput,
        mode: currentMode,
        ageGroup: selectedAgeGroup as AgeGroup,
        context: context,
        socraticMode: currentMode === 'learn' ? currentSocraticMode : undefined,
        subject: currentSubject
      });

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: response.response,
        sender: 'assistant',
        timestamp: Date.now(),
        mode: currentMode,
        socraticMode: currentSocraticMode,
        metadata: response.metadata
      };

      // Add assistant message to thread
      addMessageToThread(assistantMessage);

      // Update memory service
      await memoryService.addToConversationMemory(
        currentInput,
        response.response,
        {
          mode: currentMode,
          ageGroup: selectedAgeGroup,
          subject: currentSubject,
          timestamp: Date.now()
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (currentMode !== 'explore') {
      toast({
        title: "File Upload",
        description: "Image uploads are only supported in explore mode.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to base64 for sending to backend
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        // Add file upload message
        const fileMessage: ChatMessage = {
          id: `file-${Date.now()}`,
          content: `Uploaded: ${file.name}`,
          sender: 'user',
          timestamp: Date.now(),
          mode: currentMode,
          attachments: [{
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            url: base64Data,
            size: file.size
          }]
        };
        addMessageToThread(fileMessage);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Thread management functions
  const createNewThread = () => {
    const newThreadId = createThread();
    setCurrentThread(newThreadId);
    setMessages([]);
    setCurrentMode('explore');
    
    toast({
      title: "New Chat Started",
      description: "Start a conversation and watch it appear on your adventure map!",
    });
  };

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

  // Handle mode changes
  const handleModeChange = (mode: ChatMode) => {
    if (mode === currentMode) return;
    
    setCurrentMode(mode);
    toast({
      title: `Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
      description: `Now optimized for ${mode === 'curriculum' ? 'study' : mode} conversations.`,
    });
  };

  // Handle follow-up questions
  const handleFollowUp = (question: string) => {
    setInputValue(question);
  };

  const handleExploreConnection = (connection: string) => {
    setInputValue(connection);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      <ChatHeader
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onNewThread={createNewThread}
        onDeleteThread={deleteCurrentThread}
        onClearThread={clearCurrentThread}
        canDeleteThread={!!currentThreadId}
        hasMessages={messages.length > 0}
      />

      <MessageList
        messages={messages}
        currentMode={currentMode}
        onFollowUp={handleFollowUp}
        onExploreConnection={handleExploreConnection}
        isLoading={isLoading}
      />

      <InputArea
        currentMode={currentMode}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={handleSubmit}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
      />
    </div>
  );
};

export default UnifiedChatInterface;
