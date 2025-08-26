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

  return res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    version: '1.0.0'
  });
};
