/**
 * System Metrics Dashboard Component
 * Displays real-time performance metrics from the educational agent system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { agentService, SystemMetrics, AgentStats } from '@/api/agentService';

interface MetricsDashboardProps {
  className?: string;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const [systemMetrics, socraticStats, creativeStats, assessmentStats, explorationStats] = await Promise.all([
        agentService.getSystemMetrics(),
        agentService.getAgentStats('socratic'),
        agentService.getAgentStats('creative'),
        agentService.getAgentStats('assessment'),
        agentService.getAgentStats('exploration')
      ]);

      if (systemMetrics) {
        setMetrics(systemMetrics);
      }

      const stats: Record<string, AgentStats> = {};
      if (socraticStats) stats.socratic = socraticStats;
      if (creativeStats) stats.creative = creativeStats;
      if (assessmentStats) stats.assessment = assessmentStats;
      if (explorationStats) stats.exploration = explorationStats;
      
      setAgentStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (errorRate: number) => {
    if (errorRate < 5) return 'text-green-600';
    if (errorRate < 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBadge = (errorRate: number) => {
    if (errorRate < 5) return <Badge variant="outline" className="text-green-600 border-green-600">Healthy</Badge>;
    if (errorRate < 15) return <Badge variant="outline" className="text-orange-600 border-orange-600">Warning</Badge>;
    return <Badge variant="outline" className="text-red-600 border-red-600">Error</Badge>;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Metrics
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
    <div className={`space-y-4 ${className}`}>
      {/* System Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              {isAutoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchMetrics}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.metrics.totalRequests}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{formatDuration(metrics.metrics.averageResponseTime)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Error Rate</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.metrics.errorRate)}`}>
                  {metrics.metrics.errorRate.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(metrics.metrics.uptime)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No system metrics available</p>
          )}
          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Agent Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(agentStats).map(([agentName, stats]) => (
              <div key={agentName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{agentName} Agent</h4>
                  {getStatusBadge(stats.errorRate)}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requests</p>
                    <p className="font-semibold">{stats.usage.count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Time</p>
                    <p className="font-semibold">{formatDuration(stats.averageResponseTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className={`font-semibold ${getStatusColor(stats.errorRate)}`}>
                      {stats.successRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(agentStats).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No agent statistics available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsDashboard;
