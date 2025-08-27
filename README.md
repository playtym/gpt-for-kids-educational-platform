# Railway Deployment for GPT for Kids - MCP Server

This project deploys the MCP (Model Context Protocol) server on Railway for persistent hosting.

## Architecture

- **Backend**: Node.js Express server with MCP protocol support
- **MCP Server**: Microservices architecture with educational agents
- **Platform**: Railway (Persistent deployment)

## Environment Variables Required

Set these in Railway dashboard:

```bash
# AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# MCP Configuration
MCP_SERVER_NAME=gpt-for-kids-educational-platform
MCP_SERVER_VERSION=2.0.0
ENABLE_MCP_LOGGING=true
ENABLE_AGENT_ORCHESTRATOR=true

# Optional: Caching and Performance
CACHE_TTL=3600
ENABLE_METRICS=true
MAX_CONNECTIONS=50
```

## Deployment Instructions

### Option 1: Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Deploy:
```bash
railway up
```

### Option 2: GitHub Integration

1. Push this code to a GitHub repository
2. Connect Repository in Railway Dashboard
3. Railway will auto-deploy from the main branch

### Option 3: Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Configure environment variables

## Verification

After deployment, verify the MCP server is running:

```bash
# Check server health
curl https://your-railway-domain.railway.app/health

# Test MCP endpoint
curl https://your-railway-domain.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "mode": "explore", "ageGroup": "8-10"}'
```

## Service Endpoints

- **Health Check**: `GET /health`
- **Chat API**: `POST /api/chat`
- **MCP WebSocket**: `WS /mcp`
- **Metrics**: `GET /metrics` (if enabled)

## Monitoring

Railway provides built-in monitoring:
- Deployment logs
- Resource usage
- Uptime monitoring
- Custom metrics (if configured)

## Scaling

Railway automatically handles:
- Auto-scaling based on traffic
- Load balancing
- SSL termination
- CDN integration

## Troubleshooting

Common issues and solutions:

1. **Build Failures**: Check `package.json` dependencies
2. **Start Failures**: Verify `PORT` and `HOST` environment variables
3. **API Errors**: Ensure `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are set
4. **MCP Issues**: Check MCP agent initialization logs

## Local Development

To run locally:

```bash
cd backend
npm install
npm run dev
```

## File Structure

```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── mcp-core/              # MCP server implementation
│   ├── MCPServer.js       # Main MCP server
│   ├── MCPToolRegistry.js # Tool management
│   └── ...
├── agents/                # Educational AI agents
├── routes/                # API routes
└── services/              # Core services
```
