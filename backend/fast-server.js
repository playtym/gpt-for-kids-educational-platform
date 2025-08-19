#!/usr/bin/env node

/**
 * GPT for Kids - FastAPI Style HTTP Server
 * A standalone web server for safe, educational AI interactions with children
 * No external dependencies - runs completely independently
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const CONFIG = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxTokens: 1000
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1000
  },
  ageGroups: {
    '5-7': { grade: 'kindergarten-1st', vocabulary: 'simple', complexity: 'basic' },
    '8-10': { grade: '2nd-4th', vocabulary: 'elementary', complexity: 'intermediate' },
    '11-13': { grade: '5th-7th', vocabulary: 'middle', complexity: 'advanced' },
    '14-17': { grade: '8th-12th', vocabulary: 'high-school', complexity: 'complex' }
  },
  contentFilters: {
    inappropriate: ['violence', 'adult content', 'scary', 'political bias', 'commercial', 'dangerous activities'],
    educational: ['science', 'math', 'reading', 'creativity', 'critical thinking', 'social skills']
  }
};

// Initialize LLM clients
let openai = null;
let anthropic = null;

if (CONFIG.openai.apiKey) {
  openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });
}

if (CONFIG.anthropic.apiKey) {
  anthropic = new Anthropic({ apiKey: CONFIG.anthropic.apiKey });
}

// Logging utility
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
  }

  static info(message, data) { this.log('info', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static error(message, data) { this.log('error', message, data); }
}

// Content Safety Manager
class ContentSafetyManager {
  static async isContentSafe(content, ageGroup, role = 'primary') {
    try {
      const prompt = `
        Analyze this content for age-appropriateness for children aged ${ageGroup}:
        
        Content: "${content}"
        
        Check for:
        1. Violence or scary content
        2. Adult themes
        3. Inappropriate language
        4. Dangerous activities
        5. Commercial content
        6. Political bias
        
        Respond with only: SAFE or UNSAFE
        If UNSAFE, briefly explain why.
      `;

      const client = role === 'primary' ? openai : anthropic;
      let response;

      if (role === 'primary' && openai) {
        response = await client.chat.completions.create({
          model: CONFIG.openai.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0
        });
        return response.choices[0].message.content.trim();
      } else if (role === 'secondary' && anthropic) {
        response = await client.messages.create({
          model: CONFIG.anthropic.model,
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        });
        return response.content[0].text.trim();
      } else {
        return 'SAFE - No API client available';
      }
    } catch (error) {
      Logger.error('Content safety check failed', { error: error.message });
      return 'UNSAFE - Error in safety check';
    }
  }

  static async doubleCheckSafety(content, ageGroup) {
    const [primaryCheck, secondaryCheck] = await Promise.all([
      this.isContentSafe(content, ageGroup, 'primary'),
      this.isContentSafe(content, ageGroup, 'secondary')
    ]);

    const isPrimarySafe = primaryCheck.startsWith('SAFE');
    const isSecondarySafe = secondaryCheck.startsWith('SAFE');

    if (!isPrimarySafe || !isSecondarySafe) {
      Logger.warn('Content flagged as unsafe', {
        primaryCheck,
        secondaryCheck,
        content: content.substring(0, 100)
      });
      return {
        safe: false,
        reason: `Primary: ${primaryCheck}, Secondary: ${secondaryCheck}`
      };
    }

    return { safe: true };
  }
}

// Socratic Learning Assistant
class SocraticLearningAssistant {
  static async generateSocraticResponse(question, studentResponse, ageGroup, subject) {
    if (!openai) {
      throw new Error('OpenAI client not available. Please check your API key.');
    }

    const ageConfig = CONFIG.ageGroups[ageGroup];
    
    const prompt = `
      You are a Socratic tutor for ${ageConfig.grade} students. Use the Socratic method to guide learning.
      
      Subject: ${subject}
      Student's question/response: "${studentResponse}"
      
      Guidelines:
      - Use ${ageConfig.vocabulary} vocabulary
      - Ask thought-provoking questions that lead to discovery
      - Don't give direct answers; guide with questions
      - Be encouraging and patient
      - Use examples appropriate for age ${ageGroup}
      
      Respond with a guiding question or gentle prompt that helps the student think deeper.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: CONFIG.openai.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: CONFIG.openai.maxTokens,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      const safetyCheck = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
      
      if (!safetyCheck.safe) {
        return `I need to think of a better way to help you with that question. Let's try a different approach!`;
      }

      return content;
    } catch (error) {
      Logger.error('Socratic response generation failed', { error: error.message });
      throw error;
    }
  }
}

// Educational Tools
class EducationalTools {
  static async generateStory(topic, ageGroup, duration = 'short') {
    if (!anthropic) {
      return `Once upon a time, there was a curious student just like you who loved to learn new things every day...`;
    }

    const ageConfig = CONFIG.ageGroups[ageGroup];
    const length = duration === 'short' ? '2-3 paragraphs' : '4-5 paragraphs';
    
    const prompt = `
      Create an engaging, educational story for ${ageConfig.grade} students about: ${topic}
      
      Requirements:
      - ${length} long
      - Age-appropriate for ${ageGroup} year olds
      - Educational value
      - Positive message
      - ${ageConfig.vocabulary} vocabulary
      - Include a gentle lesson or moral
    `;

    const response = await anthropic.messages.create({
      model: CONFIG.anthropic.model,
      max_tokens: CONFIG.anthropic.maxTokens,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });

    const content = response.content[0].text;
    const safetyCheck = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
    
    if (!safetyCheck.safe) {
      return `Once upon a time, there was a curious student just like you who loved to learn new things every day...`;
    }

    return content;
  }

  static async describeImage(imageDescription, ageGroup) {
    if (!openai) {
      return `That's an interesting picture! Can you tell me what you see in it?`;
    }

    const ageConfig = CONFIG.ageGroups[ageGroup];
    
    const prompt = `
      Describe this image for a ${ageConfig.grade} student using ${ageConfig.vocabulary} vocabulary:
      
      Image: ${imageDescription}
      
      Make it educational, engaging, and ask a question to promote thinking.
      Keep it age-appropriate and encouraging.
    `;

    const response = await openai.chat.completions.create({
      model: CONFIG.openai.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: CONFIG.openai.maxTokens,
      temperature: 0.8
    });

    const content = response.choices[0].message.content;
    const safetyCheck = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
    
    if (!safetyCheck.safe) {
      return `That's an interesting picture! Can you tell me what you see in it?`;
    }

    return content;
  }

  static async provideFeedback(studentWork, type, ageGroup) {
    if (!openai) {
      return `Great job working on your ${type}! Keep practicing and you'll keep getting better!`;
    }

    const ageConfig = CONFIG.ageGroups[ageGroup];
    
    const prompt = `
      Provide encouraging, constructive feedback on this student's ${type} for a ${ageConfig.grade} level:
      
      Student work: "${studentWork}"
      
      Guidelines:
      - Be very encouraging and positive
      - Highlight what they did well
      - Suggest one small improvement
      - Use ${ageConfig.vocabulary} vocabulary
      - End with motivation to keep learning
    `;

    const response = await openai.chat.completions.create({
      model: CONFIG.openai.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: CONFIG.openai.maxTokens,
      temperature: 0.6
    });

    const content = response.choices[0].message.content;
    const safetyCheck = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
    
    if (!safetyCheck.safe) {
      return `Great job working on your ${type}! Keep practicing and you'll keep getting better!`;
    }

    return content;
  }

  static async generateThoughtfulQuestion(topic, ageGroup) {
    if (!openai) {
      return `What do you think is the most interesting thing about ${topic}?`;
    }

    const ageConfig = CONFIG.ageGroups[ageGroup];
    
    const prompt = `
      Generate a thought-provoking question about "${topic}" for ${ageConfig.grade} students.
      
      The question should:
      - Encourage critical thinking
      - Be appropriate for age ${ageGroup}
      - Use ${ageConfig.vocabulary} vocabulary
      - Have no single "right" answer
      - Promote discussion and reflection
    `;

    const response = await openai.chat.completions.create({
      model: CONFIG.openai.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    const safetyCheck = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);
    
    if (!safetyCheck.safe) {
      return `What do you think is the most interesting thing about ${topic}?`;
    }

    return content;
  }
}

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin provided, allowing request');
      return callback(null, true);
    }
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:3001'
    ];
    
    console.log('Allowed origins:', allowedOrigins);
    console.log('Checking origin:', origin);
    console.log('Is allowed?', allowedOrigins.includes(origin));
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocking origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for web interface
app.use('/static', express.static(path.join(__dirname, 'web')));

// Validation middleware
const validateAgeGroup = (req, res, next) => {
  const { ageGroup } = req.body;
  if (!ageGroup || !CONFIG.ageGroups[ageGroup]) {
    return res.status(400).json({
      error: 'Invalid age group',
      validAgeGroups: Object.keys(CONFIG.ageGroups)
    });
  }
  next();
};

// API Routes

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    name: 'GPT for Kids - FastAPI Style Server',
    version: '1.0.0',
    description: 'Safe, educational AI interactions for children',
    status: 'running',
    apiEndpoints: {
      '/api/socratic': 'POST - Socratic learning interactions',
      '/api/story': 'POST - Generate educational stories',
      '/api/describe': 'POST - Describe images educationally',
      '/api/feedback': 'POST - Provide constructive feedback',
      '/api/question': 'POST - Generate thoughtful questions',
      '/api/safety-check': 'POST - Check content safety',
      '/health': 'GET - Health check',
      '/docs': 'GET - API documentation'
    },
    ageGroups: Object.keys(CONFIG.ageGroups),
    safetyFeatures: [
      'Dual AI provider safety checking',
      'Age-appropriate content filtering',
      'Educational focus',
      'Content sanitization'
    ],
    apiStatus: {
      openai: !!openai,
      anthropic: !!anthropic
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    apiConnections: {
      openai: !!openai,
      anthropic: !!anthropic
    },
    version: '1.0.0'
  });
});

// Socratic learning endpoint
app.post('/api/socratic', validateAgeGroup, async (req, res) => {
  try {
    const { question, subject, ageGroup, studentResponse } = req.body;
    
    if (!question || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: question, subject'
      });
    }

    const response = await SocraticLearningAssistant.generateSocraticResponse(
      question, 
      studentResponse || question, 
      ageGroup, 
      subject
    );

    res.json({
      success: true,
      response,
      ageGroup,
      subject,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Socratic learning error', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate Socratic response',
      message: error.message
    });
  }
});

// Story generation endpoint
app.post('/api/story', validateAgeGroup, async (req, res) => {
  try {
    const { topic, ageGroup, duration = 'short' } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Missing required field: topic'
      });
    }

    const story = await EducationalTools.generateStory(topic, ageGroup, duration);

    res.json({
      success: true,
      story,
      topic,
      ageGroup,
      duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Story generation error', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate story',
      message: error.message
    });
  }
});

// Image description endpoint
app.post('/api/describe', validateAgeGroup, async (req, res) => {
  try {
    const { imageDescription, ageGroup } = req.body;
    
    if (!imageDescription) {
      return res.status(400).json({
        error: 'Missing required field: imageDescription'
      });
    }

    const description = await EducationalTools.describeImage(imageDescription, ageGroup);

    res.json({
      success: true,
      description,
      originalImage: imageDescription,
      ageGroup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Image description error', { error: error.message });
    res.status(500).json({
      error: 'Failed to describe image',
      message: error.message
    });
  }
});

// Feedback endpoint
app.post('/api/feedback', validateAgeGroup, async (req, res) => {
  try {
    const { studentWork, type, ageGroup } = req.body;
    
    if (!studentWork || !type) {
      return res.status(400).json({
        error: 'Missing required fields: studentWork, type'
      });
    }

    const feedback = await EducationalTools.provideFeedback(studentWork, type, ageGroup);

    res.json({
      success: true,
      feedback,
      type,
      ageGroup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Feedback generation error', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate feedback',
      message: error.message
    });
  }
});

// Thoughtful question endpoint
app.post('/api/question', validateAgeGroup, async (req, res) => {
  try {
    const { topic, ageGroup } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Missing required field: topic'
      });
    }

    const question = await EducationalTools.generateThoughtfulQuestion(topic, ageGroup);

    res.json({
      success: true,
      question,
      topic,
      ageGroup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Question generation error', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate question',
      message: error.message
    });
  }
});

// Safety check endpoint
app.post('/api/safety-check', validateAgeGroup, async (req, res) => {
  try {
    const { content, ageGroup } = req.body;
    
    if (!content) {
      return res.status(400).json({
        error: 'Missing required field: content'
      });
    }

    const safetyResult = await ContentSafetyManager.doubleCheckSafety(content, ageGroup);

    res.json({
      success: true,
      safetyResult,
      content: content.substring(0, 100) + '...',
      ageGroup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Safety check error', { error: error.message });
    res.status(500).json({
      error: 'Failed to check content safety',
      message: error.message
    });
  }
});

// Documentation endpoint
app.get('/docs', (req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>GPT for Kids API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .method { color: #fff; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
            .post { background: #28a745; }
            .get { background: #007bff; }
            pre { background: #333; color: #fff; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>🎓 GPT for Kids API Documentation</h1>
        <p>Safe, educational AI interactions for children with built-in safety features.</p>
        
        <h2>📋 Available Endpoints</h2>
        
        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/socratic</h3>
            <p>Engage in Socratic dialogue to guide student learning</p>
            <pre>{
  "question": "What makes plants green?",
  "subject": "science",
  "ageGroup": "8-10",
  "studentResponse": "I think it's because of chlorophyll"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/story</h3>
            <p>Generate educational stories</p>
            <pre>{
  "topic": "friendship",
  "ageGroup": "5-7",
  "duration": "short"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/describe</h3>
            <p>Describe images in educational terms</p>
            <pre>{
  "imageDescription": "A picture of a butterfly on a flower",
  "ageGroup": "8-10"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/feedback</h3>
            <p>Provide constructive feedback on student work</p>
            <pre>{
  "studentWork": "The cat ran fast to catch the mouse.",
  "type": "creative-writing",
  "ageGroup": "8-10"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/question</h3>
            <p>Generate thought-provoking questions</p>
            <pre>{
  "topic": "space exploration",
  "ageGroup": "11-13"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method post">POST</span> /api/safety-check</h3>
            <p>Check if content is safe for specified age group</p>
            <pre>{
  "content": "Let's learn about dinosaurs!",
  "ageGroup": "5-7"
}</pre>
        </div>
        
        <h2>🛡️ Safety Features</h2>
        <ul>
            <li>Dual AI provider safety checking (OpenAI + Anthropic)</li>
            <li>Age-appropriate content filtering</li>
            <li>Educational focus and Socratic method</li>
            <li>Content sanitization and validation</li>
        </ul>
        
        <h2>👶 Age Groups</h2>
        <ul>
            <li><strong>5-7:</strong> Kindergarten-1st grade (simple vocabulary)</li>
            <li><strong>8-10:</strong> 2nd-4th grade (elementary vocabulary)</li>
            <li><strong>11-13:</strong> 5th-7th grade (middle vocabulary)</li>
            <li><strong>14-17:</strong> 8th-12th grade (high-school vocabulary)</li>
        </ul>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  Logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong, please try again later.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /docs',
      'POST /api/socratic',
      'POST /api/story',
      'POST /api/describe',
      'POST /api/feedback',
      'POST /api/question',
      'POST /api/safety-check'
    ]
  });
});

// Start server
const server = app.listen(CONFIG.server.port, CONFIG.server.host, () => {
  Logger.info(`🚀 GPT for Kids FastAPI Server started!`);
  Logger.info(`📍 Server running at: http://${CONFIG.server.host}:${CONFIG.server.port}`);
  Logger.info(`📖 API Documentation: http://${CONFIG.server.host}:${CONFIG.server.port}/docs`);
  Logger.info(`🛡️  Safety features: Dual AI provider checking enabled`);
  Logger.info(`🔑 API Status: OpenAI=${!!openai}, Anthropic=${!!anthropic}`);
  
  if (!openai || !anthropic) {
    Logger.warn('⚠️  Some API clients are not configured. Please check your environment variables.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
