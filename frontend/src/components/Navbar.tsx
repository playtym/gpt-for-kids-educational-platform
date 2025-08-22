import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import UserSettings from "@/components/UserSettings";

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  
  const brandName = "Plural";

  // Typewriter animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLetterIndex(prev => (prev + 1) % brandName.length);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const renderAnimatedBrand = () => {
    return (
      <span className="font-bold text-2xl">
        {brandName.split('').map((char, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-500 ${
              index === currentLetterIndex 
                ? 'text-blue-600 transform scale-110 animate-pulse' 
                : 'text-gray-800'
            }`}
          >
            {char}
          </span>
        ))}
      </span>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-sm">
      {/* Left side - Animated Brand */}
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        {renderAnimatedBrand()}
      </div>

      {/* Right side - User Menu */}
      <div className="flex items-center space-x-4">
        {currentUser && (
          <div className="flex items-center space-x-2">
            {/* Direct Settings Access - UserSettings has its own Dialog */}
            <UserSettings />

            {/* User Profile Display */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-xl">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {currentUser.avatar || currentUser.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                <span className="text-xs text-gray-500">{currentUser.ageGroup} • {currentUser.grade}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
