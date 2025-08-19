
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - replace with actual authentication
    setTimeout(() => {
      setIsLoading(false);
      if (username && password) {
        navigate("/dashboard");
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        toast({
          title: "Login failed",
          description: "Please enter both username and password.",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <img 
            src="/lovable-uploads/fac73e9b-f8bb-4b05-b7dd-b332a47a8dc8.png" 
            alt="Plural Logo" 
            className="h-24 mx-auto mb-4 animate-in animate-in-delay-100" 
          />
          <p className="text-lg text-gray-600 mb-8 animate-in animate-in-delay-200">
            nurture at the point of curiosity
          </p>
        </div>

        <Card className="glass-card p-8 animate-in animate-in-delay-300">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-effect h-12"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-effect h-12"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 transition-all duration-300 bg-gradient-to-r from-plural-blue to-plural-purple hover:shadow-lg hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-gray-500 mt-4 animate-in animate-in-delay-300">
          <span>
            Don't have an account?{" "}
            <a href="#" className="text-plural-blue hover:underline">
              Sign up
            </a>
          </span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-24 h-24 rounded-full bg-gradient-to-r from-plural-purple/30 to-plural-pink/30 blur-xl animate-float opacity-70"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-gradient-to-r from-plural-blue/30 to-plural-purple/30 blur-xl animate-float opacity-70 animation-delay-1000"></div>
    </div>
  );
};

export default Login;
