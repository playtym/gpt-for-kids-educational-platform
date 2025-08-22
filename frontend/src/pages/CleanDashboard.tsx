import React from "react";
import { useSearchParams } from "react-router-dom";
import { useEducational } from "@/contexts/EducationalContext";
import { UserProvider } from "@/contexts/UserContext";
import { SimpleAgeSelector } from "@/components/SimpleAgeSelector";
import FullScreenChat from "@/components/FullScreenChat";

const CleanDashboard = () => {
  const { ageGroup, isAgeGroupRequired } = useEducational();
  const [searchParams] = useSearchParams();
  const [isAgeGroupModalOpen, setIsAgeGroupModalOpen] = React.useState(false);
  
  // Get thread ID from URL params
  const threadId = searchParams.get('thread');

  // Show age group selector if required and not set
  React.useEffect(() => {
    if (isAgeGroupRequired(window.location.pathname) && !ageGroup) {
      setIsAgeGroupModalOpen(true);
    }
  }, [ageGroup, isAgeGroupRequired]);

  return (
    <UserProvider>
      <div className="h-screen overflow-hidden bg-gray-50">
        {/* Age Group Selection Modal */}
        <SimpleAgeSelector
          isOpen={isAgeGroupModalOpen}
          onClose={() => setIsAgeGroupModalOpen(false)}
          required={!ageGroup}
        />
        
        {/* Full Screen Chat Interface */}
        <FullScreenChat threadId={threadId || undefined} />
      </div>
    </UserProvider>
  );
};

export default CleanDashboard;
