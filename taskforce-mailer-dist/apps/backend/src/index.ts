import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
// // import { createApiResponse } from '@taskforce/shared';
// Temporary local implementation
function createApiResponse(success: boolean, data: any = null, error: string | null = null) {
  return { success, data, error };
}

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  });

  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
  });

  // Make Prisma available to routes
  fastify.decorate('prisma', prisma);
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return createApiResponse(true, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected'
    });
  } catch (error) {
    reply.status(503);
    return createApiResponse(false, null, 'Database connection failed');
  }
});

// Metrics endpoint for Prometheus
fastify.get('/metrics', async (request, reply) => {
  // Basic metrics - in production, use prom-client
  const metrics = {
    http_requests_total: 100,
    http_request_duration_seconds: 0.5,
    database_connections_active: 1,
    memory_usage_bytes: process.memoryUsage().heapUsed,
    uptime_seconds: process.uptime()
  };

  reply.type('text/plain');
  return Object.entries(metrics)
    .map(([key, value]) => `# HELP ${key} ${key}\n# TYPE ${key} gauge\n${key} ${value}`)
    .join('\n');
});

// Authentication routes
fastify.post('/auth/login', async (request, reply) => {
  try {
    const { email, password } = request.body as { email: string; password: string };
    
    // Demo authentication - in production, use proper password hashing
    if (email === 'admin@taskforce-demo.com' && password === 'demo123') {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (!user) {
        reply.status(401);
        return createApiResponse(false, null, 'User not found');
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      });

      return createApiResponse(true, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId
        }
      });
    }

    reply.status(401);
    return createApiResponse(false, null, 'Invalid credentials');
  } catch (error) {
    console.error(error);
    reply.status(500);
    return createApiResponse(false, null, 'Internal server error');
  }
});

// Register analytics routes
fastify.register(require('./routes/analytics').analyticsRoutes);

// Register webhook routes
fastify.register(require('./routes/webhooks').webhookRoutes);

// Register OAuth routes
fastify.register(require('./routes/oauth').oauthRoutes);

// Register report routes
fastify.register(require('./routes/reports').reportRoutes);

// Register electron bridge routes
fastify.register(require('./routes/electron-bridge').electronBridgeRoutes);

// Register dates routes
fastify.register(require('./routes/dates').datesRoutes);

// Register scheduling routes
fastify.register(require('./routes/scheduling').schedulingRoutes);

// Initialize services
const aiService = new (require('./services/ai').AIService)();
const analyticsService = new (require('./services/analytics').AnalyticsService)(prisma);

// AI endpoints (integrated with AI service)
fastify.post('/api/v1/ai/query', async (request, reply) => {
  try {
    const { query, context } = request.body as { 
      query: string; 
      context?: { dateRange?: any; mailboxIds?: string[]; includeCharts?: boolean } 
    };

    if (!query || query.trim().length === 0) {
      reply.status(400);
      return createApiResponse(false, null, 'Query is required');
    }

    const organizationId = 'demo-org'; // This would come from JWT token
    
    const response = await aiService.processNaturalLanguageQuery(query, organizationId, context);

    return createApiResponse(true, response.data || response);
  } catch (error) {
    console.error('AI query error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to process AI query');
  }
});

// Thread summarization endpoint
fastify.post('/api/v1/ai/summarize', async (request, reply) => {
  try {
    const { threadId, mailboxId } = request.body as { threadId: string; mailboxId: string };
    
    if (!threadId || !mailboxId) {
      reply.status(400);
      return createApiResponse(false, null, 'Thread ID and Mailbox ID are required');
    }

    const response = await aiService.summarizeThread(threadId, mailboxId);

    return createApiResponse(true, response.data || response);
  } catch (error) {
    console.error('AI summarization error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to summarize thread');
  }
});

// Message analysis endpoint
fastify.post('/api/v1/ai/analyze', async (request, reply) => {
  try {
    const { messageId, analysisTypes } = request.body as { 
      messageId: string; 
      analysisTypes: string[] 
    };
    
    if (!messageId || !analysisTypes?.length) {
      reply.status(400);
      return createApiResponse(false, null, 'Message ID and analysis types are required');
    }

    const response = await aiService.analyzeMessage(messageId, analysisTypes);

    return createApiResponse(true, response.data || response);
  } catch (error) {
    console.error('AI analysis error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to analyze message');
  }
});

// Smart reply generation endpoint
fastify.post('/api/v1/ai/smart-reply', async (request, reply) => {
  try {
    const { messageId, context } = request.body as { 
      messageId: string; 
      context?: any 
    };
    
    if (!messageId) {
      reply.status(400);
      return createApiResponse(false, null, 'Message ID is required');
    }

    const response = await aiService.generateSmartReply(messageId, context);

    return createApiResponse(true, response.data || response);
  } catch (error) {
    console.error('Smart reply error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to generate smart reply');
  }
});

// AI insights endpoint
fastify.get('/api/v1/ai/insights', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token
    
    const insights = await aiService.getInsights(organizationId);

    return createApiResponse(true, insights);
  } catch (error) {
    console.error('AI insights error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to fetch AI insights');
  }
});

// AI relationship health endpoint
fastify.get('/api/v1/ai/relationship-health', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token
    
    const health = await aiService.getRelationshipHealth(organizationId);

    return createApiResponse(true, health);
  } catch (error) {
    console.error('Relationship health error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to fetch relationship health');
  }
});

// AI team stress endpoint
fastify.get('/api/v1/ai/team-stress', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token
    
    const stress = await aiService.getTeamStressLevels(organizationId);

    return createApiResponse(true, stress);
  } catch (error) {
    console.error('Team stress error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to fetch team stress levels');
  }
});

// AI active alerts endpoint
fastify.get('/api/v1/ai/active-alerts', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token
    
    const alerts = await aiService.getActiveAlerts(organizationId);

    return createApiResponse(true, alerts);
  } catch (error) {
    console.error('Active alerts error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to fetch active alerts');
  }
});

// AI forecast volume endpoint
fastify.get('/api/v1/ai/forecast-volume', async (request, reply) => {
  try {
    const { period = '30d' } = request.query as { period?: string };
    const organizationId = 'demo-org'; // This would come from JWT token
    
    const forecast = await aiService.getVolumeForecast(organizationId, period);

    return createApiResponse(true, forecast);
  } catch (error) {
    console.error('Volume forecast error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to fetch volume forecast');
  }
});

// Analytics relationships endpoint
fastify.get('/api/v1/analytics/relationships', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token
    
    const relationships = await analyticsService.getRelationshipAnalytics(organizationId);

    return createApiResponse(true, relationships);
  } catch (error) {
    console.error('Relationships analytics error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to fetch relationship analytics');
  }
});


// Error reporting endpoint
fastify.post('/api/v1/errors/report', async (request, reply) => {
  try {
    const errorReport = request.body as any;
    
    // Log error for debugging
    console.error('Client error reported:', errorReport);
    
    // In production, you'd save this to a database or error tracking service
    return createApiResponse(true, { reported: true });
  } catch (error) {
    console.error('Error reporting failed:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to report error');
  }
});

// Performance analytics endpoint
fastify.post('/api/v1/analytics/performance/api', async (request, reply) => {
  try {
    const performanceData = request.body as any;
    
    // Log performance data for monitoring
    console.log('API performance:', performanceData);
    
    return createApiResponse(true, { recorded: true });
  } catch (error) {
    console.error('Performance recording failed:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to record performance');
  }
});

// AI draft generation endpoint
fastify.post('/api/v1/ai/draft', async (request, reply) => {
  try {
    const { messageId, tone, length } = request.body as { 
      messageId: string; 
      tone?: string; 
      length?: string 
    };
    
    if (!messageId) {
      reply.status(400);
      return createApiResponse(false, null, 'Message ID is required');
    }

    const response = await aiService.generateSmartReply(messageId, { tone, length });

    return createApiResponse(true, response.data || response);
  } catch (error) {
    console.error('AI draft generation error:', error as any);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to generate draft reply');
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send(createApiResponse(false, null, 'Internal server error'));
});

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send(createApiResponse(false, null, 'Route not found'));
});

// Start server
async function start() {
  try {
    await registerPlugins();
    
    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`📈 Metrics: http://${host}:${port}/metrics`);
    
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
start();
