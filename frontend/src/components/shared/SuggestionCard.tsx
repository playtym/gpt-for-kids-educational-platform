import React from 'react';
import { RefreshCw, LucideIcon } from 'lucide-react';

interface SuggestionCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  hoverColor: string;
  hoverBgColor?: string;
  topics: Array<{
    title: string;
    questions: string[];
  }>;
  isLoading: boolean;
  onRefresh: () => void;
  onTopicClick: (question: string, category: string) => void;
  isMobile?: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  title,
  icon: Icon,
  iconColor,
  hoverColor,
  hoverBgColor = '#F2F2F7',
  topics,
  isLoading,
  onRefresh,
  onTopicClick,
  isMobile = false
}) => {
  return (
    <div className="flex flex-col items-center justify-end h-full max-w-2xl mx-auto px-4 pb-4">
      {/* Clean suggestion card */}
      <div 
        className="w-full rounded-xl"
        style={{
          background: 'white',
          border: '1px solid #E5E5EA',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '16px'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: iconColor }} />
            <p 
              className="font-medium"
              style={{ 
                color: '#000000',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontSize: '15px'
              }}
            >
              {title}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg transition-all duration-200 flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              background: isLoading ? '#F2F2F7' : 'transparent',
              border: '1px solid #E5E5EA',
              color: iconColor
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#F2F2F7';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        
        {/* Clean suggestions grid */}
        <div className={isMobile ? "space-y-2" : "grid grid-cols-2 gap-2"}>
          {topics.slice(0, isMobile ? 3 : 4).map((topic) => (
            <div key={topic.title} className={isMobile ? "space-y-1" : "space-y-1"}>
              {topic.questions.slice(0, isMobile ? 1 : 2).map((question, idx) => (
                <button
                  key={idx}
                  className="w-full text-left transition-all duration-200 rounded-lg p-3 text-sm"
                  style={{
                    background: hoverBgColor,
                    border: '1px solid #E5E5EA',
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontSize: '13px',
                    minHeight: isMobile ? '44px' : '36px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => onTopicClick(question, topic.title.toLowerCase())}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = hoverColor;
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = hoverColor;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = hoverBgColor;
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.borderColor = '#E5E5EA';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span 
                    className={isMobile ? "" : "truncate"}
                    style={{
                      display: isMobile ? '-webkit-box' : 'block',
                      WebkitLineClamp: isMobile ? 2 : undefined,
                      WebkitBoxOrient: isMobile ? 'vertical' : undefined,
                      overflow: isMobile ? 'hidden' : 'hidden',
                      textOverflow: isMobile ? 'ellipsis' : 'ellipsis',
                      wordBreak: 'break-word'
                    }}
                  >
                    {question}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;
