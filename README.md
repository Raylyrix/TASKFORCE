# Taskforce - Enterprise Productivity Suite

A comprehensive monorepo containing the complete Taskforce productivity platform with integrated Mailer and Dates scheduling system.

## 🏗️ Monorepo Structure

```
taskforce/
├── apps/
│   ├── backend/           # Fastify API server with Prisma
│   └── frontend/          # Next.js web application
├── services/
│   ├── ai-service/        # AI/ML microservice
│   └── worker/            # Background job processor
├── packages/
│   └── shared/            # Shared utilities and types
├── scripts/               # Development and deployment scripts
├── docs/                  # Documentation
└── rtx_innovations_electron/ # Electron desktop app
```

## 🚀 Core Features

### 📧 Mailer (Email Analytics & Management)
- **Gmail Integration**: OAuth2 authentication with Google APIs
- **Advanced Analytics**: Real-time email metrics and insights
- **AI-Powered**: Smart replies, thread summarization, sentiment analysis
- **Dashboard**: Interactive charts and performance monitoring
- **Team Collaboration**: Multi-user support with role-based access

### 📅 Dates (Enterprise Scheduling)
- **Google Calendar Sync**: Free/busy availability checking
- **Google Meet Integration**: Automatic meeting link creation
- **Event Types**: One-on-one, Group, Round Robin, Collective
- **Public Booking**: Shareable booking pages
- **Admin Dashboard**: Manage event types and bookings
- **Mailer Integration**: Insert booking links in emails

### 🤖 AI Services
- **Natural Language Queries**: Ask questions about your data
- **Smart Summarization**: Thread and message analysis
- **Predictive Analytics**: Performance insights and recommendations
- **Automated Responses**: Context-aware reply suggestions

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Fastify, Prisma, PostgreSQL
- **AI/ML**: OpenRouter API integration
- **Database**: PostgreSQL with Redis caching
- **Authentication**: JWT with Google OAuth2
- **Package Manager**: pnpm workspaces
- **Testing**: Jest with TypeScript support
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/Raylyrix/TASKFORCE.git
   cd taskforce
   pnpm install
   ```

2. **Environment setup**:
   ```bash
   cp env.example .env
   # Edit .env with your database and API credentials
   ```

3. **Database setup**:
   ```bash
   cd apps/backend
   pnpm prisma migrate deploy
   pnpm prisma generate
   ```

4. **Start development servers**:
   ```bash
   pnpm dev
   ```

### Google OAuth Setup

1. Create a Google Cloud Project
2. Enable Gmail API and Google Calendar API
3. Configure OAuth2 credentials
4. Add scopes for Gmail, Calendar, and Meet
5. Update environment variables in `.env`

## 📖 API Documentation

### Mailer Endpoints
- `GET /api/v1/analytics/dashboard` - Dashboard metrics
- `POST /api/v1/ai/query` - Natural language queries
- `POST /api/v1/ai/summarize` - Thread summarization

### Dates Endpoints
- `GET /api/v1/dates/availability/:userId` - Get user availability
- `POST /api/v1/dates/booking-link` - Generate booking link
- `POST /api/v1/dates/event-types` - Create event type
- `POST /api/v1/dates/book` - Book an event

### Google Integration
- `POST /api/v1/google/freebusy` - Check calendar availability
- `POST /api/v1/google/meet` - Create Google Meet link

## 🎯 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all services in development mode
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages

# Individual services
pnpm --filter @taskforce/backend dev
pnpm --filter @taskforce/frontend dev
pnpm --filter @taskforce/ai-service dev
pnpm --filter @taskforce/worker dev
```

### Database Management

```bash
cd apps/backend
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate dev  # Create new migration
pnpm prisma generate  # Generate Prisma client
```

## 🏢 Enterprise Features

### Security & Compliance
- **OAuth2 Authentication**: Secure Google integration
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: Admin, user, and team roles
- **Data Encryption**: Secure data handling

### Scalability
- **Microservices Architecture**: Independent scaling
- **Background Jobs**: Queue-based processing
- **Caching**: Redis for performance
- **Database Optimization**: Prisma with connection pooling

### Monitoring & Observability
- **Health Checks**: Service monitoring endpoints
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logging with Pino
- **Error Tracking**: Comprehensive error handling

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Production Setup
1. Configure environment variables
2. Set up PostgreSQL and Redis
3. Configure Google OAuth credentials
4. Deploy using provided Docker Compose or Kubernetes manifests

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START_GUIDE.md)
- [Gmail OAuth Setup](docs/GMAIL_OAUTH_SETUP.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [User Guide](docs/USER_GUIDE.md)
- [Advanced Features](docs/ADVANCED_FEATURES_ROADMAP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Raylyrix/TASKFORCE/issues)
- **Documentation**: [Wiki](https://github.com/Raylyrix/TASKFORCE/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/Raylyrix/TASKFORCE/discussions)

---

**Taskforce** - The complete enterprise productivity suite with integrated Mailer and Dates scheduling.