
import React, { useState, useRef, useEffect } from "react";
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Clean header */}
      <div 
        className="px-6 py-4 border-b flex items-center"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderColor: '#E5E5EA'
        }}
      >
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
            <AvatarFallback 
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm"
            >
              PL
            </AvatarFallback>
          </Avatar>
          <h2 
            className="text-lg font-semibold"
            style={{ 
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}
          >
            Exploration Guide
          </h2>
        </div>
      </div>

      {/* Clean chat messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: '#F2F2F7' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start mb-4 animate-fade-in",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === "assistant" && (
              <Avatar className="h-8 w-8 mr-3 mt-1">
                <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
                <AvatarFallback 
                  style={{
                    background: '#58A700',
                    color: 'white',
                    fontFamily: '"feather", sans-serif',
                    fontWeight: '600'
                  }}
                >
                  PL
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl transition-all duration-200",
                message.sender === "user"
                  ? "bg-white text-gray-900 rounded-tr-lg border"
                  : "bg-gray-50 rounded-tl-lg text-gray-900 border"
              )}
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                borderColor: '#E5E5EA',
                fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif'
              }}
            >
              <p 
                className="leading-relaxed"
                style={{
                  fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: '15px',
                  color: '#3C3C43'
                }}
              >
                {message.text}
              </p>
              <span 
                className="text-xs mt-2 block font-medium"
                style={{
                  fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#8E8E93'
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {message.sender === "user" && (
              <Avatar className="h-8 w-8 ml-3 mt-1">
                <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                <AvatarFallback 
                  style={{
                    background: '#3C3C43',
                    color: 'white',
                    fontFamily: '"feather", sans-serif',
                    fontWeight: '600'
                  }}
                >
                  U
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start mb-4 animate-fade-in justify-start">
            <Avatar className="h-8 w-8 mr-3 mt-1">
              <AvatarImage src="/placeholder.svg" alt="Assistant Avatar" />
              <AvatarFallback 
                style={{
                  background: '#58A700',
                  color: 'white',
                  fontFamily: '"feather", sans-serif',
                  fontWeight: '600'
                }}
              >
                PL
              </AvatarFallback>
            </Avatar>
            <div 
              className="bg-gray-50 border px-4 py-3 rounded-2xl rounded-tl-lg"
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                borderColor: '#E5E5EA'
              }}
            >
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Clean input area */}
      <div 
        className="px-6 py-4 border-t"
        style={{
          background: '#FFFFFF',
          borderColor: '#E5E5EA'
        }}
      >
        <div className="flex items-center space-x-3 w-full">
          <button
            className={cn(
              "rounded-full transition-all duration-200 border flex items-center justify-center",
              isMicActive 
                ? "bg-red-500 text-white border-red-500" 
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            )}
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px'
            }}
            onClick={toggleMic}
          >
            {isMicActive ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            className={cn(
              "rounded-full transition-all duration-200 border flex items-center justify-center",
              isCameraActive 
                ? "bg-green-500 text-white border-green-500" 
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            )}
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px'
            }}
            onClick={toggleCamera}
          >
            {isCameraActive ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>
          <input
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            style={{
              background: 'white',
              borderColor: '#E5E5EA',
              fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '15px',
              color: '#3C3C43'
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button
            className="bg-green-500 text-white rounded-full border-0 transition-all duration-200 hover:bg-green-600 flex items-center justify-center disabled:opacity-50"
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              background: inputValue.trim() ? '#58A700' : '#D1D1D6'
            }}
            onClick={handleSendMessage}
            disabled={isLoading || inputValue.trim() === ""}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
