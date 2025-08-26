module.exports = {
  apps: [
    {
      name: 'gpt-for-kids-backend',
      script: './backend/server.js',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=4096',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      merge_logs: true,
      
      // Production optimizations
      max_restarts: 10,
      min_uptime: '10s',
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 3000
    },
    {
      name: 'gpt-for-kids-frontend',
      script: process.env.NODE_ENV === 'production' ? 'npx' : 'npm',
      args: process.env.NODE_ENV === 'production' ? 'serve -s dist -l 8080' : 'run dev',
      cwd: process.env.NODE_ENV === 'production' ? 
        '/Users/ankurgarg/Downloads/DeepCoach Presentation/Work Folders/Plural copy 2/gpt-for-kids/frontend' : 
        '/Users/ankurgarg/Downloads/DeepCoach Presentation/Work Folders/Plural copy 2/gpt-for-kids/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        HOST: '0.0.0.0'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true,
      merge_logs: true,
      
      // Production optimizations
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/gpt-for-kids.git',
      path: '/var/www/gpt-for-kids',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
