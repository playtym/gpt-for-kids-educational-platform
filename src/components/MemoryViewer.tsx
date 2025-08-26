import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Brain, 
  Clock, 
  TrendingUp, 
  User, 
  Target, 
  BookOpen,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { memoryService, ConversationSummary, MemoryEntry } from '@/services/memoryService';
import { useThreads } from '@/contexts/ThreadContext';
import { useToast } from '@/hooks/use-toast';

interface MemoryViewerProps {
  threadId?: string;
}

const MemoryViewer: React.FC<MemoryViewerProps> = ({ threadId }) => {
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getCurrentThread } = useThreads();
  const { toast } = useToast();
  
  const currentThreadId = threadId || getCurrentThread()?.id;

  useEffect(() => {
    if (currentThreadId) {
      loadMemoryData();
    }
  }, [currentThreadId]);

  const loadMemoryData = async () => {
    if (!currentThreadId) return;
    
    setIsLoading(true);
    try {
      const threadSummary = await memoryService.getThreadSummary(currentThreadId);
      setSummary(threadSummary);

      // Get all memories for display
      const memoryContext = await memoryService.getRelevantContext({
        threadId: currentThreadId,
        currentMessage: '',
        limit: 50,
        relevanceThreshold: 0.0 // Get all memories
      });
      setMemories(memoryContext.entries);
    } catch (error) {
      console.error('Failed to load memory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMemories = async () => {
    if (!currentThreadId) return;
    
    try {
      await memoryService.clearThreadMemories(currentThreadId);
      setSummary(null);
      setMemories([]);
      toast({
        title: "Memories Cleared",
        description: "All conversation memories have been cleared for this thread.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear memories.",
        variant: "destructive",
      });
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (importance >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (importance >= 4) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type: MemoryEntry['type']) => {
    switch (type) {
      case 'preference': return <User size={14} />;
      case 'learning_progress': return <TrendingUp size={14} />;
      case 'concept': return <Lightbulb size={14} />;
      case 'fact': return <BookOpen size={14} />;
      case 'question_pattern': return <Target size={14} />;
      default: return <Brain size={14} />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  if (!currentThreadId) {
    return (
      <div className="text-center py-8">
        <Brain className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">No active conversation thread</p>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Brain size={16} />
          Memory
          {memories.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {memories.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="text-purple-600" />
            Conversation Memory
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMemoryData}
                disabled={isLoading}
                className="gap-1"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMemories}
                className="gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 size={14} />
                Clear
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {summary ? (
              <div className="space-y-4">
                {/* Overall Topic */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="text-blue-600" size={20} />
                      Conversation Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Topic:</strong> {summary.overallTopic}
                    </div>
                    <div>
                      <strong>Phase:</strong> 
                      <Badge className="ml-2 capitalize">
                        {summary.conversationFlow.phase}
                      </Badge>
                    </div>
                    <div>
                      <strong>Current Context:</strong> {summary.currentContext}
                    </div>
                    <div>
                      <strong>Next Action:</strong> {summary.conversationFlow.nextSuggestedAction}
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Progress */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="text-green-600" size={20} />
                      Learning Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Questions Asked</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {summary.progressIndicators.questionsAsked}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Concepts Learned</div>
                        <div className="text-2xl font-bold text-green-600">
                          {summary.progressIndicators.conceptsLearned}
                        </div>
                      </div>
                    </div>
                    
                    {summary.progressIndicators.strengthAreas.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Strengths</div>
                        <div className="flex flex-wrap gap-1">
                          {summary.progressIndicators.strengthAreas.slice(0, 3).map((strength, index) => (
                            <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                              {strength.length > 30 ? strength.substring(0, 30) + '...' : strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {summary.progressIndicators.strugglingAreas.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Areas for Support</div>
                        <div className="flex flex-wrap gap-1">
                          {summary.progressIndicators.strugglingAreas.slice(0, 3).map((area, index) => (
                            <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-700">
                              {area.length > 30 ? area.substring(0, 30) + '...' : area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subjects and Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Subjects Discussed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {summary.keySubjects.map((subject, index) => (
                          <Badge key={index} variant="outline">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Learning Preferences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {summary.userPreferences.slice(0, 3).map((preference, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            • {preference.length > 40 ? preference.substring(0, 40) + '...' : preference}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No conversation summary available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="memories">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {memories.length > 0 ? (
                  memories.map((memory) => (
                    <Card key={memory.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="mt-1">
                            {getTypeIcon(memory.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {memory.content}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{memory.category}</span>
                              <span>•</span>
                              <span>{formatDate(memory.timestamp)}</span>
                              <span>•</span>
                              <span>accessed {memory.accessCount}x</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getImportanceColor(memory.importance)}`}
                          >
                            {memory.importance}/10
                          </Badge>
                          {memory.relevanceScore && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(memory.relevanceScore * 100)}% relevant
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No memories recorded yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-4">
              {/* Memory Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memory Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {memories.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(
                        memories.reduce((acc, memory) => {
                          acc[memory.type] = (acc[memory.type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type as MemoryEntry['type'])}
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {memories
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .slice(0, 5)
                      .map((memory) => (
                        <div key={memory.id} className="flex items-center gap-2 text-sm">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-gray-600">
                            {formatDate(memory.timestamp)}
                          </span>
                          <span>-</span>
                          <span className="flex-1 truncate">
                            {memory.content}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryViewer;
