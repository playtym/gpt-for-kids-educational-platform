// Vercel serverless function for quiz API
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
    const { topic, difficulty = 'easy', ageGroup = '8-10', questionCount = 5 } = req.body;

    // Sample quiz response
    const quiz = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${topic || 'Science'} Quiz`,
      description: `Test your knowledge about ${topic || 'science'}!`,
      difficulty,
      ageGroup,
      questions: Array.from({ length: questionCount }, (_, i) => ({
        id: i + 1,
        question: `What is an interesting fact about ${topic || 'science'}? (Question ${i + 1})`,
        options: [
          `Amazing fact A about ${topic || 'science'}`,
          `Interesting fact B about ${topic || 'science'}`,
          `Cool fact C about ${topic || 'science'}`,
          `Fun fact D about ${topic || 'science'}`
        ],
        correctAnswer: 0,
        explanation: `This is a great question about ${topic || 'science'}! The correct answer teaches us something important.`,
        points: 10
      })),
      totalPoints: questionCount * 10,
      timeLimit: questionCount * 60 // 1 minute per question
    };

    return res.status(200).json({
      success: true,
      quiz,
      topic: topic || 'science',
      difficulty,
      ageGroup
    });

  } catch (error) {
    console.error('Quiz API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
