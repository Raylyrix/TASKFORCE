# 🚀 Taskforce Analytics v1.1.0

> **Professional Email Analytics Platform with Gmail OAuth and AI Insights**

[![CI/CD Pipeline](https://github.com/username/taskforce-analytics/workflows/CI/badge.svg)](https://github.com/username/taskforce-analytics/actions)
[![Security Scan](https://github.com/username/taskforce-analytics/workflows/Security/badge.svg)](https://github.com/username/taskforce-analytics/actions)
[![Docker Build](https://github.com/username/taskforce-analytics/workflows/Docker/badge.svg)](https://github.com/username/taskforce-analytics/actions)

## 🎯 Overview

Taskforce Analytics is a comprehensive email intelligence platform that transforms your Gmail data into actionable insights. Built with modern technologies and AI integration, it provides professional analytics, automated reporting, and intelligent recommendations.

### ✨ Key Features

- 🔐 **Gmail OAuth Integration** - Secure authentication with Google accounts
- 📊 **Real-time Analytics** - Live email volume, response times, and contact health
- 🤖 **AI-Powered Insights** - Intelligent analysis and recommendations
- 📄 **Professional Reports** - PDF, Excel, and email reports with automation
- 📅 **Scheduled Reporting** - Daily, weekly, and monthly automated reports
- 🎨 **Modern Dashboard** - Beautiful React interface with dark/light themes
- 🔒 **Enterprise Security** - JWT authentication, role-based access, audit logging

## 🏗️ Architecture

### Tech Stack

**Backend**
- **Fastify** - High-performance Node.js API server
- **PostgreSQL** - Primary database with Prisma ORM
- **Redis** - Caching and background job queues
- **BullMQ** - Background job processing
- **OpenRouter** - AI/LLM integration

**Frontend**
- **Next.js 14** - React framework with SSR
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **React Query** - Data fetching and caching
- **TypeScript** - Type-safe development

**AI & Analytics**
- **OpenRouter API** - LLM access (nvidia/nemotron-nano-9b-v2:free)
- **Custom Analytics Engine** - Real-time metrics calculation
- **Background Workers** - Automated data processing

**Infrastructure**
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **PM2** - Process management
- **Trivy** - Security scanning

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Service    │
│   (Next.js)     │◄──►│   (Fastify)     │◄──►│   (OpenRouter)  │
│   Port: 3000    │    │   Port: 4000    │    │   Port: 4001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Worker        │              │
         │              │   (BullMQ)      │              │
         │              │   Background    │              │
         │              │   Processing    │              │
         │              └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   + Redis       │
                    │   Database      │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **PostgreSQL** 15+
- **Redis** 7+
- **Google Cloud Console** project with Gmail API enabled

### 1. Clone Repository

```bash
git clone https://github.com/username/taskforce-analytics.git
cd taskforce-analytics
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Update .env with your credentials:
# - Gmail OAuth credentials
# - Database connection
# - OpenRouter API key
# - SMTP settings (optional)
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Database Setup

```bash
# Create database
createdb TASKFORCE

# Run migrations
pnpm --filter backend prisma migrate dev

# Seed demo data
pnpm --filter backend prisma db seed
```

### 5. Start Development

```bash
# Start all services
pnpm dev

# Or start individually:
pnpm dev:backend    # Backend API (port 4000)
pnpm dev:frontend   # Frontend (port 3000)
pnpm dev:worker     # Background worker
pnpm dev:ai         # AI service (port 4001)
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **AI Service**: http://localhost:4001
- **Health Check**: http://localhost:4000/health

## 🔧 Configuration

### Gmail OAuth Setup

1. **Google Cloud Console**:
   - Create OAuth 2.0 Web Application credentials
   - Add authorized redirect URIs:
     - `http://localhost:4000/auth/google/callback`
     - `http://localhost:3000/auth/callback`
   - Enable Gmail API

2. **Environment Variables**:
```bash
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"
```

### Database Configuration

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/TASKFORCE"
REDIS_URL="redis://localhost:6379"
```

### AI Integration

```bash
OPENROUTER_API_KEY="sk-or-v1-your-api-key"
OPENROUTER_MODEL="nvidia/nemotron-nano-9b-v2:free"
CONSENT_CONTENT=true  # Enable AI content analysis
```

## 📊 Features

### Analytics Dashboard

- **Email Volume** - Sent/received trends over time
- **Response Times** - Average, median, fastest, slowest
- **Contact Health** - Relationship scoring and engagement
- **Top Contacts** - Most active email relationships
- **Thread Analysis** - Conversation length and patterns

### AI-Powered Insights

- **Natural Language Queries** - Ask questions about your email data
- **Smart Summaries** - AI-generated thread and message summaries
- **Priority Prediction** - Intelligent email prioritization
- **Sentiment Analysis** - Email tone classification
- **Recommendations** - Actionable improvement suggestions

### Professional Reports

- **PDF Reports** - Executive summaries with charts
- **Excel Exports** - Multi-sheet data analysis
- **Email Delivery** - Automated stakeholder reports
- **Scheduled Automation** - Daily/weekly/monthly reports
- **Custom Templates** - Multiple professional formats

## 🔒 Security

- **OAuth 2.0** - Industry-standard authentication
- **JWT Tokens** - Secure session management
- **Input Validation** - Zod schema validation
- **SQL Injection Prevention** - Prisma ORM protection
- **CORS Configuration** - Cross-origin request security
- **Audit Logging** - Comprehensive access tracking

## 🚀 Deployment

### Docker Deployment

```bash
# Build and start all services
pnpm docker:build
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

### Production Deployment

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
```

### GitHub Actions

The repository includes a complete CI/CD pipeline:

- **Automated Testing** - Unit and integration tests
- **Security Scanning** - Trivy vulnerability detection
- **Docker Build** - Multi-service container creation
- **Multi-Environment** - Staging and production deployments

## 📈 API Documentation

### Authentication

```bash
# OAuth initiation
GET /auth/google

# OAuth callback
GET /auth/google/callback

# Check auth status
GET /auth/status

# Logout
POST /auth/logout
```

### Analytics

```bash
# Dashboard overview
GET /api/v1/analytics/overview

# Email volume data
GET /api/v1/analytics/volume

# Response time metrics
GET /api/v1/analytics/response-times

# Contact health data
GET /api/v1/analytics/contacts

# Thread analysis
GET /api/v1/analytics/threads
```

### AI Features

```bash
# Natural language query
POST /api/v1/ai/query

# Thread summarization
POST /api/v1/ai/summarize

# Message analysis
POST /api/v1/ai/analyze

# Smart reply generation
POST /api/v1/ai/draft
```

### Reports

```bash
# Generate report
POST /api/v1/reports/generate

# Download report
GET /api/v1/reports/download/:filename

# Report history
GET /api/v1/reports

# Schedule report
POST /api/v1/reports/schedule
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm --filter backend test
pnpm --filter frontend test

# Test OAuth integration
node scripts/test-oauth-integration.js

# Environment validation
node scripts/check-env.js
```

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete installation instructions
- **[OAuth Integration](docs/OAUTH.md)** - Gmail OAuth configuration
- **[API Reference](docs/API.md)** - Complete endpoint documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production setup
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/username/taskforce-analytics/wiki)
- **Issues**: [GitHub Issues](https://github.com/username/taskforce-analytics/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/taskforce-analytics/discussions)
- **Email**: support@taskforce.com

## 🎉 Acknowledgments

- **OpenRouter** - AI/LLM API access
- **Google** - Gmail API and OAuth
- **Prisma** - Database ORM
- **Fastify** - High-performance web framework
- **Next.js** - React framework
- **Tailwind CSS** - Utility-first CSS

---

**🚀 Ready to revolutionize your email analytics?**

Start with Gmail OAuth integration and discover insights you never knew existed in your email data!

[![Deploy with GitHub Actions](https://github.com/username/taskforce-analytics/workflows/Deploy/badge.svg)](https://github.com/username/taskforce-analytics/actions)