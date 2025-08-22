
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useThreads } from "@/contexts/ThreadContext";
import { 
  Rocket, 
  Waves, 
  Mountain, 
  Trees, 
  Stars, 
  Fish, 
  Compass,
  Sparkles,
  Tent,
  Cloud,
  Shell,
  X,
  Bookmark,
  Move,
  MessageCircle,
  Brain,
  BookOpen,
  HelpCircle
} from "lucide-react";

// Removed dummy quests - only showing real chat threads/quests from user interactions

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Space Explorer":
      return "#8B5CF6"; // plural-purple
    case "Ocean Voyager":
      return "#0EA5E9"; // plural-blue
    case "Desert Adventurer":
      return "#F97316"; // plural-orange
    case "Forest Ranger":
      return "#10B981"; // green
    case "Science Explorer":
      return "#6366F1"; // indigo
    case "Creative Writer":
      return "#EC4899"; // pink
    case "Problem Solver":
      return "#8B5CF6"; // purple
    default:
      return "#8B5CF6";
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Space Explorer":
      return Rocket;
    case "Ocean Voyager":
      return Waves;
    case "Desert Adventurer":
      return Mountain;
    case "Forest Ranger":
      return Trees;
    case "Science Explorer":
      return Sparkles;
    case "Creative Writer":
      return BookOpen;
    case "Problem Solver":
      return Brain;
    default:
      return MessageCircle;
  }
};

// Removed difficulty level function as it's not needed for chat threads

const WorldExplorer = () => {
  // Removed dummy quest state - only using real chat threads now
  const [isEditMode, setIsEditMode] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getThreadsForMap, setCurrentThread } = useThreads();

  // Get chat threads that should appear on the map
  const chatThreads = getThreadsForMap();

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      toast({
        title: "Edit Mode Enabled",
        description: "View mode for your adventure map!",
      });
    } else {
      toast({
        title: "Edit Mode Disabled",
        description: "Your adventure map is ready to explore.",
      });
    }
  };

  const handleThreadClick = (threadId: string) => {
    if (!isEditMode) {
      // Switch to the chat tab and load this thread
      setCurrentThread(threadId);
      navigate('/dashboard?tab=chat&thread=' + threadId);
      
      toast({
        title: "Loading Chat",
        description: "Opening your conversation adventure!",
      });
    }
  };

  return (
    <div 
      className="h-full w-full relative overflow-hidden"
      ref={mapRef}
    >
      {/* Adventure map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 to-purple-100/80">
        {/* Map decorative elements */}
        <div className="absolute top-1/4 left-1/5 w-32 h-32 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 blur-md animate-pulse-subtle"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-gradient-to-r from-purple-200 to-purple-300 blur-md animate-pulse-subtle"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-gradient-to-r from-green-200 to-green-300 blur-md animate-pulse-subtle"></div>
        <div className="absolute top-1/3 left-1/3 w-36 h-36 rounded-full bg-gradient-to-r from-yellow-200 to-orange-200 blur-md animate-pulse-subtle"></div>
        <div className="absolute bottom-1/4 left-1/2 w-28 h-28 rounded-full bg-gradient-to-r from-teal-200 to-cyan-200 blur-md animate-pulse-subtle"></div>
      </div>
      
      {/* Edit mode toggle button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 right-16 z-30 bg-white/90 backdrop-blur-sm"
        onClick={toggleEditMode}
      >
        <Move size={16} className="mr-2" />
        {isEditMode ? "Done Viewing" : "View Mode"}
      </Button>
      
      {/* Chat Thread markers - Real quest items from user conversations */}
      <div className="absolute inset-0 z-10">
        {chatThreads.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg max-w-md">
              <MessageCircle size={48} className="mx-auto text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Your Adventure!</h3>
              <p className="text-gray-600 mb-4">
                Chat with our AI to create learning adventures that will appear as quest markers on this map.
              </p>
              <Button 
                onClick={() => navigate('/dashboard?tab=chat')}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Start Chatting
              </Button>
            </div>
          </div>
        ) : (
          chatThreads.map((thread) => {
            const CategoryIcon = getCategoryIcon(thread.category);
            return (
              <div
                key={`thread-${thread.id}`}
                className={`absolute animate-pulse-subtle ${isEditMode ? 'cursor-default' : 'cursor-pointer'} z-15 transition-transform hover:scale-110`}
                style={{
                  left: `${thread.position.x}%`,
                  top: `${thread.position.y}%`,
                  animationDelay: `${parseInt(thread.id) * 0.1}s`,
                }}
                onClick={() => handleThreadClick(thread.id)}
              >
                <div className="relative group">
                  {/* Main thread button */}
                  <Button
                    variant="outline"
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-white to-gray-50 hover:scale-110 transition-all shadow-lg border-2 relative"
                    style={{
                      borderColor: getCategoryColor(thread.category),
                      background: `linear-gradient(135deg, ${getCategoryColor(thread.category)}20, ${getCategoryColor(thread.category)}10)`,
                    }}
                  >
                    <span className="sr-only">{thread.title}</span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: getCategoryColor(thread.category),
                      }}
                    >
                      <CategoryIcon size={16} className="text-white" />
                    </div>
                  </Button>
                  
                  {/* Message count indicator */}
                  <div 
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm bg-white border-2"
                    style={{ borderColor: getCategoryColor(thread.category) }}
                  >
                    <span 
                      className="text-xs font-bold" 
                      style={{ color: getCategoryColor(thread.category) }}
                    >
                      {thread.totalMessages}
                    </span>
                  </div>
                  
                  {/* Thread title (on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap z-30 transition-opacity duration-200 max-w-64">
                    💬 {thread.title}
                  </div>
                  
                  {/* Chat indicator pulse */}
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ backgroundColor: getCategoryColor(thread.category) }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Compass indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass-effect p-3 rounded-full shadow-lg">
          <Compass className="text-plural-purple w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

export default WorldExplorer;
