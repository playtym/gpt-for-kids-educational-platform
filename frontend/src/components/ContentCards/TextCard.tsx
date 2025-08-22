import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Brain, BookOpen, Search, Sparkles } from 'lucide-react';

interface TextCardProps {
  content: string;
  mode: string;
  timestamp: Date;
  isUser?: boolean;
}

const modeConfig = {
  explore: { icon: Search, color: 'bg-blue-500', label: 'Explorer' },
  learn: { icon: Brain, color: 'bg-purple-500', label: 'Learner' },
  create: { icon: BookOpen, color: 'bg-green-500', label: 'Creator' },
  curriculum: { icon: Sparkles, color: 'bg-indigo-500', label: 'Student' }
};

const TextCard: React.FC<TextCardProps> = ({ content, mode, timestamp, isUser = false }) => {
  const config = modeConfig[mode as keyof typeof modeConfig] || modeConfig.explore;
  const Icon = config.icon;

  // Parse content for basic markdown-like formatting
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <Card className={`max-w-4xl transition-all duration-300 hover:shadow-md ${
      isUser 
        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' 
        : 'bg-white border-gray-200'
    }`}>
      <CardContent className="p-4 md:p-6">
        {!isUser && (
          <div className="flex items-center space-x-2 mb-3">
            <div className={`p-1.5 rounded-lg ${config.color} text-white`}>
              <Icon size={14} />
            </div>
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            <span className="text-xs text-gray-500">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        <div 
          className={`prose max-w-none ${isUser ? 'text-blue-900' : 'text-gray-800'}`}
          dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />
        
        {isUser && (
          <div className="flex justify-end mt-2">
            <span className="text-xs text-gray-500">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextCard;
