// Vercel serverless function for chat API
const OpenAI = require('openai');

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Simple agent response function
async function generateResponse(message, mode, ageGroup) {
  try {
    const client = openai;
    if (!client) {
      throw new Error('No AI client available');
    }

    const systemPrompt = `You are an educational AI assistant for children aged ${ageGroup}. 
    Mode: ${mode}. Provide age-appropriate, engaging, and educational responses.
    Keep responses fun, encouraging, and safe for children.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    const response = completion.choices[0].message.content;

    return {
      success: true,
      response: {
        type: mode,
        shortAnswer: response,
        followUpQuestions: [
          "What else would you like to learn about this topic?",
          "Can you think of examples from your daily life?",
          "Would you like to explore something related?"
        ],
        relatedTopics: [],
        relevantImage: null,
        ageGroup: ageGroup,
        inputType: "text"
      },
      mode,
      ageGroup,
      agent: "simplified",
      contextLength: 0,
      timestamp: new Date().toISOString(),
      suggestions: [],
      followUpQuestions: [
        "What else would you like to learn about this topic?",
        "Can you think of examples from your daily life?",
        "Would you like to explore something related?"
      ],
      topics: [],
      skills: [],
      cached: false
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      success: false,
      error: 'Failed to generate response',
      message: error.message
    };
  }
}

module.exports = async function handler(req, res) {
  // Enhanced CORS configuration
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gpt-for-kids-8nu0e48lv-playtymedu-gmailcoms-projects.vercel.app',
    'https://gpt-for-kids.vercel.app',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:5173'
  ];
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log request for debugging
    console.log('Chat API called:', {
      method: req.method,
      origin: req.headers.origin,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { message, mode = 'learn', ageGroup = '8-10' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const result = await generateResponse(message, mode, ageGroup);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
