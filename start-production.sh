#!/bin/bash

# Production startup script for Railway deployment
# This script starts both backend and frontend services

echo "🚀 Starting GPT for Kids - Full Application"
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-3000}"

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export FRONTEND_PORT=$((PORT + 1))

echo "Backend will run on port: $PORT"
echo "Frontend will run on port: $FRONTEND_PORT"

# Build frontend for production
echo "📦 Building frontend..."
cd frontend && npm run build
cd ..

# Start backend in background
echo "🖥️ Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend preview server
echo "🌐 Starting frontend server..."
cd frontend && npm run preview -- --host 0.0.0.0 --port $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

echo "✅ Application started successfully!"
echo "Backend: http://0.0.0.0:$PORT"
echo "Frontend: http://0.0.0.0:$FRONTEND_PORT"

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
