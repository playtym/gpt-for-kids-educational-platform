import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Image as ImageIcon } from 'lucide-react';
import ContentRenderer from '../ContentCards/ContentRenderer';
import ExploreResponseCard from '../cards/ExploreResponseCard';
import LearnResponseCard from '../cards/LearnResponseCard';
import CreateResponseCard from '../cards/CreateResponseCard';
import StudyResponseCard from '../cards/StudyResponseCard';

type ChatMode = 'explore' | 'learn' | 'create' | 'curriculum';
type SocraticMode = 'questioning' | 'guiding' | 'encouraging' | 'challenging';

interface ChatMessage {
  id: string;
  content: any;
  sender: 'user' | 'assistant';
  timestamp: number;
  mode?: ChatMode;
  socraticMode?: SocraticMode;
  metadata?: any;
  attachments?: Array<{
    type: 'image' | 'file';
    name: string;
    url: string;
    size?: number;
  }>;
}

interface MessageListProps {
  messages: ChatMessage[];
  currentMode: ChatMode;
  onFollowUp: (question: string) => void;
  onExploreConnection: (connection: string) => void;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentMode,
  onFollowUp,
  onExploreConnection,
  isLoading
}) => {
  const extractMessageContent = (messageContent: any) => {
    if (typeof messageContent === 'string') {
      return { content: messageContent, metadata: null };
    }
    if (typeof messageContent === 'object' && messageContent) {
      // Handle new structured exploration response format
      if (messageContent.type === 'exploration') {
        return {
          content: messageContent.shortAnswer || 'No content available',
          metadata: {
            shortAnswer: messageContent.shortAnswer,
            followUpQuestions: messageContent.followUpQuestions || [],
            relatedTopics: messageContent.relatedTopics || [],
            relevantImage: messageContent.relevantImage || null,
            ageGroup: messageContent.ageGroup,
            inputType: messageContent.inputType
          }
        };
      }
      // Handle legacy format
      return {
        content: messageContent.content || 'No content available',
        metadata: messageContent.metadata || null
      };
    }
    return { content: 'No content available', metadata: null };
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.sender === 'user') {
      return (
        <div className="flex justify-end mb-4">
          <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
            <div className="text-sm">{message.content}</div>
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs opacity-90">
                    {attachment.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                    <span>{attachment.name}</span>
                    {attachment.size && (
                      <span className="text-xs opacity-75">
                        ({(attachment.size / 1024).toFixed(1)}KB)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs opacity-75 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[90%]">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {message.mode || currentMode}
            </Badge>
            {message.socraticMode && (
              <Badge variant="outline" className="text-xs">
                {message.socraticMode}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              {(() => {
                switch (message.mode || currentMode) {
                  case 'explore':
                    const { content: exploreContent, metadata: exploreMetadata } = extractMessageContent(message.content);
                    return (
                      <ExploreResponseCard
                        shortAnswer={exploreMetadata?.shortAnswer || exploreContent}
                        followUpQuestions={exploreMetadata?.followUpQuestions || ["🤔 What else would you like to discover about this?", "🔗 How does this connect to other things you know?"]}
                        relatedTopics={exploreMetadata?.relatedTopics || []}
                        relevantImage={exploreMetadata?.relevantImage}
                        onFollowUp={onFollowUp}
                        onExploreConnection={onExploreConnection}
                      />
                    );
                  case 'learn':
                    const { content: learnContent, metadata: learnMetadata } = extractMessageContent(message.content);
                    return (
                      <LearnResponseCard
                        content={learnContent}
                        thinkingPrompts={(learnMetadata || message.metadata)?.thinkingPrompts || ["What do you think about this?", "How would you explain this to a friend?"]}
                        nextSteps={(learnMetadata || message.metadata)?.nextSteps || ["Ask a follow-up question", "Practice with examples"]}
                        onThinkingPrompt={onFollowUp}
                        onNextStep={onFollowUp}
                      />
                    );
                  case 'create':
                    const { content: createContent, metadata: createMetadata } = extractMessageContent(message.content);
                    return (
                      <CreateResponseCard
                        content={createContent}
                        inspirationPrompts={(createMetadata || message.metadata)?.inspirationPrompts || ["Continue the story", "Add more details", "Change the perspective"]}
                        nextCreationIdeas={(createMetadata || message.metadata)?.nextCreationIdeas || ["What happens next?", "Describe the setting"]}
                        onInspiration={onFollowUp}
                        onNextCreation={onFollowUp}
                      />
                    );
                  case 'curriculum':
                    const { content: studyContent, metadata: studyMetadata } = extractMessageContent(message.content);
                    return (
                      <StudyResponseCard
                        content={studyContent}
                        practiceQuestions={(studyMetadata || message.metadata)?.practiceQuestions || []}
                        relatedTopics={(studyMetadata || message.metadata)?.relatedTopics || []}
                        onPracticeQuestion={onFollowUp}
                        onRelatedTopic={onExploreConnection}
                      />
                    );
                  default:
                    const { content: defaultContent } = extractMessageContent(message.content);
                    return (
                      <ContentRenderer
                        content={defaultContent}
                        messageType="assistant"
                        mode={message.mode || currentMode}
                      />
                    );
                }
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Start a conversation!</div>
              <div className="text-sm">Ask a question or share what you'd like to explore.</div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {renderMessage(message)}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[90%]">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default MessageList;
