/**
 * System Monitoring Page
 * Combines MetricsDashboard and AgentArchitecture for comprehensive system overview
 */

import React from "react";
import Navbar from "@/components/Navbar";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { AgentArchitecture } from "@/components/AgentArchitecture";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SystemMonitoring = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">System Monitoring</h1>
              <p className="text-gray-600">Real-time performance metrics and architecture overview</p>
            </div>
          </div>
        </div>

        {/* Monitoring Tabs */}
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="metrics" className="flex items-center space-x-2">
              <Activity size={16} />
              <span>Performance Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center space-x-2">
              <Zap size={16} />
              <span>Agent Architecture</span>
            </TabsTrigger>
          </TabsList>

          {/* Performance Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <MetricsDashboard />
          </TabsContent>

          {/* Agent Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <AgentArchitecture />
          </TabsContent>
        </Tabs>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-40 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl animate-pulse-subtle pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl animate-pulse-subtle pointer-events-none"></div>
    </div>
  );
};

export default SystemMonitoring;
