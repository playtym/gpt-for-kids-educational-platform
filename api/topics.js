// Vercel serverless function for topics API
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
    const { subject, ageGroup = '8-10' } = req.body;

    // Sample topics response
    const topics = [
      {
        id: 1,
        title: `Fun Facts about ${subject || 'Science'}`,
        description: `Discover amazing facts about ${subject || 'science'} that will blow your mind!`,
        difficulty: 'easy',
        estimatedTime: '10-15 minutes',
        category: subject || 'science'
      },
      {
        id: 2,
        title: `Interactive ${subject || 'Science'} Quiz`,
        description: `Test your knowledge with fun questions about ${subject || 'science'}!`,
        difficulty: 'medium',
        estimatedTime: '15-20 minutes',
        category: subject || 'science'
      },
      {
        id: 3,
        title: `${subject || 'Science'} Experiments at Home`,
        description: `Safe and fun experiments you can try at home!`,
        difficulty: 'medium',
        estimatedTime: '20-30 minutes',
        category: subject || 'science'
      }
    ];

    return res.status(200).json({
      success: true,
      topics,
      totalCount: topics.length,
      ageGroup,
      subject: subject || 'science'
    });

  } catch (error) {
    console.error('Topics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
