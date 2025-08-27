// Simple test endpoint to check OpenAI API key
const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  // Enhanced CORS configuration
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gpt-for-kids-qnotltal1-playtymedu-gmailcoms-projects.vercel.app',
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

  try {
    console.log('Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    console.log('OPENAI_API_KEY first 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10));

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not found',
        env: process.env.NODE_ENV 
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Attempting OpenAI API call...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Say hello!" }
      ],
      max_tokens: 10
    });

    console.log('OpenAI API call successful');

    return res.status(200).json({
      success: true,
      message: 'OpenAI API is working!',
      response: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Test OpenAI error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error type:', error.type);
    
    return res.status(500).json({
      error: 'OpenAI API test failed',
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorType: error.type,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
