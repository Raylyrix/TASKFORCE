# 🚀 Taskforce Mailer - Professional Email Analytics Platform

[![Version](https://img.shields.io/badge/version-4.0.1-blue.svg)](https://github.com/Raylyrix/TASKFORCE)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)](README.md)

## 🎯 Overview

Taskforce Mailer is a comprehensive email analytics platform that combines the power of desktop email automation with advanced AI-powered web analytics. Users can seamlessly access powerful email insights through a single click from their existing desktop application.

## ✨ Key Features

### 🔐 **Seamless Authentication**
- **OAuth2 Google Sign-in** - Secure, one-time authentication
- **Clear Auth Data** - Fresh login capability
- **JWT Token Management** - Secure session handling
- **Multi-tenant Architecture** - Organization-based access

### 🤖 **Advanced AI Analytics**
- **Natural Language Queries** - Ask questions in plain English
- **Sentiment Analysis** - Email tone detection and analysis
- **Predictive Analytics** - Forecast email patterns and workload
- **Smart Insights** - AI-generated recommendations
- **Relationship Health** - Contact interaction tracking
- **Priority Detection** - Automatic email prioritization

### 📊 **Professional Dashboard**
- **Real-time Metrics** - Live email volume and response times
- **Interactive Charts** - Beautiful data visualizations
- **Export Reports** - PDF, Excel, CSV formats
- **Custom Insights** - Personalized recommendations
- **Responsive Design** - Works on all devices

### 🔗 **Seamless Integration**
- **One-Click Access** - Analytics button in existing Electron app
- **No Additional Setup** - Uses existing authentication
- **Instant Analytics** - Immediate access to insights
- **Professional UI** - Modern, intuitive interface

## 🏗️ Architecture

```
taskforce-mailer/
├── apps/
│   ├── backend/          # Fastify API server
│   └── frontend/         # Next.js web application
├── services/
│   ├── ai-service/       # AI processing service
│   └── worker/           # Background job processing
├── packages/
│   └── shared/           # Shared utilities and types
├── rtx_innovations_electron/  # Desktop application
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
├── deployment/           # Demo and test files
└── tests/                # Test files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis (optional, for caching)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Raylyrix/TASKFORCE.git
   cd TASKFORCE
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   cd apps/backend
   npx prisma db push
   cd ../..
   ```

5. **Start all services**
   ```bash
   # Windows
   PowerShell -ExecutionPolicy Bypass -File scripts/start-production.ps1
   
   # Linux/Mac
   ./scripts/start-production.sh
   ```

### Access the Application

- **🌐 Web Dashboard**: http://localhost:3000
- **🔧 API Server**: http://localhost:4000
- **🤖 AI Service**: http://localhost:4001

## 🎯 User Experience

### For End Users
1. **Download and run** the Taskforce Mailer Electron app
2. **Sign in with Google** using the existing authentication
3. **Click "Analytics Dashboard"** to access advanced features
4. **Ask AI questions** like "What's my busiest day this week?"
5. **View real-time analytics** and professional insights

### For Developers
1. **Start services** using the provided scripts
2. **Test the system** with comprehensive test suite
3. **Access APIs** through the backend server
4. **Deploy** using Docker or traditional methods

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taskforce"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# OpenRouter AI
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENROUTER_MODEL="openai/gpt-3.5-turbo"

# Gmail API
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"

# Server
PORT=4000
AI_SERVICE_PORT=4001
FRONTEND_URL="http://localhost:3000"
```

## 📊 API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/status` - Check authentication status

### Analytics
- `GET /api/analytics/metrics` - Email metrics
- `GET /api/analytics/insights` - AI insights
- `GET /api/analytics/relationships` - Relationship health

### AI Features
- `POST /api/ai/query` - Natural language queries
- `POST /api/ai/sentiment` - Sentiment analysis
- `POST /api/ai/summary` - Email summarization

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:backend
pnpm test:frontend
pnpm test:ai

# Run production system test
PowerShell -ExecutionPolicy Bypass -File scripts/test-production-system.ps1
```

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
```bash
# Build all packages
pnpm build

# Start production services
PowerShell -ExecutionPolicy Bypass -File scripts/start-production.ps1
```

### Environment Setup
- **Development**: Local services with hot reload
- **Staging**: Docker containers with test data
- **Production**: Optimized builds with monitoring

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete user documentation
- **[Quick Start](docs/QUICK_START_GUIDE.md)** - Get started quickly
- **[API Reference](docs/API_REFERENCE.md)** - API documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[Features Showcase](docs/FEATURES_SHOWCASE.md)** - Feature overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Raylyrix/TASKFORCE/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Raylyrix/TASKFORCE/discussions)

## 🎉 Acknowledgments

- **OpenRouter** for AI model access
- **Google** for Gmail API integration
- **Next.js** for the modern web framework
- **Fastify** for the high-performance backend
- **Prisma** for database management

---

**Built with ❤️ for professional email management and analytics**
