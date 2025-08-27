#!/usr/bin/env node

/**
 * Minimal server for Railway deployment testing
 * This ensures the deployment pipeline works before adding complexity
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from frontend dist
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'GPT for Kids - Minimal Server',
    port: PORT
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'GPT for Kids API is running',
    timestamp: new Date().toISOString(),
    frontend: 'available',
    backend: 'running'
  });
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Frontend not available');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GPT for Kids server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
