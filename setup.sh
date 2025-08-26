#!/bin/bash

# GPT for Kids - Setup Script for Vercel Deployment
echo "🎯 GPT for Kids - Vercel Setup Guide"
echo "===================================="
echo ""

# Step 1: Install Vercel CLI
echo "📦 Step 1: Installing Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
else
    echo "✅ Vercel CLI already installed!"
fi

echo ""

# Step 2: Login to Vercel
echo "🔐 Step 2: Login to Vercel"
echo "-------------------------"
echo "Please run the following command and follow the prompts:"
echo ""
echo "   vercel login"
echo ""
echo "This will:"
echo "   • Open your browser"
echo "   • Ask you to sign in with GitHub/GitLab/Bitbucket"
echo "   • Generate an authentication token"
echo ""

# Step 3: Environment Variables
echo "🔑 Step 3: Environment Variables"
echo "-------------------------------"
echo "Before deploying, make sure you have:"
echo ""
echo "   • OpenAI API Key (required)"
echo "     Get one from: https://platform.openai.com/account/api-keys"
echo ""
echo "   • Anthropic API Key (optional)"
echo "     Get one from: https://console.anthropic.com/"
echo ""

# Step 4: Deploy
echo "🚀 Step 4: Deploy"
echo "----------------"
echo "After completing steps 1-3, run:"
echo ""
echo "   ./deploy.sh"
echo ""
echo "This will:"
echo "   • Build your app"
echo "   • Deploy to Vercel"
echo "   • Give you a live URL"
echo ""

echo "📱 Your mobile-optimized GPT for Kids app will be live!"
echo ""
echo "Need help? Check DEPLOYMENT.md for detailed instructions."
echo ""
