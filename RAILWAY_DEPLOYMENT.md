# 🚀 Railway Deployment Guide for GPT for Kids MCP Server

## Quick Start (3 steps)

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Deploy using our script
```bash
./deploy-railway.sh
```

### 3. Set Environment Variables
In Railway Dashboard, add these required variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key

## Manual Deployment Steps

### Option A: Railway CLI (Recommended)

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Initialize project:**
   ```bash
   railway init
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Set environment variables:**
   ```bash
   railway variables set OPENAI_API_KEY=your_key_here
   railway variables set ANTHROPIC_API_KEY=your_key_here
   ```

### Option B: GitHub Integration

1. Push this code to GitHub
2. Connect repository in Railway Dashboard
3. Set environment variables in Railway Dashboard
4. Railway will auto-deploy

### Option C: Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables
5. Deploy

## Required Environment Variables

Set these in Railway Dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | Your OpenAI API key |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Your Anthropic API key |
| `NODE_ENV` | `production` | Environment mode |

## Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_SERVER_NAME` | `gpt-for-kids-educational-platform` | Server identifier |
| `ENABLE_MCP_LOGGING` | `true` | Enable MCP logging |
| `ENABLE_AGENT_ORCHESTRATOR` | `true` | Enable AI agents |
| `MAX_CONNECTIONS` | `50` | Max concurrent connections |
| `CACHE_TTL` | `3600` | Cache time-to-live (seconds) |

## Testing Your Deployment

After deployment, test your MCP server:

```bash
# Get your Railway URL
railway status

# Test health endpoint
curl https://your-app.railway.app/health

# Test MCP chat endpoint
curl -X POST https://your-app.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from Railway!",
    "mode": "explore", 
    "ageGroup": "8-10"
  }'
```

## Monitoring

Monitor your deployed MCP server:

```bash
# View logs
railway logs

# Check status
railway status

# Monitor metrics
railway metrics
```

## Troubleshooting

### Common Issues:

1. **Build fails**: Check dependencies in `package.json`
2. **Start fails**: Verify environment variables are set
3. **API errors**: Ensure API keys are valid and set correctly
4. **MCP issues**: Check logs for agent initialization errors

### Debug Commands:

```bash
# View recent logs
railway logs --tail 100

# Check environment variables
railway variables

# Restart service
railway redeploy
```

## File Structure

```
project/
├── railway.json           # Railway configuration
├── Procfile              # Process commands
├── deploy-railway.sh     # Deployment script
├── .env.railway.example  # Environment template
└── backend/
    ├── railway-start.js  # Railway startup script
    ├── package.json      # Dependencies
    └── mcp-core/         # MCP server code
```

## Security Notes

- API keys are encrypted in Railway
- HTTPS is automatically provided
- Environment variables are secure
- Health checks monitor service status

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Project Issues](https://github.com/your-repo/issues)
