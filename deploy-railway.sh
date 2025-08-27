#!/bin/bash

# Railway Deployment Script for GPT for Kids MCP Server
# This script automates the deployment process to Railway

set -e  # Exit on any error

echo "🚀 Deploying GPT for Kids MCP Server to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged into Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

# Environment variables that should be set in Railway dashboard
echo "📋 Required Environment Variables (set these in Railway dashboard):"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - NODE_ENV=production"
echo "   - ENABLE_MCP_LOGGING=true"
echo "   - ENABLE_AGENT_ORCHESTRATOR=true"
echo ""

# Initialize project if not already done
if [ ! -f ".railway/railway.toml" ]; then
    echo "🔧 Initializing Railway project..."
    railway init
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo "🌐 Getting deployment information..."
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "Not available yet")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Service: GPT for Kids MCP Server"
echo "   - Environment: Production"
echo "   - URL: $RAILWAY_URL"
echo ""
echo "🔗 Access your MCP server at:"
echo "   - Health Check: $RAILWAY_URL/health"
echo "   - MCP WebSocket: $RAILWAY_URL/mcp"
echo ""
echo "📊 Monitor your deployment:"
echo "   - Railway Dashboard: https://railway.app/dashboard"
echo "   - Logs: railway logs"
echo "   - Status: railway status"
echo ""
echo "🔧 Post-deployment checklist:"
echo "   1. Verify environment variables are set"
echo "   2. Test health endpoint: curl $RAILWAY_URL/health"
echo "   3. Monitor logs for any errors: railway logs"
echo "   4. Test MCP functionality with a client"
echo ""
echo "🎉 Your MCP server is now deployed and running on Railway!"
