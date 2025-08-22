// Memory service for maintaining conversation context across messages
// Similar to Mem0 architecture but customized for our educational platform

export interface MemoryEntry {
  id: string;
  threadId: string;
  timestamp: Date;
  type: 'fact' | 'preference' | 'context' | 'learning_progress' | 'concept' | 'question_pattern';
  content: string;
  importance: number; // 0-10 scale
  category: string; // subject, personal, learning_style, etc.
  metadata: {
    ageGroup?: string;
    subject?: string;
    chapter?: string;
    mode?: string;
    board?: string;
    grade?: string;
    difficulty?: string;
    concepts?: string[];
    skills?: string[];
    [key: string]: any;
  };
  embedding?: number[]; // For semantic similarity (future enhancement)
  lastAccessed: Date;
  accessCount: number;
  relevanceScore?: number; // Dynamic score for current context
}

export interface ConversationSummary {
  threadId: string;
  overallTopic: string;
  keySubjects: string[];
  learningObjectives: string[];
  conceptsCovered: string[];
  userPreferences: string[];
  currentContext: string;
  progressIndicators: {
    strengthAreas: string[];
    strugglingAreas: string[];
    questionsAsked: number;
    conceptsLearned: number;
  };
  conversationFlow: {
    phase: 'introduction' | 'exploration' | 'practice' | 'assessment' | 'review';
    nextSuggestedAction: string;
  };
  lastUpdated: Date;
}

export interface MemoryQuery {
  threadId: string;
  currentMessage: string;
  context?: {
    mode?: string;
    subject?: string;
    ageGroup?: string;
    board?: string;
    grade?: string;
  };
  limit?: number;
  relevanceThreshold?: number;
}

export interface MemorySearchResult {
  entries: MemoryEntry[];
  summary: ConversationSummary;
  contextPrompt: string;
}

class MemoryService {
  private memories: Map<string, MemoryEntry[]> = new Map(); // threadId -> memories
  private summaries: Map<string, ConversationSummary> = new Map(); // threadId -> summary
  private maxMemoriesPerThread = 100;
  private memoryRetentionDays = 30;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a new memory entry to a thread
   */
  async addMemory(memory: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>): Promise<void> {
    const memoryEntry: MemoryEntry = {
      ...memory,
      id: this.generateId(),
      timestamp: new Date(),
      lastAccessed: new Date(),
      accessCount: 1
    };

    const threadMemories = this.memories.get(memory.threadId) || [];
    threadMemories.push(memoryEntry);

    // Keep only recent and important memories
    this.pruneMemories(threadMemories);
    this.memories.set(memory.threadId, threadMemories);

    // Update conversation summary
    await this.updateConversationSummary(memory.threadId);
    
    // Persist to storage
    this.saveToStorage();
  }

  /**
   * Extract and store relevant information from a conversation message
   */
  async processMessage(
    threadId: string,
    message: string,
    messageType: 'user' | 'assistant',
    context: {
      mode?: string;
      subject?: string;
      ageGroup?: string;
      board?: string;
      grade?: string;
      [key: string]: any;
    } = {}
  ): Promise<void> {
    const extractedMemories = await this.extractMemoriesFromMessage(
      threadId,
      message,
      messageType,
      context
    );

    for (const memory of extractedMemories) {
      await this.addMemory(memory);
    }
  }

  /**
   * Retrieve relevant memories and context for current conversation
   */
  async getRelevantContext(query: MemoryQuery): Promise<MemorySearchResult> {
    const threadMemories = this.memories.get(query.threadId) || [];
    const summary = this.summaries.get(query.threadId) || this.createEmptySummary(query.threadId);

    // Score and rank memories by relevance
    const scoredMemories = threadMemories.map(memory => ({
      ...memory,
      relevanceScore: this.calculateRelevanceScore(memory, query)
    }));

    // Filter and sort by relevance
    const relevantMemories = scoredMemories
      .filter(m => m.relevanceScore >= (query.relevanceThreshold || 0.3))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, query.limit || 10);

    // Update access counts
    relevantMemories.forEach(memory => {
      memory.lastAccessed = new Date();
      memory.accessCount++;
    });

    const contextPrompt = this.generateContextPrompt(relevantMemories, summary, query);

    return {
      entries: relevantMemories,
      summary,
      contextPrompt
    };
  }

  /**
   * Generate a context prompt for the AI agent
   */
  private generateContextPrompt(
    memories: MemoryEntry[],
    summary: ConversationSummary,
    query: MemoryQuery
  ): string {
    if (memories.length === 0) {
      return "This is the beginning of a new conversation.";
    }

    let prompt = "CONVERSATION CONTEXT:\n\n";

    // Overall conversation summary
    prompt += `OVERALL TOPIC: ${summary.overallTopic}\n`;
    prompt += `CURRENT PHASE: ${summary.conversationFlow.phase}\n`;
    prompt += `SUBJECTS DISCUSSED: ${summary.keySubjects.join(', ')}\n`;
    prompt += `CONCEPTS COVERED: ${summary.conceptsCovered.join(', ')}\n\n`;

    // Learning progress
    if (summary.progressIndicators.strengthAreas.length > 0) {
      prompt += `STUDENT STRENGTHS: ${summary.progressIndicators.strengthAreas.join(', ')}\n`;
    }
    if (summary.progressIndicators.strugglingAreas.length > 0) {
      prompt += `AREAS NEEDING SUPPORT: ${summary.progressIndicators.strugglingAreas.join(', ')}\n`;
    }

    // User preferences and patterns
    if (summary.userPreferences.length > 0) {
      prompt += `USER PREFERENCES: ${summary.userPreferences.join(', ')}\n`;
    }

    prompt += "\nRECENT CONVERSATION MEMORIES:\n";

    // Add relevant memories by category
    const categorizedMemories = this.categorizeMemories(memories);
    
    Object.entries(categorizedMemories).forEach(([category, categoryMemories]) => {
      if (categoryMemories.length > 0) {
        prompt += `\n${category.toUpperCase()}:\n`;
        categoryMemories.forEach(memory => {
          prompt += `- ${memory.content}\n`;
        });
      }
    });

    // Current context and next steps
    prompt += `\nCURRENT CONTEXT: ${summary.currentContext}\n`;
    prompt += `SUGGESTED NEXT ACTION: ${summary.conversationFlow.nextSuggestedAction}\n\n`;

    prompt += "INSTRUCTION: Use this context to provide personalized, continuous conversation that builds on previous interactions. Reference past discussions naturally and adapt your teaching approach based on the student's demonstrated preferences and progress.";

    return prompt;
  }

  /**
   * Extract memories from a conversation message using pattern matching and heuristics
   */
  private async extractMemoriesFromMessage(
    threadId: string,
    message: string,
    messageType: 'user' | 'assistant',
    context: any
  ): Promise<Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[]> {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];

    if (messageType === 'user') {
      // Extract user preferences and learning patterns
      memories.push(...this.extractUserPreferences(threadId, message, context));
      memories.push(...this.extractLearningProgress(threadId, message, context));
      memories.push(...this.extractQuestionPatterns(threadId, message, context));
    } else {
      // Extract teaching concepts and explanations
      memories.push(...this.extractConceptsExplained(threadId, message, context));
      memories.push(...this.extractFactsShared(threadId, message, context));
    }

    // Extract general contextual information
    memories.push(...this.extractContextualInfo(threadId, message, messageType, context));

    return memories;
  }

  private extractUserPreferences(threadId: string, message: string, context: any): Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];
    const lowerMessage = message.toLowerCase();

    // Learning style preferences
    if (lowerMessage.includes('visual') || lowerMessage.includes('picture') || lowerMessage.includes('diagram')) {
      memories.push({
        threadId,
        type: 'preference',
        content: 'Student prefers visual learning and diagrams',
        importance: 8,
        category: 'learning_style',
        metadata: { ...context, learningStyle: 'visual' }
      });
    }

    if (lowerMessage.includes('step by step') || lowerMessage.includes('slowly') || lowerMessage.includes('explain more')) {
      memories.push({
        threadId,
        type: 'preference',
        content: 'Student prefers detailed, step-by-step explanations',
        importance: 7,
        category: 'learning_style',
        metadata: { ...context, learningStyle: 'sequential' }
      });
    }

    // Subject interests
    const subjects = ['math', 'science', 'english', 'history', 'geography', 'physics', 'chemistry', 'biology'];
    subjects.forEach(subject => {
      if (lowerMessage.includes(`love ${subject}`) || lowerMessage.includes(`like ${subject}`) || lowerMessage.includes(`favorite is ${subject}`)) {
        memories.push({
          threadId,
          type: 'preference',
          content: `Student shows interest in ${subject}`,
          importance: 6,
          category: 'subject_interest',
          metadata: { ...context, favoriteSubject: subject }
        });
      }
    });

    return memories;
  }

  private extractLearningProgress(threadId: string, message: string, context: any): Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];
    const lowerMessage = message.toLowerCase();

    // Difficulty indicators
    if (lowerMessage.includes('too hard') || lowerMessage.includes('difficult') || lowerMessage.includes("don't understand")) {
      memories.push({
        threadId,
        type: 'learning_progress',
        content: `Student struggling with: ${context.subject || 'current topic'}`,
        importance: 9,
        category: 'difficulty',
        metadata: { ...context, difficultyLevel: 'struggling' }
      });
    }

    if (lowerMessage.includes('easy') || lowerMessage.includes('got it') || lowerMessage.includes('understand now')) {
      memories.push({
        threadId,
        type: 'learning_progress',
        content: `Student mastered: ${context.subject || 'current topic'}`,
        importance: 7,
        category: 'mastery',
        metadata: { ...context, difficultyLevel: 'mastered' }
      });
    }

    return memories;
  }

  private extractQuestionPatterns(threadId: string, message: string, context: any): Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];

    // Question type patterns
    if (message.includes('?')) {
      const questionType = this.classifyQuestion(message);
      memories.push({
        threadId,
        type: 'question_pattern',
        content: `Asked ${questionType} question: "${message.substring(0, 100)}..."`,
        importance: 5,
        category: 'question_type',
        metadata: { ...context, questionType, originalQuestion: message }
      });
    }

    return memories;
  }

  private extractConceptsExplained(threadId: string, message: string, context: any): Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];

    // Extract key concepts from AI responses
    const concepts = this.extractKeyConceptsFromText(message);
    concepts.forEach(concept => {
      memories.push({
        threadId,
        type: 'concept',
        content: `Explained concept: ${concept}`,
        importance: 6,
        category: 'teaching_content',
        metadata: { ...context, concept }
      });
    });

    return memories;
  }

  private extractFactsShared(threadId: string, message: string, context: any): Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];

    // Extract factual information shared
    const facts = this.extractFactsFromText(message);
    facts.forEach(fact => {
      memories.push({
        threadId,
        type: 'fact',
        content: fact,
        importance: 4,
        category: 'factual_content',
        metadata: { ...context }
      });
    });

    return memories;
  }

  private extractContextualInfo(threadId: string, message: string, messageType: 'user' | 'assistant', context: any): Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] {
    const memories: Omit<MemoryEntry, 'id' | 'timestamp' | 'lastAccessed' | 'accessCount'>[] = [];

    // Store general context
    if (context.subject || context.mode || context.board) {
      memories.push({
        threadId,
        type: 'context',
        content: `Discussion in ${context.mode || 'general'} mode about ${context.subject || 'general topic'}`,
        importance: 3,
        category: 'session_context',
        metadata: context
      });
    }

    return memories;
  }

  // Helper methods
  private calculateRelevanceScore(memory: MemoryEntry, query: MemoryQuery): number {
    let score = memory.importance / 10; // Base score from importance

    // Recent memories are more relevant
    const daysSince = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, (7 - daysSince) / 7) * 0.3;

    // Context matching
    if (query.context) {
      if (memory.metadata.subject === query.context.subject) score += 0.4;
      if (memory.metadata.mode === query.context.mode) score += 0.2;
      if (memory.metadata.board === query.context.board) score += 0.2;
    }

    // Frequently accessed memories are more relevant
    score += Math.min(memory.accessCount / 10, 0.2);

    return Math.min(score, 1.0);
  }

  private categorizeMemories(memories: MemoryEntry[]): Record<string, MemoryEntry[]> {
    const categories: Record<string, MemoryEntry[]> = {};
    
    memories.forEach(memory => {
      const category = memory.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(memory);
    });

    return categories;
  }

  private async updateConversationSummary(threadId: string): Promise<void> {
    const memories = this.memories.get(threadId) || [];
    const existingSummary = this.summaries.get(threadId);

    // Extract key information from memories
    const subjects = new Set<string>();
    const concepts = new Set<string>();
    const preferences = new Set<string>();
    const strengths = new Set<string>();
    const struggles = new Set<string>();

    memories.forEach(memory => {
      if (memory.metadata.subject) subjects.add(memory.metadata.subject);
      if (memory.metadata.concept) concepts.add(memory.metadata.concept);
      if (memory.type === 'preference') preferences.add(memory.content);
      if (memory.category === 'mastery') strengths.add(memory.content);
      if (memory.category === 'difficulty') struggles.add(memory.content);
    });

    const summary: ConversationSummary = {
      threadId,
      overallTopic: this.inferOverallTopic(memories),
      keySubjects: Array.from(subjects),
      learningObjectives: this.inferLearningObjectives(memories),
      conceptsCovered: Array.from(concepts),
      userPreferences: Array.from(preferences),
      currentContext: this.inferCurrentContext(memories),
      progressIndicators: {
        strengthAreas: Array.from(strengths),
        strugglingAreas: Array.from(struggles),
        questionsAsked: memories.filter(m => m.type === 'question_pattern').length,
        conceptsLearned: concepts.size
      },
      conversationFlow: {
        phase: this.inferConversationPhase(memories),
        nextSuggestedAction: this.suggestNextAction(memories)
      },
      lastUpdated: new Date()
    };

    this.summaries.set(threadId, summary);
  }

  private createEmptySummary(threadId: string): ConversationSummary {
    return {
      threadId,
      overallTopic: 'New conversation',
      keySubjects: [],
      learningObjectives: [],
      conceptsCovered: [],
      userPreferences: [],
      currentContext: 'Starting new conversation',
      progressIndicators: {
        strengthAreas: [],
        strugglingAreas: [],
        questionsAsked: 0,
        conceptsLearned: 0
      },
      conversationFlow: {
        phase: 'introduction',
        nextSuggestedAction: 'Understand the student\'s learning goals and interests'
      },
      lastUpdated: new Date()
    };
  }

  // Utility methods for content analysis
  private classifyQuestion(question: string): string {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('what') || lowerQ.includes('define')) return 'factual';
    if (lowerQ.includes('how') || lowerQ.includes('explain')) return 'procedural';
    if (lowerQ.includes('why') || lowerQ.includes('because')) return 'conceptual';
    if (lowerQ.includes('which') || lowerQ.includes('compare')) return 'analytical';
    return 'general';
  }

  private extractKeyConceptsFromText(text: string): string[] {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('extractKeyConceptsFromText: Invalid text input:', text);
      return [];
    }

    // Simple concept extraction - could be enhanced with NLP
    const concepts: string[] = [];
    const conceptPatterns = [
      /concept of (\w+)/gi,
      /principle of (\w+)/gi,
      /theory of (\w+)/gi,
      /(\w+) is defined as/gi,
      /(\w+) formula/gi
    ];

    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    });

    return concepts;
  }

  private extractFactsFromText(text: string): string[] {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('extractFactsFromText: Invalid text input:', text);
      return [];
    }

    // Simple fact extraction
    const sentences = text.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 3); // Take first 3 substantial sentences
  }

  private inferOverallTopic(memories: MemoryEntry[]): string {
    const subjects = memories
      .map(m => m.metadata.subject)
      .filter(Boolean)
      .reduce((acc, subject) => {
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topSubject = Object.entries(subjects)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return topSubject ? `Learning ${topSubject}` : 'General learning conversation';
  }

  private inferLearningObjectives(memories: MemoryEntry[]): string[] {
    // Extract learning objectives from question patterns and concepts
    const objectives = memories
      .filter(m => m.type === 'question_pattern' || m.type === 'concept')
      .map(m => `Understand ${m.metadata.concept || m.metadata.subject || 'topic'}`)
      .slice(0, 5);

    return [...new Set(objectives)];
  }

  private inferCurrentContext(memories: MemoryEntry[]): string {
    const recentMemory = memories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    if (!recentMemory) return 'New conversation';
    
    return `Currently discussing ${recentMemory.metadata.subject || 'general topics'} in ${recentMemory.metadata.mode || 'learning'} mode`;
  }

  private inferConversationPhase(memories: MemoryEntry[]): ConversationSummary['conversationFlow']['phase'] {
    const questionCount = memories.filter(m => m.type === 'question_pattern').length;
    const conceptCount = memories.filter(m => m.type === 'concept').length;
    
    if (questionCount === 0) return 'introduction';
    if (questionCount < 3) return 'exploration';
    if (conceptCount > 3) return 'practice';
    return 'review';
  }

  private suggestNextAction(memories: MemoryEntry[]): string {
    const struggles = memories.filter(m => m.category === 'difficulty');
    const masteries = memories.filter(m => m.category === 'mastery');
    
    if (struggles.length > masteries.length) {
      return 'Provide additional support and simpler explanations';
    }
    if (masteries.length > 3) {
      return 'Introduce more challenging concepts';
    }
    return 'Continue building on current understanding';
  }

  private pruneMemories(memories: MemoryEntry[]): void {
    // Remove old and less important memories
    if (memories.length <= this.maxMemoriesPerThread) return;

    memories.sort((a, b) => {
      const aScore = a.importance + (a.accessCount * 0.1);
      const bScore = b.importance + (b.accessCount * 0.1);
      return bScore - aScore;
    });

    memories.splice(this.maxMemoriesPerThread);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public methods for management
  async clearThreadMemories(threadId: string): Promise<void> {
    this.memories.delete(threadId);
    this.summaries.delete(threadId);
    this.saveToStorage();
  }

  async getThreadSummary(threadId: string): Promise<ConversationSummary | null> {
    return this.summaries.get(threadId) || null;
  }

  async getAllThreadIds(): Promise<string[]> {
    return Array.from(this.memories.keys());
  }

  // Storage persistence methods
  private saveToStorage(): void {
    try {
      const memoriesData = Array.from(this.memories.entries()).map(([threadId, memories]) => ({
        threadId,
        memories: memories.map(memory => ({
          ...memory,
          timestamp: memory.timestamp.toISOString(),
          lastAccessed: memory.lastAccessed.toISOString()
        }))
      }));

      const summariesData = Array.from(this.summaries.entries()).map(([threadId, summary]) => ({
        threadId,
        summary: {
          ...summary,
          lastUpdated: summary.lastUpdated.toISOString()
        }
      }));

      localStorage.setItem('conversation_memories', JSON.stringify(memoriesData));
      localStorage.setItem('conversation_summaries', JSON.stringify(summariesData));
    } catch (error) {
      console.warn('Failed to save memories to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      // Load memories
      const memoriesJson = localStorage.getItem('conversation_memories');
      if (memoriesJson) {
        const memoriesData = JSON.parse(memoriesJson);
        memoriesData.forEach(({ threadId, memories }: any) => {
          const processedMemories = memories.map((memory: any) => ({
            ...memory,
            timestamp: new Date(memory.timestamp),
            lastAccessed: new Date(memory.lastAccessed)
          }));
          this.memories.set(threadId, processedMemories);
        });
      }

      // Load summaries
      const summariesJson = localStorage.getItem('conversation_summaries');
      if (summariesJson) {
        const summariesData = JSON.parse(summariesJson);
        summariesData.forEach(({ threadId, summary }: any) => {
          const processedSummary = {
            ...summary,
            lastUpdated: new Date(summary.lastUpdated)
          };
          this.summaries.set(threadId, processedSummary);
        });
      }

      // Clean up old memories
      this.cleanupOldMemories();
    } catch (error) {
      console.warn('Failed to load memories from storage:', error);
    }
  }

  private cleanupOldMemories(): void {
    const cutoffDate = new Date(Date.now() - (this.memoryRetentionDays * 24 * 60 * 60 * 1000));
    
    for (const [threadId, memories] of this.memories.entries()) {
      const recentMemories = memories.filter(memory => memory.timestamp > cutoffDate);
      if (recentMemories.length !== memories.length) {
        this.memories.set(threadId, recentMemories);
      }
    }
    
    this.saveToStorage();
  }
}

// Singleton instance
export const memoryService = new MemoryService();
