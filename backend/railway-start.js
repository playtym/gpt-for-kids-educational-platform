#!/usr/bin/env node

/**
 * Railway Deployment Startup Script for MCP Server
 * This script handles the deployment-specific initialization
 */

import { config } from 'dotenv';
import MCPServer from './mcp-core/MCPServer.js';
import { Logger } from './utils/Logger.js';

// Load environment variables
config();

// Railway-specific configuration
const RAILWAY_CONFIG = {
  // Railway provides PORT automatically
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // MCP server configuration
  name: process.env.MCP_SERVER_NAME || 'gpt-for-kids-educational-platform',
  version: process.env.MCP_SERVER_VERSION || '2.0.0',
  
  // Feature flags
  enableAgentOrchestrator: process.env.ENABLE_AGENT_ORCHESTRATOR !== 'false',
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  enableCaching: process.env.ENABLE_CACHING !== 'false',
  enableValidation: process.env.ENABLE_VALIDATION !== 'false',
  
  // Performance settings
  maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 50,
  cacheTTL: parseInt(process.env.CACHE_TTL) || 3600,
  
  // Required API keys
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
};

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    Logger.error('Missing required environment variables:', missing);
    Logger.error('Please set these variables in Railway dashboard');
    process.exit(1);
  }
  
  Logger.info('Environment validation passed');
}

/**
 * Initialize and start MCP server
 */
async function startMCPServer() {
  try {
    Logger.info('🚀 Starting MCP Server on Railway...');
    Logger.info('Configuration:', {
      environment: process.env.NODE_ENV || 'development',
      port: RAILWAY_CONFIG.port,
      host: RAILWAY_CONFIG.host,
      serverName: RAILWAY_CONFIG.name,
      version: RAILWAY_CONFIG.version
    });

    // Validate environment
    validateEnvironment();

    // Create MCP server instance
    const mcpServer = new MCPServer({
      name: RAILWAY_CONFIG.name,
      version: RAILWAY_CONFIG.version,
      maxConnections: RAILWAY_CONFIG.maxConnections,
      enableMetrics: RAILWAY_CONFIG.enableMetrics,
      enableCaching: RAILWAY_CONFIG.enableCaching,
      enableValidation: RAILWAY_CONFIG.enableValidation,
      enableAgentOrchestrator: RAILWAY_CONFIG.enableAgentOrchestrator
    });

    // Set API clients (these will be initialized in the MCP server)
    if (RAILWAY_CONFIG.openaiApiKey) {
      // OpenAI client will be set when agents are initialized
      Logger.info('✅ OpenAI API key configured');
    }
    
    if (RAILWAY_CONFIG.anthropicApiKey) {
      // Anthropic client will be set when agents are initialized
      Logger.info('✅ Anthropic API key configured');
    }

    // Start the server
    await mcpServer.start();
    
    Logger.info('🎉 MCP Server started successfully on Railway!');
    Logger.info(`🔗 Server listening on ${RAILWAY_CONFIG.host}:${RAILWAY_CONFIG.port}`);
    
    // Health check endpoint for Railway
    if (typeof mcpServer.server?.app?.get === 'function') {
      mcpServer.server.app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          server: RAILWAY_CONFIG.name,
          version: RAILWAY_CONFIG.version,
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development'
        });
      });
      
      Logger.info('✅ Health check endpoint configured: /health');
    }

    // Log deployment success
    Logger.info('🌟 Deployment complete - MCP server is ready for connections');

  } catch (error) {
    Logger.error('❌ Failed to start MCP server:', error);
    Logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', () => {
  Logger.info('📦 Received SIGTERM - Railway is shutting down the service');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('📦 Received SIGINT - Manual shutdown requested');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('💥 Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Start the server
startMCPServer();
