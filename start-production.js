#!/usr/bin/env node

/**
 * Production startup script for Railway deployment
 * Starts both backend and frontend services
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const FRONTEND_PORT = parseInt(PORT) + 1;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 Starting GPT for Kids - Full Application');
console.log(`Environment: ${NODE_ENV}`);
console.log(`Backend Port: ${PORT}`);
console.log(`Frontend Port: ${FRONTEND_PORT}`);

// Store process references
let backendProcess = null;
let frontendProcess = null;

// Function to start backend
function startBackend() {
  console.log('🖥️ Starting backend server...');
  
  backendProcess = spawn('npm', ['start'], {
    cwd: join(__dirname, 'backend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: PORT,
      NODE_ENV: NODE_ENV
    }
  });

  backendProcess.on('error', (error) => {
    console.error('Backend error:', error);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
    if (code !== 0) {
      process.exit(1);
    }
  });
}

// Function to start frontend
function startFrontend() {
  console.log('🌐 Starting frontend server...');
  
  frontendProcess = spawn('npm', ['run', 'preview', '--', '--host', '0.0.0.0', '--port', FRONTEND_PORT.toString()], {
    cwd: join(__dirname, 'frontend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: NODE_ENV
    }
  });

  frontendProcess.on('error', (error) => {
    console.error('Frontend error:', error);
  });

  frontendProcess.on('exit', (code) => {
    console.log(`Frontend exited with code ${code}`);
    if (code !== 0) {
      process.exit(1);
    }
  });
}

// Graceful shutdown
function shutdown() {
  console.log('🛑 Shutting down services...');
  
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

// Handle signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown();
});

// Start services
async function start() {
  try {
    // Start backend first
    startBackend();
    
    // Wait a moment for backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start frontend
    startFrontend();
    
    console.log('✅ Application started successfully!');
    console.log(`Backend: http://0.0.0.0:${PORT}`);
    console.log(`Frontend: http://0.0.0.0:${FRONTEND_PORT}`);
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();
