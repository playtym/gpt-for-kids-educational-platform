
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EducationalProvider } from "@/contexts/EducationalContext";
import { ThreadProvider } from "@/contexts/ThreadContext";
import { UserProvider } from "@/contexts/UserContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <EducationalProvider>
            <ThreadProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ThreadProvider>
          </EducationalProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
