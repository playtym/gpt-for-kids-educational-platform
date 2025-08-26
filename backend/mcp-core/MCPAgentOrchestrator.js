/**
 * MCP Agent Orchestrator - Enhanced Agent Coordination System
 * Manages all educational agents and coordinates their interactions
 */

import { Logger } from '../utils/Logger.js';
import { ServiceFactory } from '../core/ServiceFactory.js';

// Import all enhanced agents
import { TopicGenerationAgent } from '../agents/TopicGenerationAgentEnhanced.js';
import { SocraticLearningAgent } from '../agents/SocraticLearningAgent.js';
import { AssessmentAgent } from '../agents/AssessmentAgent.js';
import { CreativeContentAgent } from '../agents/CreativeContentAgent.js';
import { CurriculumAgent } from '../agents/CurriculumAgent.js';
import { ExplorationAgent } from '../agents/ExplorationAgent.js';
import { QuizGenerationAgent } from '../agents/QuizGenerationAgent.js';
import { MCPAgentManager } from '../mcp-agents/MCPAgentManager.js';

export class MCPAgentOrchestrator {
  constructor(mcpServer) {
    this.mcpServer = mcpServer;
    // this.logger removed('MCPAgentOrchestrator');
    
    // Agent management
    this.agents = new Map();
    this.agentCapabilities = new Map();
    this.agentMetrics = new Map();
    this.agentHealth = new Map();
    
    // Service integration
    this.serviceFactory = null;
    
    // Prompt management
    this.prompts = new Map();
    
    // Agent coordination
    this.executionQueue = [];
    this.maxConcurrentExecutions = 5;
    this.currentExecutions = 0;
    
    Logger.info('MCP Agent Orchestrator initialized');
  }

  /**
   * Initialize the orchestrator and all agents
   */
  async initialize() {
    try {
      Logger.info('Initializing agent orchestrator...');

      // Skip ServiceFactory initialization as agents are now managed directly
      // ServiceFactory is only for core services, not agents
      this.serviceFactory = null;

      // Note: Defer agent initialization until AI clients are set
      this.agentsInitialized = false;
      
      Logger.info('Agent orchestrator base initialization complete (agents deferred)');

    } catch (error) {
      Logger.error('Failed to initialize agent orchestrator:', error);
      throw error;
    }
  }

  /**
   * Initialize agents after AI clients are available
   */
  async initializeAgentsWhenReady() {
    if (this.agentsInitialized) {
      return;
    }

    try {
      // Initialize all educational agents
      await this.initializeAgents();
      
      // Setup agent capabilities mapping
      await this.mapAgentCapabilities();
      
      // Register educational prompts
      await this.registerEducationalPrompts();
      
      this.agentsInitialized = true;
      
      Logger.info('Agent orchestrator full initialization complete', {
        agentCount: this.agents.size,
        totalCapabilities: Array.from(this.agentCapabilities.values())
          .reduce((sum, caps) => sum + caps.size, 0)
      });

    } catch (error) {
      Logger.error('Failed to initialize agents:', error);
      throw error;
    }
  }

  /**
   * Initialize all educational agents
   */
  async initializeAgents() {
    try {
      // Get AI clients directly from MCP server
      const openaiClient = this.mcpServer.openaiClient;
      const anthropicClient = this.mcpServer.anthropicClient;

      if (!openaiClient) {
        throw new Error('OpenAI client not available for agent initialization');
      }
      if (!anthropicClient) {
        throw new Error('Anthropic client not available for agent initialization');
      }

      // Initialize enhanced agents
      const agentConfigs = [
        {
          name: 'TopicGenerationAgent',
          class: TopicGenerationAgent,
          client: openaiClient,
          config: { maxTokens: 1500, temperature: 0.7 }
        },
        {
          name: 'SocraticLearningAgent',
          class: SocraticLearningAgent,
          client: openaiClient,
          config: { maxTokens: 1000, temperature: 0.7 }
        },
        {
          name: 'AssessmentAgent',
          class: AssessmentAgent,
          client: openaiClient,
          config: { maxTokens: 800, temperature: 0.6 }
        },
        {
          name: 'CreativeContentAgent',
          class: CreativeContentAgent,
          client: anthropicClient,
          config: { maxTokens: 1000, temperature: 0.8 }
        },
        {
          name: 'CurriculumAgent',
          class: CurriculumAgent,
          client: openaiClient,
          config: { maxTokens: 1500, temperature: 0.7 }
        },
        {
          name: 'ExplorationAgent',
          class: ExplorationAgent,
          client: openaiClient,
          config: { maxTokens: 1000, temperature: 0.7 }
        },
        {
          name: 'QuizGenerationAgent',
          class: QuizGenerationAgent,
          client: openaiClient,
          config: { maxTokens: 1500, temperature: 0.7 }
        }
      ];

      // Initialize each agent
      for (const agentConfig of agentConfigs) {
        try {
          const agent = new agentConfig.class(agentConfig.client, agentConfig.config);
          this.agents.set(agentConfig.name, agent);
          
          // Initialize agent metrics
          this.agentMetrics.set(agentConfig.name, {
            executionCount: 0,
            successCount: 0,
            errorCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            lastExecutionTime: null
          });

          Logger.info(`Agent initialized: ${agentConfig.name}`);
        } catch (error) {
          Logger.error(`Failed to initialize agent ${agentConfig.name}:`, error);
        }
      }

      // Initialize MCP Agent Manager for file processing
      const mcpAgentManager = new MCPAgentManager();
      this.agents.set('MCPAgentManager', mcpAgentManager);

    } catch (error) {
      Logger.error('Error initializing agents:', error);
      throw error;
    }
  }

  /**
   * Map agent capabilities for service discovery
   */
  async mapAgentCapabilities() {
    for (const [agentName, agent] of this.agents) {
      const capabilities = new Set();

      // Get capabilities from enhanced agents
      if (agent.capabilities) {
        for (const capability of agent.capabilities) {
          capabilities.add(capability);
        }
      }

      // Add default capabilities based on agent type
      switch (agentName) {
        case 'TopicGenerationAgent':
          capabilities.add('generatePersonalized');
          capabilities.add('enhanceTopics');
          capabilities.add('suggestRelated');
          break;
        case 'SocraticLearningAgent':
          capabilities.add('socraticDialogue');
          capabilities.add('guidedQuestioning');
          capabilities.add('deepLearning');
          break;
        case 'AssessmentAgent':
          capabilities.add('provideFeedback');
          capabilities.add('assessWork');
          capabilities.add('generateQuestions');
          break;
        case 'CreativeContentAgent':
          capabilities.add('generateStory');
          capabilities.add('createContent');
          capabilities.add('writingPrompts');
          capabilities.add('provideFeedback');
          break;
        case 'CurriculumAgent':
          capabilities.add('curriculumContent');
          capabilities.add('standardsAlignment');
          capabilities.add('learningObjectives');
          break;
        case 'ExplorationAgent':
          capabilities.add('exploreTopics');
          capabilities.add('discoveryLearning');
          capabilities.add('curiosityDriven');
          break;
        case 'QuizGenerationAgent':
          capabilities.add('generateQuiz');
          capabilities.add('assessmentCreation');
          capabilities.add('contextualQuestions');
          break;
        case 'MCPAgentManager':
          capabilities.add('fileAnalysis');
          capabilities.add('pdfProcessing');
          capabilities.add('imageAnalysis');
          break;
      }

      this.agentCapabilities.set(agentName, capabilities);
    }
  }

  /**
   * Register educational prompts
   */
  async registerEducationalPrompts() {
    // Age-appropriate learning prompt
    this.prompts.set('age-appropriate-learning', {
      name: 'age-appropriate-learning',
      description: 'Generate age-appropriate educational content',
      arguments: [
        {
          name: 'topic',
          description: 'The educational topic',
          required: true
        },
        {
          name: 'ageGroup',
          description: 'Target age group (5-7, 8-10, 11-13, 14-17)',
          required: true
        },
        {
          name: 'contentType',
          description: 'Type of content (explanation, story, activity)',
          required: false
        }
      ]
    });

    // Socratic dialogue prompt
    this.prompts.set('socratic-dialogue', {
      name: 'socratic-dialogue',
      description: 'Engage in Socratic questioning to guide learning',
      arguments: [
        {
          name: 'question',
          description: 'Student question or response',
          required: true
        },
        {
          name: 'subject',
          description: 'Subject area',
          required: true
        },
        {
          name: 'ageGroup',
          description: 'Student age group',
          required: true
        }
      ]
    });

    // Curriculum-aligned prompt
    this.prompts.set('curriculum-aligned', {
      name: 'curriculum-aligned',
      description: 'Generate curriculum-specific educational content',
      arguments: [
        {
          name: 'subject',
          description: 'Subject area',
          required: true
        },
        {
          name: 'grade',
          description: 'Grade level',
          required: true
        },
        {
          name: 'board',
          description: 'Educational board (NCERT, CBSE, ICSE, etc.)',
          required: true
        }
      ]
    });
  }

  /**
   * Get available prompts
   */
  async listPrompts() {
    const prompts = [];
    
    for (const [name, prompt] of this.prompts) {
      prompts.push(prompt);
    }
    
    return prompts;
  }

  /**
   * Get a specific prompt
   */
  async getPrompt(name, args = {}) {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    // Generate prompt content based on the prompt type
    const messages = await this.generatePromptMessages(name, args);
    
    return {
      description: prompt.description,
      messages
    };
  }

  /**
   * Generate prompt messages
   */
  async generatePromptMessages(promptName, args) {
    switch (promptName) {
      case 'age-appropriate-learning':
        return [
          {
            role: 'system',
            content: `You are an educational content creator specializing in age-appropriate learning materials. Generate engaging, educational content about "${args.topic}" for children aged ${args.ageGroup}. The content should be appropriate for their cognitive development level and learning style.`
          },
          {
            role: 'user',
            content: `Create ${args.contentType || 'educational content'} about ${args.topic} for age group ${args.ageGroup}.`
          }
        ];

      case 'socratic-dialogue':
        return [
          {
            role: 'system',
            content: `You are a Socratic learning facilitator. Guide the student's learning through thoughtful questions rather than direct answers. Help them discover knowledge through guided inquiry about ${args.subject} for age group ${args.ageGroup}.`
          },
          {
            role: 'user',
            content: args.question
          }
        ];

      case 'curriculum-aligned':
        return [
          {
            role: 'system',
            content: `You are a curriculum specialist for ${args.board} board, grade ${args.grade}, subject ${args.subject}. Generate content that aligns with the specific curriculum standards and learning objectives.`
          },
          {
            role: 'user',
            content: `Create curriculum-aligned content for ${args.subject}, grade ${args.grade}, ${args.board} board.`
          }
        ];

      default:
        throw new Error(`Unknown prompt: ${promptName}`);
    }
  }

  /**
   * Execute agent capability with orchestration
   */
  async executeAgentCapability(agentName, capability, input, context = {}) {
    const startTime = Date.now();

    try {
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }

      // Check if agent has the capability
      const agentCaps = this.agentCapabilities.get(agentName);
      if (!agentCaps || !agentCaps.has(capability)) {
        throw new Error(`Agent ${agentName} does not have capability: ${capability}`);
      }

      // Update metrics
      const metrics = this.agentMetrics.get(agentName);
      metrics.executionCount++;
      metrics.lastExecutionTime = new Date().toISOString();

      Logger.info(`Executing ${agentName}.${capability}`, { input, context });

      let result;

      // Execute capability based on agent type
      if (agent.executeCapability) {
        // Enhanced agent with capability system
        result = await agent.executeCapability(capability, input, context);
      } else {
        // Legacy agent - map capability to method
        result = await this.executeLegacyAgentMethod(agent, capability, input, context);
      }

      // Update success metrics
      metrics.successCount++;
      const duration = Date.now() - startTime;
      metrics.totalExecutionTime += duration;
      metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.successCount;

      return result;

    } catch (error) {
      // Update error metrics
      const metrics = this.agentMetrics.get(agentName);
      if (metrics) {
        metrics.errorCount++;
      }

      Logger.error(`Agent execution failed: ${agentName}.${capability}`, error);
      throw error;
    }
  }

  /**
   * Execute legacy agent methods
   */
  async executeLegacyAgentMethod(agent, capability, input, context) {
    switch (capability) {
      case 'socraticDialogue':
        return await agent.generateResponse(
          input.question,
          input.studentResponse,
          input.ageGroup,
          input.subject,
          input.mode || 'socratic',
          context.conversationHistory || []
        );

      case 'provideFeedback':
        // Handle creative feedback specially for CreativeContentAgent
        if (agent.name === 'CreativeContentAgent') {
          console.log('DEBUG: input object for CreativeContentAgent:', JSON.stringify(input, null, 2));
          return await agent.provideFeedback(
            input.studentWork,
            input.ageGroup,
            null // medium will be auto-detected
          );
        }
        // Default behavior for AssessmentAgent
        return await agent.provideFeedback(
          input.studentWork,
          input.type,
          input.ageGroup,
          context.conversationHistory || []
        );

      case 'generateStory':
        return await agent.generateStory(
          input.topic,
          input.ageGroup,
          input.duration || 'short',
          context.conversationHistory || []
        );

      case 'curriculumContent':
        return await agent.generateCurriculumContent(
          input.query || input.topic,
          input.ageGroup,
          input.board,
          input.grade,
          context.conversationHistory || []
        );

      case 'exploreTopics':
        return await agent.generateExplorationResponse(
          input.input || input.topic,
          context.conversationHistory || [],
          { grade: input.ageGroup },
          context.userId || 'anonymous',
          input.inputType || 'text'
        );

      case 'generateQuiz':
        return await agent.generateContextualQuiz(
          input.topic,
          context.conversationContext || '',
          { grade: input.ageGroup },
          {
            questionCount: input.questionCount || 5,
            quizType: input.quizType || 'mixed',
            difficulty: input.difficulty || 'auto'
          }
        );

      case 'fileAnalysis':
        return await agent.processFiles(
          input.files,
          {
            ageGroup: input.ageGroup,
            analysisType: input.analysisType || 'educational'
          }
        );

      default:
        throw new Error(`Unknown capability: ${capability}`);
    }
  }

  /**
   * MCP Tool Handler Methods
   */

  async generateEducationalContent(args) {
    const { topic, ageGroup, contentType, context = [] } = args;
    
    switch (contentType) {
      case 'story':
        return await this.executeAgentCapability('CreativeContentAgent', 'generateStory', {
          topic, ageGroup
        }, { conversationHistory: context });

      case 'explanation':
        return await this.executeAgentCapability('TopicGenerationAgent', 'generatePersonalized', {
          topic, ageGroup
        }, { conversationHistory: context });

      case 'quiz':
        return await this.executeAgentCapability('QuizGenerationAgent', 'generateQuiz', {
          topic, ageGroup
        }, { conversationContext: context.map(c => c.content).join(' ') });

      case 'activity':
        return await this.executeAgentCapability('ExplorationAgent', 'exploreTopics', {
          input: topic, ageGroup
        }, { conversationHistory: context });

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
  }

  async conductSocraticDialogue(args) {
    return await this.executeAgentCapability('SocraticLearningAgent', 'socraticDialogue', args);
  }

  async provideFeedback(args) {
    // Route creative feedback to CreativeContentAgent, others to AssessmentAgent
    if (args.type === 'creative') {
      return await this.executeAgentCapability('CreativeContentAgent', 'provideFeedback', args);
    }
    return await this.executeAgentCapability('AssessmentAgent', 'provideFeedback', args);
  }

  async generateCurriculumContent(args) {
    return await this.executeAgentCapability('CurriculumAgent', 'curriculumContent', args);
  }

  async createStory(args) {
    return await this.executeAgentCapability('CreativeContentAgent', 'generateStory', args);
  }

  async exploreEducationalTopic(args) {
    return await this.executeAgentCapability('ExplorationAgent', 'exploreTopics', args);
  }

  async generateQuiz(args) {
    return await this.executeAgentCapability('QuizGenerationAgent', 'generateQuiz', args);
  }

  async analyzeEducationalFiles(args) {
    return await this.executeAgentCapability('MCPAgentManager', 'fileAnalysis', args);
  }

  /**
   * Resource data methods
   */

  async getCurriculumData() {
    // This would integrate with your curriculum system
    return {
      subjects: ['Mathematics', 'Science', 'Language Arts', 'Social Studies'],
      boards: ['NCERT', 'CBSE', 'ICSE', 'IB', 'Cambridge'],
      grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    };
  }

  async getAgeGroupConfigurations() {
    // Return age group configurations
    return {
      '5-7': { name: 'Early Elementary', cognitiveLevel: 'concrete', attentionSpan: '5-10 min' },
      '8-10': { name: 'Late Elementary', cognitiveLevel: 'concrete-formal', attentionSpan: '10-20 min' },
      '11-13': { name: 'Middle School', cognitiveLevel: 'formal-early', attentionSpan: '20-30 min' },
      '14-17': { name: 'High School', cognitiveLevel: 'formal', attentionSpan: '30-45 min' }
    };
  }

  async getLearningObjectives() {
    return {
      mathematics: ['Problem solving', 'Mathematical reasoning', 'Number sense'],
      science: ['Scientific inquiry', 'Critical thinking', 'Observation skills'],
      language: ['Reading comprehension', 'Writing skills', 'Communication']
    };
  }

  async getEducationalStandards() {
    return {
      NCERT: { focus: 'Holistic development', approach: 'Activity-based' },
      CBSE: { focus: 'Competency-based', approach: 'Skill development' },
      ICSE: { focus: 'Comprehensive', approach: 'Analytical thinking' }
    };
  }

  async getSafetyGuidelines() {
    return {
      contentFiltering: true,
      ageAppropriate: true,
      educationalFocus: true,
      positiveReinforcement: true
    };
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return this.agents;
  }

  /**
   * Get agent by name
   */
  getAgent(name) {
    return this.agents.get(name);
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability) {
    const agents = [];
    
    for (const [agentName, capabilities] of this.agentCapabilities) {
      if (capabilities.has(capability)) {
        agents.push({
          name: agentName,
          agent: this.agents.get(agentName)
        });
      }
    }
    
    return agents;
  }

  /**
   * Get agent count
   */
  getAgentCount() {
    return this.agents.size;
  }

  /**
   * Get orchestrator health
   */
  async getHealth() {
    const agentHealth = {};
    
    for (const [agentName, agent] of this.agents) {
      try {
        if (agent.getHealth) {
          agentHealth[agentName] = await agent.getHealth();
        } else {
          agentHealth[agentName] = { status: 'unknown' };
        }
      } catch (error) {
        agentHealth[agentName] = { status: 'error', error: error.message };
      }
    }

    return {
      status: 'healthy',
      agentCount: this.agents.size,
      agents: agentHealth,
      metrics: Object.fromEntries(this.agentMetrics)
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    Logger.info('Cleaning up agent orchestrator...');
    
    // Cleanup all agents
    for (const [agentName, agent] of this.agents) {
      try {
        if (agent.cleanup) {
          await agent.cleanup();
        }
      } catch (error) {
        Logger.error(`Error cleaning up agent ${agentName}:`, error);
      }
    }

    // Cleanup service factory
    if (this.serviceFactory && this.serviceFactory.cleanup) {
      await this.serviceFactory.cleanup();
    }

    this.agents.clear();
    this.agentCapabilities.clear();
    this.agentMetrics.clear();
    this.prompts.clear();
    
    Logger.info('Agent orchestrator cleanup complete');
  }
}

export default MCPAgentOrchestrator;
