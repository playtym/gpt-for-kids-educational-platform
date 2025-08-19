
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Camera, CameraOff, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatMessage, sendChatMessage } from "@/api/chatApi";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const ChatWindow = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your exploration guide. What would you like to discover today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
          role: "user",
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

  const toggleMic = () => {
    setIsMicActive(!isMicActive);
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="h-full flex flex-col glass-card overflow-hidden">
      <div className="p-4 border-b flex items-center">
        <Avatar className="h-8 w-8 mr-3">
          <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
          <AvatarFallback>PL</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-medium">Exploration Guide</h2>
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
                <AvatarFallback>PL</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl",
                message.sender === "user"
                  ? "bg-gradient-to-r from-plural-blue to-plural-purple text-white rounded-tr-none"
                  : "glass-effect rounded-tl-none"
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
              <AvatarFallback>PL</AvatarFallback>
            </Avatar>
            <div className="glass-effect rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Button
            variant={isMicActive ? "default" : "outline"}
            size="icon"
            className={cn(
              "rounded-full transition-all",
              isMicActive && "bg-plural-blue hover:bg-plural-blue/90"
            )}
            onClick={toggleMic}
          >
            {isMicActive ? <Mic size={18} /> : <MicOff size={18} />}
          </Button>
          <Button
            variant={isCameraActive ? "default" : "outline"}
            size="icon"
            className={cn(
              "rounded-full transition-all",
              isCameraActive && "bg-plural-blue hover:bg-plural-blue/90"
            )}
            onClick={toggleCamera}
          >
            {isCameraActive ? <Camera size={18} /> : <CameraOff size={18} />}
          </Button>
          <Input
            placeholder="Ask anything..."
            className="glass-effect rounded-full"
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

export default ChatWindow;
