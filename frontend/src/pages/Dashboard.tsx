
import React from "react";
import Navbar from "@/components/Navbar";
import WorldExplorer from "@/components/WorldExplorer";
import { AgeGroupSelector } from "@/components/AgeGroupSelector";
import { ServerStatus } from "@/components/ServerStatus";
import { SocraticLearningTool } from "@/components/SocraticLearningTool";
import { StoryGenerationTool } from "@/components/StoryGenerationTool";
import { FeedbackTool } from "@/components/FeedbackTool";
import { QuestionGeneratorTool } from "@/components/QuestionGeneratorTool";
import { useEducational } from "@/contexts/EducationalContext";
import { Search, Mic, Camera, BookOpen, Brain, Users, MessageCircle, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuideDialog from "@/components/GuideDialog";

const Dashboard = () => {
  const { ageGroup, isAgeGroupRequired } = useEducational();
  const [isMicActive, setIsMicActive] = React.useState(false);
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [isAgeGroupModalOpen, setIsAgeGroupModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("explore");

  // Show age group selector if required and not set
  React.useEffect(() => {
    if (isAgeGroupRequired(window.location.pathname) && !ageGroup) {
      setIsAgeGroupModalOpen(true);
    }
  }, [ageGroup, isAgeGroupRequired]);

  const toggleMic = () => {
    setIsMicActive(!isMicActive);
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Navbar />
      
      {/* Age Group Selection Modal */}
      <AgeGroupSelector
        isOpen={isAgeGroupModalOpen}
        onClose={() => setIsAgeGroupModalOpen(false)}
        required={!ageGroup}
      />
      
      {/* Server Status Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <ServerStatus />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAgeGroupModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Users size={16} />
            <span>{ageGroup ? `Ages ${ageGroup}` : 'Select Age'}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="explore" className="flex items-center space-x-2">
              <Search size={16} />
              <span>Explore</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center space-x-2">
              <Brain size={16} />
              <span>Learn</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <BookOpen size={16} />
              <span>Create</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center space-x-2">
              <MessageCircle size={16} />
              <span>Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center space-x-2">
              <HelpCircle size={16} />
              <span>Questions</span>
            </TabsTrigger>
          </TabsList>

          {/* Explore Tab - Original Adventure Map */}
          <TabsContent value="explore" className="space-y-4">
            <div className="h-[calc(100vh-300px)] relative">
              <WorldExplorer />
              
              {/* Floating search bar */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-xl">
                <div className="glass-effect rounded-full flex items-center px-4 py-3 shadow-lg border border-white/30 bg-white/40 backdrop-blur-md">
                  <Search className="text-gray-500 mr-3" size={20} />
                  <Input 
                    placeholder="Ask your guide about adventures..." 
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 text-gray-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="ml-2 rounded-full bg-plural-purple hover:bg-plural-purple/90">
                        Guide
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-transparent border-0 shadow-none">
                      <GuideDialog onClose={() => setIsGuideOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Learn Tab - Socratic Learning */}
          <TabsContent value="learn" className="space-y-6">
            <SocraticLearningTool />
          </TabsContent>

          {/* Create Tab - Story Generation */}
          <TabsContent value="create" className="space-y-6">
            <StoryGenerationTool />
          </TabsContent>

          {/* Feedback Tab - Constructive Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <FeedbackTool />
          </TabsContent>

          {/* Questions Tab - Question Generator */}
          <TabsContent value="questions" className="space-y-6">
            <QuestionGeneratorTool />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Decorative elements */}
      <div className="fixed top-40 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-plural-blue/10 to-plural-purple/10 blur-3xl animate-pulse-subtle"></div>
      <div className="fixed bottom-20 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-plural-purple/10 to-plural-pink/10 blur-3xl animate-pulse-subtle"></div>
    </div>
  );
};

export default Dashboard;
