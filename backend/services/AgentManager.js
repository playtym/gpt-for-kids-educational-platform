/**
 * Agent Manager
 * Coordinates all educational agents and routes requests appropriately
 */

import { SocraticLearningAgent } from '../agents/SocraticLearningAgent.js';
import { CreativeContentAgent } from '../agents/CreativeContentAgent.js';
import { AssessmentAgent } from '../agents/AssessmentAgent.js';
import { ExplorationAgent } from '../agents/ExplorationAgent.js';
import { CurriculumAgent } from '../agents/CurriculumAgent.js';
import { QuizGenerationAgent } from '../agents/QuizGenerationAgent.js';
import { ContentSafetyManager } from '../services/ContentSafetyManager.js';
import { MCPAgentManager } from '../mcp-agents/MCPAgentManager.js';
import { Logger } from '../utils/Logger.js';

export class AgentManager {
  constructor(openaiClient, anthropicClient) {
    this.openai = openaiClient;
    this.anthropic = anthropicClient;
    
    // Initialize safety manager
    ContentSafetyManager.init(openaiClient, anthropicClient);
    
    // Initialize agents
    this.agents = {
      socratic: new SocraticLearningAgent(openaiClient),
      creative: new CreativeContentAgent(anthropicClient),
      assessment: new AssessmentAgent(openaiClient),
      exploration: new ExplorationAgent(openaiClient),
      curriculum: new CurriculumAgent(openaiClient),
      quiz: new QuizGenerationAgent(openaiClient)
    };

    // Initialize MCP file processing agents
    this.mcpManager = new MCPAgentManager();

    // Performance tracking
    this.metrics = {
      requestCount: 0,
      agentUsage: {},
      averageResponseTime: 0,
      errorRate: 0
    };

    Logger.info('AgentManager initialized', {
      component: 'AgentManager',
      agentsCount: Object.keys(this.agents).length,
      hasOpenAI: !!openaiClient,
      hasAnthropic: !!anthropicClient
    });
  }

  /**
   * Route unified chat requests to appropriate agents
   */
  async handleChatRequest(request) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    try {
      const { message, mode, ageGroup, context = [], subject, socraticMode, duration, curriculumBoard, curriculumGrade } = request;
      
      Logger.apiRequest('POST', '/api/chat', {
        mode,
        ageGroup,
        hasContext: context.length > 0,
        contextLength: context.length
      });

      // Validate required fields
      this.validateChatRequest(request);
      
      let response;
      let agent;
      
      // Route to appropriate agent based on mode
      switch (mode) {
        case 'learn':
          agent = 'socratic';
          
          // Check if this is the start of a new learning conversation (no context/existing conversation)
          // If so, use structured learning paths; otherwise, use traditional Socratic dialogue
          if (!context || context.length === 0) {
            // Start a structured learning journey
            const threadId = `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            response = await this.agents.socratic.startLearningJourney(
              threadId,
              message,
              ageGroup,
              context
            );
          } else {
            // Continue with traditional Socratic dialogue for ongoing conversations
            response = await this.agents.socratic.generateResponse(
              message, 
              message, 
              ageGroup, 
              subject || 'General Learning', 
              socraticMode || 'answer-first',
              context
            );
          }
          break;
          
        case 'create':
          agent = 'creative';
          response = await this.agents.creative.generateStory(
            message, 
            ageGroup, 
            duration || 'short',
            context
          );
          break;
          
        case 'feedback':
          agent = 'assessment';
          response = await this.agents.assessment.provideFeedback(
            message, 
            'general', 
            ageGroup,
            context
          );
          break;
          
        case 'questions':
          agent = 'assessment';
          response = await this.agents.assessment.generateQuestions(
            message, 
            ageGroup, 
            'thoughtful',
            context
          );
          break;

        case 'quiz':
          agent = 'quiz';
          response = await this.agents.quiz.generateContextualQuiz(
            message,
            context.map(c => c.content || c.message || '').join(' '),
            { grade: this.mapAgeGroupToGrade(ageGroup) },
            {
              questionCount: request.questionCount || 5,
              quizType: request.quizType || 'mcq',
              searchEnabled: request.searchEnabled !== false,
              includeSources: request.includeSources !== false,
              difficulty: request.difficulty || 'auto'
            }
          );
          break;

        case 'curriculum':
          agent = 'curriculum';
          response = await this.agents.curriculum.generateCurriculumContent(
            message,
            ageGroup,
            curriculumBoard || 'NCERT',
            curriculumGrade || 'Grade 8',
            context
          );
          break;
          
        case 'explore':
        default:
          agent = 'exploration';
          // Check if the request contains an image
          const inputType = request.image ? 'image' : 'text';
          const input = request.image || message;
          
          response = await this.agents.exploration.generateExplorationResponse(
            input,
            context.map(c => c.content || c.message || '').join(' '),
            { grade: this.mapAgeGroupToGrade(ageGroup) },
            'user-' + Date.now(), // Simple user ID for logging
            inputType
          );
          break;
      }

      // Track metrics
      this.updateMetrics(agent, startTime, true);
      
      Logger.info('Chat request completed successfully', {
        component: 'AgentManager',
        mode,
        agent,
        ageGroup,
        responseLength: response.length,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        response,
        mode,
        ageGroup,
        agent,
        contextLength: context.length,
        timestamp: new Date().toISOString(),
        ...(subject && { subject }),
        ...(socraticMode && { socraticMode }),
        ...(duration && { duration })
      };
      
    } catch (error) {
      this.updateMetrics('unknown', startTime, false);
      Logger.error('Chat request failed', { 
        error: error.message,
        request: { ...request, message: request.message?.substring(0, 100) }
      });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle legacy API endpoints
   */
  async handleLegacyRequest(endpoint, data) {
    const startTime = Date.now();
    
    try {
      let response;
      let agent;
      
      switch (endpoint) {
        case 'socratic':
          agent = 'socratic';
          response = await this.agents.socratic.generateResponse(
            data.question,
            data.studentResponse || data.question,
            data.ageGroup,
            data.subject,
            data.mode || 'socratic'
          );
          break;
          
        case 'story':
          agent = 'creative';
          response = await this.agents.creative.generateStory(
            data.topic,
            data.ageGroup,
            data.duration || 'short'
          );
          break;
          
        case 'feedback':
          agent = 'assessment';
          response = await this.agents.assessment.provideFeedback(
            data.studentWork,
            data.type,
            data.ageGroup
          );
          break;
          
        case 'question':
          agent = 'assessment';
          response = await this.agents.assessment.generateQuestions(
            data.topic,
            data.ageGroup
          );
          break;
          
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      this.updateMetrics(agent, startTime, true);
      
      return {
        success: true,
        [this.getResponseKey(endpoint)]: response,
        timestamp: new Date().toISOString(),
        ...data
      };
      
    } catch (error) {
      this.updateMetrics('unknown', startTime, false);
      Logger.error(`Legacy request failed for ${endpoint}`, { error: error.message, data });
      throw error;
    }
  }

  /**
   * Validate chat request
   */
  validateChatRequest(request) {
    const { message, mode, ageGroup } = request;
    
    if (!message || !mode || !ageGroup) {
      throw new Error('Missing required fields: message, mode, ageGroup');
    }
    
    const validModes = ['explore', 'learn', 'create', 'feedback', 'questions', 'quiz', 'curriculum'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode. Must be one of: ${validModes.join(', ')}`);
    }
    
    const validAgeGroups = ['5-7', '8-10', '11-13', '14-17'];
    if (!validAgeGroups.includes(ageGroup)) {
      throw new Error(`Invalid age group. Must be one of: ${validAgeGroups.join(', ')}`);
    }
  }

  /**
   * Get response key for legacy endpoints
   */
  getResponseKey(endpoint) {
    const keys = {
      'socratic': 'response',
      'story': 'story',
      'feedback': 'feedback',
      'question': 'question'
    };
    return keys[endpoint] || 'response';
  }

  /**
   * Update performance metrics
   */
  updateMetrics(agent, startTime, success) {
    const duration = Date.now() - startTime;
    
    // Update agent usage
    if (!this.metrics.agentUsage[agent]) {
      this.metrics.agentUsage[agent] = { count: 0, totalTime: 0, errors: 0 };
    }
    
    this.metrics.agentUsage[agent].count++;
    this.metrics.agentUsage[agent].totalTime += duration;
    
    if (!success) {
      this.metrics.agentUsage[agent].errors++;
    }
    
    // Update overall metrics
    const totalTime = Object.values(this.metrics.agentUsage)
      .reduce((sum, usage) => sum + usage.totalTime, 0);
    this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;
    
    const totalErrors = Object.values(this.metrics.agentUsage)
      .reduce((sum, usage) => sum + usage.errors, 0);
    this.metrics.errorRate = (totalErrors / this.metrics.requestCount) * 100;
  }

  /**
   * Get system health information
   */
  getHealth() {
    const agentHealth = {};
    
    Object.entries(this.agents).forEach(([name, agent]) => {
      const usage = this.metrics.agentUsage[name];
      agentHealth[name] = {
        status: 'healthy',
        usage: usage || { count: 0, totalTime: 0, errors: 0 },
        averageResponseTime: usage ? usage.totalTime / Math.max(usage.count, 1) : 0
      };
    });

    return {
      status: 'healthy',
      agents: agentHealth,
      overall: {
        totalRequests: this.metrics.requestCount,
        averageResponseTime: this.metrics.averageResponseTime,
        errorRate: this.metrics.errorRate,
        uptime: process.uptime()
      },
      apiConnections: {
        openai: !!this.openai,
        anthropic: !!this.anthropic
      }
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      agentUsage: {},
      averageResponseTime: 0,
      errorRate: 0
    };
    Logger.info('Metrics reset', { component: 'AgentManager' });
  }

  /**
   * Get agent-specific statistics
   */
  getAgentStats(agentName) {
    if (!this.agents[agentName]) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    
    const usage = this.metrics.agentUsage[agentName] || { count: 0, totalTime: 0, errors: 0 };
    
    return {
      agent: agentName,
      usage,
      averageResponseTime: usage.count > 0 ? usage.totalTime / usage.count : 0,
      errorRate: usage.count > 0 ? (usage.errors / usage.count) * 100 : 0,
      successRate: usage.count > 0 ? ((usage.count - usage.errors) / usage.count) * 100 : 100
    };
  }

  /**
   * Process uploaded files with MCP agents
   * @param {Array} files - Array of file objects
   * @param {Object} options - Processing options
   * @returns {Object} Processing results
   */
  async processFiles(files, options = {}) {
    const startTime = Date.now();
    
    try {
      Logger.info('Processing files', {
        component: 'AgentManager',
        fileCount: files.length,
        options
      });

      const result = await this.mcpManager.processFiles(files, options);
      
      // Track metrics
      const duration = Date.now() - startTime;
      this.updateMetrics('file-processing', duration, false);
      
      Logger.info('File processing completed', {
        component: 'AgentManager',
        duration,
        processedFiles: result.processed.length,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics('file-processing', duration, true);
      
      Logger.error('File processing failed', {
        component: 'AgentManager',
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  /**
   * Query processed file content
   * @param {string} query - User query
   * @param {Array} processedFiles - Previously processed files
   * @returns {Object} Query response
   */
  async queryFileContent(query, processedFiles) {
    const startTime = Date.now();
    
    try {
      Logger.info('Querying file content', {
        component: 'AgentManager',
        query: query.substring(0, 100),
        fileCount: processedFiles.length
      });

      const result = await this.mcpManager.queryProcessedContent(query, processedFiles);
      
      // Track metrics
      const duration = Date.now() - startTime;
      this.updateMetrics('file-query', duration, false);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics('file-query', duration, true);
      
      Logger.error('File content query failed', {
        component: 'AgentManager',
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  /**
   * Get supported file types for MCP processing
   * @returns {Object} Supported file types
   */
  getSupportedFileTypes() {
    return this.mcpManager.getSupportedFileTypes();
  }

  /**
   * Get MCP agent health status
   * @returns {Object} Health status
   */
  async getMCPHealth() {
    return await this.mcpManager.healthCheck();
  }

  /**
   * Get specific agent instance
   * @param {string} agentName - Name or class name of the agent
   * @returns {Object} Agent instance
   */
  getAgent(agentName) {
    // Handle both short names and class names
    const normalizedName = agentName.toLowerCase().replace('agent', '');
    
    if (normalizedName === 'socraticlearning' || normalizedName === 'socratic') {
      return this.agents.socratic;
    }
    
    // Map other agent names
    const agentMap = {
      'creative': this.agents.creative,
      'creativecontentAgent': this.agents.creative,
      'assessment': this.agents.assessment,
      'assessmentAgent': this.agents.assessment,
      'exploration': this.agents.exploration,
      'explorationAgent': this.agents.exploration,
      'curriculum': this.agents.curriculum,
      'curriculumAgent': this.agents.curriculum,
      'quiz': this.agents.quiz,
      'quizgeneration': this.agents.quiz
    };
    
    return agentMap[normalizedName] || this.agents[normalizedName] || null;
  }

  /**
   * Map age group to grade for quiz generation
   */
  mapAgeGroupToGrade(ageGroup) {
    const mapping = {
      '5-7': 'K-1st',
      '8-10': '2nd-4th',
      '11-13': '5th-8th',
      '14-17': '9th-12th'
    };
    return mapping[ageGroup] || '5th-8th';
  }
}
