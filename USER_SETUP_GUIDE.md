# 🚀 Taskforce Mailer - User Setup Guide

## Quick Start (Recommended)

### 1. Prerequisites
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/download/)
- **Redis**: Install via Docker or [redis.io](https://redis.io/download)
- **Git**: Download from [git-scm.com](https://git-scm.com/)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Raylyrix/TASKFORCE.git
cd TASKFORCE

# Install dependencies
pnpm install

# Create environment file
copy env.example .env

# Start services
pnpm start:production
```

### 3. Access the Application
- **Web App**: http://localhost:3000
- **Desktop App**: Run `rtx_innovations_electron/dist/TaskForceMailer.exe`

## 🔧 Detailed Setup

### Database Setup
1. **Install PostgreSQL**
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Use password: `postgres` (or update .env file)
   - Create database: `TASKFORCE`

2. **Install Redis**
   - **Option A (Docker)**: `docker run -d --name my-redis -p 6379:6379 redis:alpine`
   - **Option B (Manual)**: Download from [redis.io](https://redis.io/download)

### Environment Configuration
The `.env` file contains all necessary configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/TASKFORCE"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="TASKFORCE"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (Change in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# OpenRouter AI
OPENROUTER_API_KEY="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"
OPENROUTER_MODEL="nvidia/nemotron-nano-9b-v2:free"

# Gmail API (Web Application OAuth Client)
GMAIL_CLIENT_ID="1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="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"
GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"
FRONTEND_URL="http://localhost:3000"

# Server Ports
PORT=4000
AI_SERVICE_PORT=4001
AI_SERVICE_URL="http://localhost:4001"
NODE_ENV="development"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Database connection failed"
**Solution**: Ensure PostgreSQL is running and credentials match
```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL
pg_ctl start
```

#### 2. "Redis connection failed"
**Solution**: Start Redis service
```bash
# Docker method
docker start my-redis

# Manual method
redis-server
```

#### 3. "Port already in use"
**Solution**: Kill processes using required ports
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

#### 4. "OAuth authentication failed"
**Solution**: Check OAuth credentials in Google Cloud Console
- Web App: Use `1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com`
- Desktop App: Use `1007595181381-n1ildiigmoupnn78n8ekkhlulsfigbfk.apps.googleusercontent.com`

#### 5. "Build failed"
**Solution**: Clear cache and reinstall
```bash
# Clear all caches
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstall
pnpm install
pnpm build
```

### Service Health Checks

#### Check Backend API
```bash
curl http://localhost:4000/health
```

#### Check AI Service
```bash
curl http://localhost:4001/health
```

#### Check Frontend
```bash
curl http://localhost:3000
```

## 🔐 OAuth Setup

### Google Cloud Console Configuration

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID

2. **Web Application Credentials**
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:4000/auth/google/callback`
   - Client ID: `1007595181381-dd7o4v4jh01b1pcar6a681hj6pmjdsnp.apps.googleusercontent.com`

3. **Desktop Application Credentials**
   - Application type: Desktop application
   - Client ID: `1007595181381-n1ildiigmoupnn78n8ekkhlulsfigbfk.apps.googleusercontent.com`

## 📱 Desktop App Setup

### Building the Desktop App
```bash
cd rtx_innovations_electron
npm install
npm run build
```

### Running the Desktop App
```bash
# Development
npm run dev

# Production
npm start
```

## 🐳 Docker Setup (Alternative)

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔍 Debugging

### Enable Debug Logging
```bash
# Set debug environment
export DEBUG=*
pnpm dev
```

### Check Logs
```bash
# Backend logs
tail -f apps/backend/logs/app.log

# AI Service logs
tail -f services/ai-service/logs/app.log

# Worker logs
tail -f services/worker/logs/app.log
```

## 📊 Features

### Web Application
- **Real-time Analytics**: Live email performance metrics
- **AI Insights**: Automated email analysis and recommendations
- **Professional Reports**: Generate detailed analytics reports
- **Team Collaboration**: Multi-user support with role-based access

### Desktop Application
- **Gmail Integration**: Direct Gmail API access
- **Bulk Operations**: Mass email operations
- **Google Sheets Integration**: Import/export data
- **Scheduled Tasks**: Automated email processing

## 🆘 Support

### Getting Help
1. **Check this guide** for common solutions
2. **Review logs** for error messages
3. **Check GitHub Issues** for known problems
4. **Create new issue** with detailed error information

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for OAuth and AI services

## 🎯 Quick Commands

```bash
# Start everything
pnpm start:production

# Start individual services
pnpm dev:backend
pnpm dev:frontend
pnpm dev:ai
pnpm dev:worker

# Build everything
pnpm build

# Run tests
pnpm test

# Clean and reinstall
pnpm clean && pnpm install
```

## ✅ Verification Checklist

Before using the application, verify:

- [ ] PostgreSQL is running on port 5432
- [ ] Redis is running on port 6379
- [ ] Backend API responds at http://localhost:4000/health
- [ ] AI Service responds at http://localhost:4001/health
- [ ] Frontend loads at http://localhost:3000
- [ ] OAuth credentials are correctly configured
- [ ] Database schema is up to date
- [ ] All services start without errors

---

**Need more help?** Check the [GitHub Issues](https://github.com/Raylyrix/TASKFORCE/issues) or create a new one with your specific problem.
