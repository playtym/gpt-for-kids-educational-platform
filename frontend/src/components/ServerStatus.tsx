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
    if (!serverStatus.openai || !serverStatus.anthropic) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!serverStatus.healthy) return 'Server Offline';
    if (!serverStatus.openai || !serverStatus.anthropic) return 'Partial Service';
    return 'All Systems Good';
  };

  const getStatusIcon = () => {
    if (!serverStatus.healthy) return WifiOff;
    if (!serverStatus.openai || !serverStatus.anthropic) return AlertCircle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <StatusIcon 
          size={16} 
          className={`${serverStatus.healthy ? 'text-green-600' : 'text-red-600'}`}
        />
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {/* Age Group Indicator */}
      {ageGroup && (
        <Badge variant="outline" className="text-xs">
          Ages {ageGroup}
        </Badge>
      )}

      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={checkServerHealth}
        className="h-8 w-8 p-0"
        title="Refresh server status"
      >
        <RefreshCw size={14} />
      </Button>

      {/* Detailed Status (for debugging) */}
      {!serverStatus.healthy && (
        <Badge variant="destructive" className="text-xs">
          <Wifi className="w-3 h-3 mr-1" />
          Check Backend
        </Badge>
      )}
    </div>
  );
};
