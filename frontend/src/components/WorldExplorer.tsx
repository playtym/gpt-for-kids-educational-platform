
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  Move
} from "lucide-react";

// Quest type definition
interface Quest {
  id: string;
  title: string;
  description: string;
  category: "Space Explorer" | "Ocean Voyager" | "Desert Adventurer" | "Forest Ranger";
  difficulty: "easy" | "medium" | "hard";
  image: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
}

const quests: Quest[] = [
  {
    id: "1",
    title: "Journey to Distant Stars",
    description: "Discover the wonders of our solar system and beyond.",
    category: "Space Explorer",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
    icon: <Rocket size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "2",
    title: "Mysteries of the Deep",
    description: "Explore the ocean depths and meet fascinating sea creatures.",
    category: "Ocean Voyager",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1480926965639-9b5f63a0817b?q=80&w=1000&auto=format&fit=crop",
    icon: <Waves size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "3",
    title: "Desert Survival Challenge",
    description: "Learn how plants and animals adapt to harsh desert conditions.",
    category: "Desert Adventurer",
    difficulty: "hard",
    image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1000&auto=format&fit=crop",
    icon: <Mountain size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "4",
    title: "Forest Ecosystem Expedition",
    description: "Discover the diverse life forms in forest ecosystems.",
    category: "Forest Ranger",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop",
    icon: <Trees size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "5",
    title: "Astronomical Wonders",
    description: "Study the planets, stars, and galaxies in our universe.",
    category: "Space Explorer",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1000&auto=format&fit=crop",
    icon: <Stars size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "6",
    title: "Coral Reef Adventures",
    description: "Explore the vibrant ecosystems of coral reefs.",
    category: "Ocean Voyager",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1520302519862-3f23158243ef?q=80&w=1000&auto=format&fit=crop",
    icon: <Fish size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "7",
    title: "Mountain Peaks Exploration",
    description: "Climb to the highest peaks and learn about mountain formation.",
    category: "Desert Adventurer",
    difficulty: "hard",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
    icon: <Mountain size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "8",
    title: "Rainforest Canopy Discovery",
    description: "Explore the treetops of dense rainforests.",
    category: "Forest Ranger",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?q=80&w=1000&auto=format&fit=crop",
    icon: <Sparkles size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "9",
    title: "Camping Under the Stars",
    description: "Learn survival skills while enjoying the night sky.",
    category: "Forest Ranger",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1500581276021-a4c88c0ff4bc?q=80&w=1000&auto=format&fit=crop",
    icon: <Tent size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "10",
    title: "Cloud Formation Studies",
    description: "Learn how clouds form and what they tell us about weather.",
    category: "Space Explorer",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1505533542167-8c89838bb019?q=80&w=1000&auto=format&fit=crop",
    icon: <Cloud size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
  {
    id: "11",
    title: "Seashell Collection",
    description: "Discover and learn about different types of seashells.",
    category: "Ocean Voyager",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1484821582734-6692f7b94bf4?q=80&w=1000&auto=format&fit=crop",
    icon: <Shell size={20} />,
    position: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 },
  },
];

const getCategoryColor = (category: Quest["category"]) => {
  switch (category) {
    case "Space Explorer":
      return "#8B5CF6"; // plural-purple
    case "Ocean Voyager":
      return "#0EA5E9"; // plural-blue
    case "Desert Adventurer":
      return "#F97316"; // plural-orange
    case "Forest Ranger":
      return "#10B981"; // green
    default:
      return "#8B5CF6";
  }
};

const getDifficultyLevel = (difficulty: Quest["difficulty"]) => {
  switch (difficulty) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
    default:
      return 1;
  }
};

const WorldExplorer = () => {
  const [visibleQuests, setVisibleQuests] = useState<string[]>(quests.map(quest => quest.id));
  const [savedQuests, setSavedQuests] = useState<string[]>([]);
  const [questPositions, setQuestPositions] = useState<Record<string, { x: number; y: number }>>(
    quests.reduce((acc, quest) => {
      acc[quest.id] = quest.position;
      return acc;
    }, {} as Record<string, { x: number; y: number }>)
  );
  const [draggedQuest, setDraggedQuest] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const dismissQuest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleQuests(visibleQuests.filter(questId => questId !== id));
    toast({
      title: "Quest Dismissed",
      description: "You've dismissed this quest from your map.",
    });
  };

  const toggleSaveQuest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedQuests.includes(id)) {
      setSavedQuests(savedQuests.filter(questId => questId !== id));
      toast({
        title: "Quest Unsaved",
        description: "Quest removed from your saved collection.",
      });
    } else {
      setSavedQuests([...savedQuests, id]);
      toast({
        title: "Quest Saved",
        description: "Quest added to your saved collection!",
      });
    }
  };

  const handleDragStart = (id: string, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggedQuest(id);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggedQuest || !isEditMode || !mapRef.current) return;
    
    const mapRect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - mapRect.left) / mapRect.width) * 100;
    const y = ((e.clientY - mapRect.top) / mapRect.height) * 100;
    
    // Keep quest inside map boundaries
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));
    
    setQuestPositions(prev => ({
      ...prev,
      [draggedQuest]: { x: boundedX, y: boundedY }
    }));
  };

  const handleDragEnd = () => {
    setDraggedQuest(null);
    if (isEditMode) {
      toast({
        title: "Quest Repositioned",
        description: "Your quest has been moved to a new location!",
      });
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      toast({
        title: "Edit Mode Enabled",
        description: "Drag quests to reposition them on your map!",
      });
    } else {
      toast({
        title: "Edit Mode Disabled",
        description: "Your quest map has been saved.",
      });
    }
  };

  const handleQuestClick = (questId: string) => {
    if (!isEditMode) {
      navigate(`/quest/${questId}`);
    }
  };

  return (
    <div 
      className="h-full w-full relative overflow-hidden"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
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
        {isEditMode ? "Done Arranging" : "Arrange Quests"}
      </Button>
      
      {/* Quest markers */}
      <div className="absolute inset-0 z-10">
        {quests
          .filter(quest => visibleQuests.includes(quest.id))
          .map((quest) => (
          <div
            key={quest.id}
            className={`absolute animate-float ${isEditMode ? 'cursor-move' : 'cursor-pointer'} ${draggedQuest === quest.id ? 'z-30' : 'z-20'}`}
            style={{
              left: `${questPositions[quest.id]?.x || quest.position.x}%`,
              top: `${questPositions[quest.id]?.y || quest.position.y}%`,
              animationDelay: `${parseInt(quest.id) * 0.2}s`,
              transition: draggedQuest === quest.id ? 'none' : 'all 0.3s ease-out',
            }}
            onMouseDown={(e) => handleDragStart(quest.id, e)}
            onClick={() => handleQuestClick(quest.id)}
          >
            <div className="relative group">
              {/* Main quest button */}
              <Button
                variant="outline"
                className={`w-12 h-12 rounded-full flex items-center justify-center bg-white hover:bg-white hover:scale-110 transition-all shadow-md border-2 relative ${isEditMode ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                  borderColor: getCategoryColor(quest.category),
                  // Fix the TypeScript error by setting the ring color using CSS custom property
                  ...(isEditMode && { "--ring-color": getCategoryColor(quest.category) } as any),
                }}
              >
                <span className="sr-only">{quest.title}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: getCategoryColor(quest.category),
                  }}
                >
                  <span className="text-white">{quest.icon}</span>
                </div>
              </Button>
              
              {/* Level indicator (numerical) */}
              <div 
                className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm bg-white/90 border-2 backdrop-blur-sm"
                style={{ borderColor: getCategoryColor(quest.category) }}
              >
                <span 
                  className="text-xs font-bold" 
                  style={{ color: getCategoryColor(quest.category) }}
                >
                  {getDifficultyLevel(quest.difficulty)}
                </span>
              </div>
              
              {/* Quest name (always visible) */}
              <div 
                className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-lg whitespace-nowrap z-10"
                style={{ borderLeft: `3px solid ${getCategoryColor(quest.category)}` }}
              >
                {quest.title}
              </div>
              
              {/* Action buttons (dismiss/save) on hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute -right-10 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 transition-opacity duration-200 z-20">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-red-50"
                  onClick={(e) => dismissQuest(quest.id, e)}
                >
                  <X size={14} className="text-red-500" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full w-8 h-8 bg-white/80 backdrop-blur-sm ${savedQuests.includes(quest.id) ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                  onClick={(e) => toggleSaveQuest(quest.id, e)}
                >
                  <Bookmark 
                    size={14} 
                    className={savedQuests.includes(quest.id) ? "text-plural-blue fill-plural-blue" : "text-gray-500"} 
                  />
                </Button>
              </div>
            </div>
          </div>
        ))}
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
