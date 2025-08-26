# GPT for Kids - Vercel Deployment Guide

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/gpt-for-kids)

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## 🛠️ Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: `Other`
   - Build Command: `npm run build:frontend`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ANTHROPIC_API_KEY=your_anthropic_api_key_here (optional)
     NODE_ENV=production
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add ANTHROPIC_API_KEY
   vercel env add NODE_ENV
   ```

## 🔧 Configuration Files

The project includes these Vercel-specific files:

- `vercel.json` - Vercel configuration
- `api/` - Serverless functions directory
  - `api/chat.js` - Main chat endpoint
  - `api/topics.js` - Topics generation
  - `api/quiz.js` - Quiz generation

## 🌍 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Your Anthropic API key (optional) |
| `NODE_ENV` | Yes | Set to `production` |

## 📱 Mobile Access

Once deployed, your app will be accessible on any device at:
```
https://your-project.vercel.app
```

The app is optimized for mobile with:
- ✅ Responsive design
- ✅ Touch-friendly interface
- ✅ Duolingo-inspired UI
- ✅ Progressive Web App features

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are in `package.json`
- Check that build command is correct: `npm run build:frontend`
- Verify TypeScript compilation passes

### API Errors
- Confirm environment variables are set correctly
- Check function logs in Vercel dashboard
- Ensure OpenAI API key has sufficient credits

### CORS Issues
- API functions include CORS headers
- Should work automatically with Vercel's routing

## 🔄 Auto-Deployment

Vercel automatically redeploys when you push to your main branch:

1. Make changes locally
2. Commit and push to Git
3. Vercel automatically builds and deploys
4. Changes go live in ~60 seconds

## 📊 Monitoring

- **Function Logs**: View in Vercel dashboard
- **Performance**: Built-in analytics
- **Errors**: Real-time error tracking

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] OpenAI API key working
- [ ] Mobile responsiveness tested
- [ ] Safety features validated
- [ ] Age-appropriate content verified
- [ ] Performance optimized

## 🚨 Security Notes

- API keys are secure in Vercel environment
- All requests include safety validation
- Age-appropriate content filtering active
- CORS properly configured

## 📞 Support

For deployment issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints directly
4. Review build output for errors

---

**Ready to deploy?** Follow the steps above and your GPT for Kids app will be live in minutes! 🎉
