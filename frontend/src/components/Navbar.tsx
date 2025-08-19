
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Simulate logout - replace with actual logout logic
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/");
  };

  return (
    <nav className="glass-effect py-3 px-4 md:px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/fac73e9b-f8bb-4b05-b7dd-b332a47a8dc8.png" 
          alt="Plural Logo" 
          className="h-10 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        />
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center space-x-6">
        <Button
          variant="ghost"
          className="hover:bg-transparent hover:text-plural-blue transition-colors"
          onClick={() => navigate("/dashboard")}
        >
          Home
        </Button>
        <Button
          variant="ghost"
          className="hover:bg-transparent hover:text-plural-blue transition-colors"
          onClick={() => navigate("/world")}
        >
          World
        </Button>
        <Button
          variant="ghost"
          className="hover:bg-transparent hover:text-plural-blue transition-colors"
          onClick={() => navigate("/chat")}
        >
          Chat
        </Button>
      </div>

      {/* User Profile & Notifications */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 transition-colors"
        >
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        <Avatar className="cursor-pointer h-8 w-8 hover:ring-2 hover:ring-primary transition-all">
          <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        {/* Mobile menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="glass-effect">
            <div className="flex flex-col space-y-4 pt-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/lovable-uploads/fac73e9b-f8bb-4b05-b7dd-b332a47a8dc8.png" 
                  alt="Plural Logo" 
                  className="h-12"
                />
              </div>
              <Button
                variant="ghost"
                className="justify-start py-6 text-lg"
                onClick={() => {
                  navigate("/dashboard");
                  setIsOpen(false);
                }}
              >
                Home
              </Button>
              <Button
                variant="ghost"
                className="justify-start py-6 text-lg"
                onClick={() => {
                  navigate("/world");
                  setIsOpen(false);
                }}
              >
                World
              </Button>
              <Button
                variant="ghost"
                className="justify-start py-6 text-lg"
                onClick={() => {
                  navigate("/chat");
                  setIsOpen(false);
                }}
              >
                Chat
              </Button>
              <Button
                variant="destructive"
                className="justify-start py-6 text-lg mt-4"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
