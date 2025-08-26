#!/bin/bash

# GPT for Kids - Vercel Deployment Script
echo "🚀 Deploying GPT for Kids to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel. Please login first:"
    echo "   Run: vercel login"
    echo ""
    echo "📝 After logging in, run this script again:"
    echo "   ./deploy.sh"
    echo ""
    exit 1
fi

echo "✅ Vercel authentication verified!"

# Test build locally first
echo "🔧 Testing build locally..."
npm run build:frontend

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Check for environment file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual API keys before continuing."
    echo "   You can also set them in Vercel dashboard later."
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📱 Your GPT for Kids app is now live!"
    echo "🔗 Check your Vercel dashboard for the URL"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Set environment variables in Vercel dashboard:"
    echo "      - OPENAI_API_KEY (required)"
    echo "      - ANTHROPIC_API_KEY (optional)"
    echo "      - NODE_ENV=production"
    echo "   2. Test the app on mobile devices"
    echo "   3. Share the URL with your users!"
    echo ""
else
    echo "❌ Deployment failed. Check the errors above."
    exit 1
fi
