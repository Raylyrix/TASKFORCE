# Taskforce Analytics Platform

A world-class professional email intelligence and productivity platform.

## 🚀 Features

- **Email Analytics**: Volume, response times, contact health
- **AI Intelligence**: Smart summaries, priority prediction, natural language queries
- **Team Collaboration**: Shared dashboards, role-based access
- **Enterprise**: Multi-tenant, compliance, custom metrics

## 🏗️ Architecture

- **Backend**: Node.js, Fastify, PostgreSQL
- **Frontend**: React, Next.js, Tailwind CSS
- **AI**: OpenRouter API integration
- **Queue**: Redis with BullMQ

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb TASKFORCE
   
   # Run migrations
   pnpm --filter backend prisma migrate dev
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

## 📊 Demo Login

- **Admin**: admin@taskforce-demo.com / demo123
- **Analyst**: analyst@taskforce-demo.com / demo123

## 🔧 Configuration

### Required Environment Variables

```bash
DATABASE_URL="postgresql://postgres:Rayvical@localhost:5432/TASKFORCE"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Gmail API
3. Create OAuth2 credentials
4. Add redirect URI: `http://localhost:4000/auth/google/callback`

### OpenRouter Setup

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Get API key
3. Use model: `nvidia/nemotron-nano-9b-v2:free`

## 🧪 Testing

```bash
pnpm test
```

## 📈 Monitoring

- Health: http://localhost:4000/health
- Metrics: http://localhost:4000/metrics