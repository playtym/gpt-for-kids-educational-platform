# 🎓 GPT for Kids - Integrated Educational Platform

A safe, educational AI platform for children with dual AI provider safety validation, age-appropriate content, and comprehensive learning tools.

## 🏗️ Project Structure

```
gpt-for-kids/
├── frontend/                    # React/TypeScript frontend application
│   ├── src/                    # Source code
│   ├── public/                 # Static assets
│   ├── dist/                   # Built application
│   └── package.json           # Frontend dependencies
├── backend/                    # Node.js/Express backend server
│   ├── src/                   # Source code
│   ├── config/                # Configuration files
│   ├── logs/                  # Application logs
│   └── package.json          # Backend dependencies
├── shared/                     # Shared types, utilities, and constants
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # Shared constants
│   └── utils/                 # Shared utility functions
├── docs/                      # Project documentation
│   ├── api/                   # API documentation
│   ├── safety/                # Safety guidelines and procedures
│   └── development/           # Development guides
├── scripts/                   # Build and deployment scripts
│   ├── build.sh              # Build script
│   ├── dev.sh                # Development script
│   └── deploy.sh             # Deployment script
├── deployment/                # Deployment configurations
│   ├── docker/               # Docker configurations
│   └── nginx/                # Nginx configurations
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Root package.json for workspace
├── README.md                # This file
└── LICENSE                  # License information
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Anthropic API key

### Setup
```bash
# Clone and navigate to project
cd gpt-for-kids

# Install all dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development servers
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/docs

## 🛡️ Safety Features

- **Dual AI Provider Validation**: OpenAI + Anthropic content safety
- **Age-Appropriate Filtering**: 4 age groups (5-7, 8-10, 11-13, 14-17)
- **Educational Focus**: All interactions promote learning
- **Content Monitoring**: Real-time safety status indicators

## 📚 Educational Tools

1. **Socratic Learning**: Guided discovery through questions
2. **Story Generation**: Educational stories with moral lessons
3. **Feedback System**: Constructive, encouraging feedback
4. **Question Generator**: Critical thinking prompts
5. **Adventure Explorer**: Gamified learning interface

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start both frontend and backend in development
npm run build        # Build both frontend and backend for production
npm run test         # Run all tests
npm run lint         # Lint all code
npm run format       # Format all code
npm run clean        # Clean build artifacts
```

### Project Commands

```bash
npm run frontend:dev     # Start only frontend
npm run frontend:build   # Build only frontend
npm run backend:dev      # Start only backend
npm run backend:build    # Build only backend
```

## 📖 Documentation

- [API Documentation](./docs/api/README.md)
- [Safety Guidelines](./docs/safety/SAFETY_GUIDELINES.md)
- [Development Guide](./docs/development/DEVELOPMENT.md)
- [Deployment Guide](./docs/deployment/DEPLOYMENT.md)

## 🎯 Compliance

This project strictly adheres to:
- Child safety requirements
- Educational value standards
- Age-appropriate content guidelines
- Technical security standards

See [PROJECT_NON_NEGOTIABLES.md](./docs/PROJECT_NON_NEGOTIABLES.md) for complete compliance details.

## 📄 License

[MIT License](./LICENSE)

## 🤝 Contributing

Please read our safety and educational guidelines before contributing. All contributions must maintain our zero-tolerance policy for inappropriate content and educational focus requirements.
