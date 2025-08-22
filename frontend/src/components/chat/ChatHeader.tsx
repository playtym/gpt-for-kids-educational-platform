import React from 'react';
import { Search, BookOpen, Brain, MessageCircle, Plus, Trash2, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import GuideDialog from '@/components/GuideDialog';

type ChatMode = 'explore' | 'learn' | 'create' | 'curriculum';

interface ModeConfig {
  icon: React.ComponentType<any>;
  label: string;
  placeholder: string;
  color: string;
  description: string;
  gradient: string;
}

const modeConfig: Record<ChatMode, ModeConfig> = {
  explore: {
    icon: Search,
    label: 'Explore',
    placeholder: 'Ask about anything you want to discover...',
    color: 'bg-blue-500',
    description: 'General exploration and discovery',
    gradient: 'from-blue-500 to-blue-600'
  },
  learn: {
    icon: BookOpen,
    label: 'Learn',
    placeholder: 'What would you like to learn about today?',
    color: 'bg-green-500',
    description: 'Structured learning and explanations',
    gradient: 'from-green-500 to-green-600'
  },
  create: {
    icon: Brain,
    label: 'Create',
    placeholder: 'Let\'s create something amazing together...',
    color: 'bg-purple-500',
    description: 'Creative writing and content generation',
    gradient: 'from-purple-500 to-purple-600'
  },
  curriculum: {
    icon: MessageCircle,
    label: 'Study',
    placeholder: 'Ask questions about your school subjects...',
    color: 'bg-orange-500',
    description: 'Curriculum-based learning and study support',
    gradient: 'from-orange-500 to-orange-600'
  }
};

interface ChatHeaderProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onNewThread: () => void;
  onDeleteThread: () => void;
  onClearThread: () => void;
  canDeleteThread: boolean;
  hasMessages: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentMode,
  onModeChange,
  onNewThread,
  onDeleteThread,
  onClearThread,
  canDeleteThread,
  hasMessages
}) => {
  const currentConfig = modeConfig[currentMode];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        {/* Mode Selector */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentConfig.color}`} />
                <CurrentIcon size={16} />
                <span className="font-medium">{currentConfig.label}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {Object.entries(modeConfig).map(([mode, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => onModeChange(mode as ChatMode)}
                    className="flex items-center space-x-3 p-3"
                  >
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <Icon size={16} />
                    <div className="flex-1">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="outline" className="text-xs">
            {currentConfig.description}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewThread}
              >
                <Plus size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start new conversation</TooltipContent>
          </Tooltip>

          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearThread}
                >
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear conversation</TooltipContent>
            </Tooltip>
          )}

          {canDeleteThread && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteThread}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete conversation</TooltipContent>
            </Tooltip>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <span className="text-sm">?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <GuideDialog onClose={() => {}} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
