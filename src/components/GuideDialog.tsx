
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Plus, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatMessage, sendChatMessage } from "@/api/chatApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const GuideDialog = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your exploration guide. What would you like to discover today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Convert our messages to the format expected by the API
      const chatMessages: ChatMessage[] = messages
        .map(msg => ({
          id: msg.id,
          role: msg.sender === "user" ? "user" as const : "assistant" as const,
          content: msg.text,
          createdAt: msg.timestamp
        }))
        .concat({
          id: userMessage.id,
          role: "user" as const,
          content: userMessage.text,
          createdAt: userMessage.timestamp
        });

      // Send to API and get response
      const response = await sendChatMessage(chatMessages);

      // Add response to messages
      const assistantMessage: Message = {
        id: response.id || (Date.now() + 1).toString(),
        text: response.content,
        sender: "assistant",
        timestamp: response.createdAt || new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Show options after AI responds
      setShowOptions(true);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuest = () => {
    toast({
      title: "Quest Creation",
      description: "Creating a new quest based on your conversation.",
    });
    // Here you would typically create a quest in your database
    // For now, we'll just navigate to a new quest ID
    const newQuestId = Math.floor(Math.random() * 1000) + 12; // Generate random ID beyond existing ones
    navigate(`/quest/${newQuestId}`);
    onClose();
  };

  const handleContinueQuest = () => {
    toast({
      title: "Continue Exploration",
      description: "Continuing your exploration journey.",
    });
    // Navigate to a random existing quest
    const randomQuestId = Math.floor(Math.random() * 11) + 1; // Random ID between 1-11
    navigate(`/quest/${randomQuestId}`);
    onClose();
  };

  return (
    <div className="h-full flex flex-col glass-card overflow-hidden bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
      <div className="p-4 border-b border-white/10 flex items-center">
        <Avatar className="h-8 w-8 mr-3">
          <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-medium text-white">Exploration Guide</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start mb-4 animate-fade-in",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === "assistant" && (
              <Avatar className="h-8 w-8 mr-2 mt-1">
                <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl",
                message.sender === "user"
                  ? "bg-gradient-to-r from-plural-blue to-plural-purple text-white rounded-tr-none"
                  : "bg-white/20 backdrop-blur-sm border border-white/10 text-white rounded-tl-none"
              )}
            >
              <p>{message.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {message.sender === "user" && (
              <Avatar className="h-8 w-8 ml-2 mt-1">
                <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start mb-4 animate-fade-in justify-start">
            <Avatar className="h-8 w-8 mr-2 mt-1">
              <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="bg-white/20 backdrop-blur-sm border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-white">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        {showOptions && !isLoading && (
          <div className="flex flex-col space-y-2 items-center py-4">
            <Button 
              onClick={handleCreateQuest}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus size={18} className="mr-2" /> Create New Quest
            </Button>
            <Button 
              onClick={handleContinueQuest}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white"
            >
              <ArrowRight size={18} className="mr-2" /> Continue in Existing Quest
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Ask your guide anything..."
            className="glass-effect rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/60"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            className="rounded-full bg-plural-blue hover:bg-plural-blue/90 transition-all"
            size="icon"
            onClick={handleSendMessage}
            disabled={isLoading || inputValue.trim() === ""}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuideDialog;
