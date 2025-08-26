import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import UserSettings from "@/components/UserSettings";

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, signOut } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <>
      <nav 
        className="sticky top-0 z-50 px-6"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E5EA',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <span 
            className="text-3xl font-bold"
            style={{
              fontFamily: '"feather", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '32px',
              fontWeight: '700',
              color: '#58A700',
              letterSpacing: '-0.5px'
            }}
          >
            Plural
          </span>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback 
                      style={{
                        background: '#58A700',
                        color: 'white',
                        fontFamily: '"feather", sans-serif',
                        fontWeight: '600',
                        fontSize: '16px'
                      }}
                    >
                      {currentUser.avatar || currentUser.name?.charAt(0)?.toUpperCase() || <User size={20} />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.grade}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
      {currentUser && (
        <UserSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={currentUser}
        />
      )}
    </>
  );
};

export default Navbar;
