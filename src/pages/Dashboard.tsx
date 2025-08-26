import React, { useEffect, useState } from "react";
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
  const { currentUser } = useUser();
  const [searchParams] = useSearchParams();
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = React.useState(false);
  
  // Get thread ID from URL params
  const threadId = searchParams.get('thread');

  // Show onboarding if not completed
  React.useEffect(() => {
    if (currentUser && !currentUser.hasCompletedOnboarding) {
      setIsOnboardingModalOpen(true);
    } else {
      setIsOnboardingModalOpen(false);
    }
  }, [currentUser]);

  const handleOnboardingClose = () => {
    setIsOnboardingModalOpen(false);
  };

  return (
    <div className="min-h-screen">
      {/* Desktop/Tablet: Show full navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      {/* Global Onboarding Modal */}
      <GlobalOnboarding
        isOpen={isOnboardingModalOpen}
        onClose={handleOnboardingClose}
      />
      
      {/* Desktop/Tablet: Clean Status Bar */}
      <div 
        className="hidden md:block px-6 py-3"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E5EA'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <ServerStatus />
        </div>
      </div>

      {/* Desktop/Tablet Layout with Clean Cards */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex h-[calc(100vh-200px)] gap-4">
            {/* Left Sidebar - Clean Card Style */}
            <div className="w-80 flex-shrink-0">
              <div 
                className="h-full rounded-2xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5EA',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <EnhancedThreadsSidebar />
              </div>
            </div>
            
            {/* Main Chat Interface - Clean Card Style */}
            <div className="flex-1">
              <div 
                className="h-full rounded-2xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5EA',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <UnifiedChatInterface className="h-full" threadId={threadId || undefined} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout - Full Screen with Safe Areas */}
      <div className="md:hidden h-screen bg-white overflow-hidden flex flex-col">
        <UnifiedChatInterface 
          className="flex-1" 
          threadId={threadId || undefined} 
          isMobile={true}
        />
      </div>
    </div>
  );
};

export default Dashboard;
