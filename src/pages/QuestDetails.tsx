import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { 
  ArrowLeft, 
  Search, 
  Mic, 
  Camera, 
  BookOpen, 
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ChatWindow from "@/components/ChatWindow";

// Quest data types
interface Quest {
  id: string;
  title: string;
  description: string;
  category: "Space Explorer" | "Ocean Voyager" | "Desert Adventurer" | "Forest Ranger";
  difficulty: "easy" | "medium" | "hard";
  image: string;
}

// Mock quest data for demonstration
const quests: Record<string, Quest> = {
  "1": {
    id: "1",
    title: "Journey to Distant Stars",
    description: "Discover the wonders of our solar system and beyond.",
    category: "Space Explorer",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
  },
  "2": {
    id: "2",
    title: "Mysteries of the Deep",
    description: "Explore the ocean depths and meet fascinating sea creatures.",
    category: "Ocean Voyager",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1480926965639-9b5f63a0817b?q=80&w=1000&auto=format&fit=crop",
  },
  "3": {
    id: "3",
    title: "Desert Survival Challenge",
    description: "Learn how plants and animals adapt to harsh desert conditions.",
    category: "Desert Adventurer",
    difficulty: "hard",
    image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1000&auto=format&fit=crop",
  },
  "4": {
    id: "4",
    title: "Forest Ecosystem Expedition",
    description: "Discover the diverse life forms in forest ecosystems.",
    category: "Forest Ranger",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop",
  },
  "5": {
    id: "5",
    title: "Astronomical Wonders",
    description: "Study the planets, stars, and galaxies in our universe.",
    category: "Space Explorer",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1000&auto=format&fit=crop",
  },
  "6": {
    id: "6",
    title: "Coral Reef Adventures",
    description: "Explore the vibrant ecosystems of coral reefs.",
    category: "Ocean Voyager",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1520302519862-3f23158243ef?q=80&w=1000&auto=format&fit=crop",
  },
  "7": {
    id: "7",
    title: "Mountain Peaks Exploration",
    description: "Climb to the highest peaks and learn about mountain formation.",
    category: "Desert Adventurer",
    difficulty: "hard",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
  },
  "8": {
    id: "8",
    title: "Rainforest Canopy Discovery",
    description: "Explore the treetops of dense rainforests.",
    category: "Forest Ranger",
    difficulty: "medium",
    image: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?q=80&w=1000&auto=format&fit=crop",
  },
  "9": {
    id: "9",
    title: "Camping Under the Stars",
    description: "Learn survival skills while enjoying the night sky.",
    category: "Forest Ranger",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1500581276021-a4c88c0ff4bc?q=80&w=1000&auto=format&fit=crop",
  },
  "10": {
    id: "10",
    title: "Cloud Formation Studies",
    description: "Learn how clouds form and what they tell us about weather.",
    category: "Space Explorer",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1505533542167-8c89838bb019?q=80&w=1000&auto=format&fit=crop",
  },
  "11": {
    id: "11",
    title: "Seashell Collection",
    description: "Discover and learn about different types of seashells.",
    category: "Ocean Voyager",
    difficulty: "easy",
    image: "https://images.unsplash.com/photo-1484821582734-6692f7b94bf4?q=80&w=1000&auto=format&fit=crop",
  },
};

// Mock flashcard data
interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    question: "What is the closest star to Earth?",
    answer: "The Sun is the closest star to Earth, about 93 million miles (150 million kilometers) away."
  },
  {
    id: "2",
    question: "How many planets are in our solar system?",
    answer: "There are eight planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune."
  },
  {
    id: "3",
    question: "What is a light year?",
    answer: "A light year is the distance light travels in one year, approximately 5.88 trillion miles (9.46 trillion kilometers)."
  },
];

// Mock chat messages
interface ChatMessage {
  id: string;
  sender: "user" | "guide";
  message: string;
  timestamp: string;
}

const mockChatHistory: ChatMessage[] = [
  {
    id: "1",
    sender: "guide",
    message: "Welcome to the Journey to Distant Stars quest! What would you like to learn about first?",
    timestamp: "10:30 AM"
  },
  {
    id: "2",
    sender: "user",
    message: "Tell me about the planets in our solar system.",
    timestamp: "10:31 AM"
  },
  {
    id: "3",
    sender: "guide",
    message: "Our solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Each has unique characteristics. Which one would you like to explore first?",
    timestamp: "10:31 AM"
  },
  {
    id: "4",
    sender: "user",
    message: "Let's learn about Jupiter.",
    timestamp: "10:32 AM"
  },
  {
    id: "5",
    sender: "guide",
    message: "Jupiter is the largest planet in our solar system! It's a gas giant with a Great Red Spot that's actually a storm that's been raging for hundreds of years. It has 79 known moons, including the four large Galilean moons discovered by Galileo Galilei.",
    timestamp: "10:32 AM"
  }
];

// Function to get category color
const getCategoryColor = (category: Quest["category"]) => {
  switch (category) {
    case "Space Explorer":
      return "#8B5CF6"; // plural-purple
    case "Ocean Voyager":
      return "#0EA5E9"; // plural-blue
    case "Desert Adventurer":
      return "#F97316"; // plural-orange
    case "Forest Ranger":
      return "rgb(52, 199, 89)"; // Apple green
    default:
      return "#8B5CF6";
  }
};

const QuestDetails = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // Get quest data or default to a fallback if not found
  const quest = questId && quests[questId] 
    ? quests[questId] 
    : {
        id: "0",
        title: "Quest Not Found",
        description: "This quest doesn't exist or has been removed.",
        category: "Space Explorer" as const,
        difficulty: "easy" as const,
        image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1000&auto=format&fit=crop",
      };

  const toggleMic = () => {
    setIsMicActive(!isMicActive);
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  const goToNextFlashcard = () => {
    setShowAnswer(false);
    setCurrentFlashcard((prev) => 
      prev === mockFlashcards.length - 1 ? 0 : prev + 1
    );
  };

  const goToPrevFlashcard = () => {
    setShowAnswer(false);
    setCurrentFlashcard((prev) => 
      prev === 0 ? mockFlashcards.length - 1 : prev - 1
    );
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Navbar />
      
      <div className="container mx-auto py-6">
        {/* Back button and title */}
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2" />
            Back to Map
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quest.title}</h1>
            <p className="text-gray-600">{quest.description}</p>
          </div>
        </div>
        
        {/* Main content area with resizable panels */}
        <ResizablePanelGroup 
          direction="horizontal" 
          className="min-h-[80vh] rounded-lg border"
        >
          {/* Chat history panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold flex items-center">
                  <MessageCircle className="mr-2" size={20} />
                  Quest Discussion
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mockChatHistory.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] rounded-xl p-3 ${
                        message.sender === 'user' 
                          ? 'bg-plural-purple text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{message.message}</p>
                      <span className="text-xs opacity-70 block mt-1">{message.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Search bar at bottom */}
              <div className="p-4 bg-white shadow-sm border-t">
                <div className="glass-effect rounded-full flex items-center px-4 py-3 shadow-sm border border-white/30 bg-white/40 backdrop-blur-md">
                  <Search className="text-gray-500 mr-3" size={20} />
                  <Input 
                    placeholder="Ask about this quest..." 
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 text-gray-800"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button
                    variant={isMicActive ? "default" : "ghost"}
                    size="icon"
                    className={`ml-2 rounded-full ${isMicActive ? "bg-plural-blue hover:bg-plural-blue/90" : ""}`}
                    onClick={toggleMic}
                  >
                    <Mic className={isMicActive ? "text-white" : "text-gray-500"} size={20} />
                  </Button>
                  <Button
                    variant={isCameraActive ? "default" : "ghost"}
                    size="icon"
                    className={`ml-2 rounded-full ${isCameraActive ? "bg-plural-blue hover:bg-plural-blue/90" : ""}`}
                    onClick={toggleCamera}
                  >
                    <Camera className={isCameraActive ? "text-white" : "text-gray-500"} size={20} />
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="default" className="ml-2 rounded-full bg-plural-purple hover:bg-plural-purple/90">
                        Guide
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                      <ChatWindow />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Flashcards panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold flex items-center">
                  <BookOpen className="mr-2" size={20} />
                  Learning Flashcards
                </h2>
              </div>
              
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xl">
                  <Card className="w-full">
                    <CardHeader 
                      className="pb-2" 
                      style={{ borderBottom: `4px solid ${getCategoryColor(quest.category)}` }}
                    >
                      <CardTitle className="flex justify-between items-center">
                        <span>Flashcard {currentFlashcard + 1}/{mockFlashcards.length}</span>
                        <div className="text-sm font-normal py-1 px-3 rounded-full" 
                          style={{ 
                            backgroundColor: `${getCategoryColor(quest.category)}20`,
                            color: getCategoryColor(quest.category),
                          }}
                        >
                          {quest.category}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 min-h-[200px] flex flex-col justify-center">
                      <div className="text-lg font-medium mb-4">
                        {mockFlashcards[currentFlashcard].question}
                      </div>
                      {showAnswer && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md border">
                          {mockFlashcards[currentFlashcard].answer}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={goToPrevFlashcard}
                        >
                          <ArrowLeft size={18} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={goToNextFlashcard}
                        >
                          <ArrowRight size={18} />
                        </Button>
                      </div>
                      <Button
                        onClick={toggleAnswer}
                        style={{ backgroundColor: getCategoryColor(quest.category) }}
                        className="hover:opacity-90"
                      >
                        {showAnswer ? "Hide Answer" : "Show Answer"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default QuestDetails;
