
import React from "react";
import Navbar from "@/components/Navbar";
import UnifiedChatInterface from "@/components/UnifiedChatInterface";
import EnhancedThreadsSidebar from "@/components/EnhancedThreadsSidebar";
import GlobalOnboarding from "@/components/GlobalOnboarding";
import { ServerStatus } from "@/components/ServerStatus";
import { useEducational } from "@/contexts/EducationalContext";
import { useUser } from "@/contexts/UserContext";
import { useSearchParams } from "react-router-dom";
import GuideDialog from "@/components/GuideDialog";

const Dashboard = () => {
  const { ageGroup, isAgeGroupRequired } = useEducational();
  const { currentUser, isOnboardingComplete } = useUser();
  const [searchParams] = useSearchParams();
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = React.useState(false);
  
  // Get thread ID from URL params
  const threadId = searchParams.get('thread');

  // Show onboarding if not completed
  React.useEffect(() => {
    if (!isOnboardingComplete()) {
      setIsOnboardingModalOpen(true);
    }
  }, [isOnboardingComplete]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Global Onboarding Modal */}
      <GlobalOnboarding
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
      
      {/* Server Status Bar - More prominent and professional */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <ServerStatus />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pt-6">
        {/* Desktop/Tablet Layout with Sidebar */}
        <div className="hidden md:flex h-[calc(100vh-180px)] gap-6">
          {/* Left Sidebar - Enhanced Threads */}
          <div className="w-80 flex-shrink-0">
            <EnhancedThreadsSidebar />
          </div>
          
          {/* Main Chat Interface */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <UnifiedChatInterface className="h-full" threadId={threadId || undefined} />
          </div>
        </div>
        
        {/* Mobile Layout - Full Width with Hamburger Menu */}
        <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-160px)] overflow-hidden">
          <UnifiedChatInterface className="h-full" threadId={threadId || undefined} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
