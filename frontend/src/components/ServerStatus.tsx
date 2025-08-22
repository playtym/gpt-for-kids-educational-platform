import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEducational } from '@/contexts/EducationalContext';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ServerStatusProps {
  className?: string;
}

export const ServerStatus: React.FC<ServerStatusProps> = ({ className }) => {
  const { serverStatus, checkServerHealth, ageGroup } = useEducational();

  const getStatusColor = () => {
    if (!serverStatus.healthy) return 'bg-red-500';
    if (!serverStatus.openai || !serverStatus.anthropic) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusText = () => {
    if (!serverStatus.healthy) return 'System Offline';
    if (!serverStatus.openai || !serverStatus.anthropic) return 'Limited Services';
    return 'All Systems Operational';
  };

  const getStatusIcon = () => {
    if (!serverStatus.healthy) return WifiOff;
    if (!serverStatus.openai || !serverStatus.anthropic) return AlertCircle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${serverStatus.healthy ? 'animate-pulse' : ''}`}></div>
            <StatusIcon 
              size={16} 
              className={`${serverStatus.healthy ? 'text-emerald-600' : 'text-red-600'}`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        </div>

        {/* Age Group Indicator */}
        {ageGroup && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
            Ages {ageGroup}
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkServerHealth}
          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
          title="Refresh server status"
        >
          <RefreshCw size={14} className="text-gray-500" />
        </Button>

        {/* Detailed Status (for issues) */}
        {!serverStatus.healthy && (
          <Badge variant="destructive" className="text-xs">
            <Wifi className="w-3 h-3 mr-1" />
            Check Connection
          </Badge>
        )}
      </div>
    </div>
  );
};
