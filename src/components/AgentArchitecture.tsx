/**
 * Agent Architecture Visualization Component
 * Shows the new agent-based architecture and system status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles, 
  MessageCircle, 
  Search, 
  Shield, 
  Activity,
  Zap,
  Database,
  Network,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { agentService } from '@/api/agentService';

interface AgentArchitectureProps {
  className?: string;
}

export const AgentArchitecture: React.FC<AgentArchitectureProps> = ({ className }) => {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const health = await agentService.checkHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Failed to check system health:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const agents = [
    {
      name: 'Socratic Learning Agent',
      icon: Brain,
      description: 'Guides learning through Socratic dialogue and deep exploration',
      capabilities: ['Question-based learning', 'Deep-dive exploration', 'Answer-first mode'],
      color: 'bg-purple-500'
    },
    {
      name: 'Creative Content Agent',
      icon: Sparkles,
      description: 'Generates stories, creative writing prompts, and imaginative content',
      capabilities: ['Story generation', 'Creative prompts', 'Poetry creation'],
      color: 'bg-purple-500'
    },
    {
      name: 'Assessment Agent',
      icon: MessageCircle,
      description: 'Provides feedback, generates questions, and assesses understanding',
      capabilities: ['Constructive feedback', 'Question generation', 'Understanding assessment'],
      color: 'bg-green-500'
    },
    {
      name: 'Exploration Agent',
      icon: Search,
      description: 'Facilitates discovery, describes images, and explores topics',
      capabilities: ['Topic exploration', 'Image description', 'Cultural discovery'],
      color: 'bg-blue-500'
    }
  ];

  const systemComponents = [
    {
      name: 'Content Safety Manager',
      icon: Shield,
      description: 'Dual AI provider safety validation',
      status: systemHealth?.agents?.status === 'healthy' ? 'active' : 'unknown'
    },
    {
      name: 'Agent Manager',
      icon: Network,
      description: 'Coordinates all educational agents',
      status: systemHealth?.agents?.status === 'healthy' ? 'active' : 'unknown'
    },
    {
      name: 'Performance Monitor',
      icon: Activity,
      description: 'Real-time metrics and monitoring',
      status: systemHealth?.status === 'healthy' ? 'active' : 'unknown'
    },
    {
      name: 'Enhanced Logger',
      icon: Database,
      description: 'Structured logging with context tracking',
      status: systemHealth ? 'active' : 'unknown'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Warning</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Agent Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Agent-Based Architecture v2.0
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Architecture Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Modular and scalable design</li>
                <li>• Specialized agents for different tasks</li>
                <li>• Enhanced safety validation</li>
                <li>• Comprehensive monitoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">System Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemHealth?.status === 'healthy' ? 'active' : 'unknown')}
                  <span className="text-sm">Overall System</span>
                  {getStatusBadge(systemHealth?.status === 'healthy' ? 'active' : 'unknown')}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemHealth?.apiConnections?.openai ? 'active' : 'unknown')}
                  <span className="text-sm">OpenAI Connection</span>
                  {getStatusBadge(systemHealth?.apiConnections?.openai ? 'active' : 'unknown')}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemHealth?.apiConnections?.anthropic ? 'active' : 'unknown')}
                  <span className="text-sm">Anthropic Connection</span>
                  {getStatusBadge(systemHealth?.apiConnections?.anthropic ? 'active' : 'unknown')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educational Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Educational Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent, index) => {
              const IconComponent = agent.icon;
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${agent.color}`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{agent.name}</h4>
                      {getStatusBadge('active')}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Capabilities:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {agent.capabilities.map((capability, capIndex) => (
                        <li key={capIndex}>• {capability}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemComponents.map((component, index) => {
              const IconComponent = component.icon;
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-blue-500" />
                      <h4 className="font-semibold text-sm">{component.name}</h4>
                    </div>
                    {getStatusIcon(component.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                  <div className="flex justify-end">
                    {getStatusBadge(component.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentArchitecture;
