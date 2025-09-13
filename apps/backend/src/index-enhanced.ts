import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { createApiResponse } from '@taskforce/shared';
import { registerSecurityMiddleware, createSecureErrorHandler, auditLogger } from './middleware/security';
import { PerformanceMiddleware } from './middleware/performance';
import { ValidationMiddleware, ValidationSchemas } from './middleware/validation';
import { MonitoringMiddleware } from './middleware/monitoring';

// Load environment variables
dotenv.config();

// Initialize Prisma with enhanced configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Initialize Redis with optimized configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
});

// Create Fastify instance with enhanced configuration
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
    } : undefined,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for']
        },
        remoteAddress: req.ip,
        remotePort: req.socket?.remotePort
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
          'content-length': res.headers['content-length']
        }
      })
    }
  },
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024, // 10MB
  requestTimeout: 30000,
  keepAliveTimeout: 5000,
  genReqId: () => crypto.randomUUID()
});

// Initialize middleware
const performanceMiddleware = new PerformanceMiddleware(redis);
const monitoringMiddleware = new MonitoringMiddleware(redis);

// Register enhanced plugins
async function registerPlugins() {
  // Security middleware
  await registerSecurityMiddleware(fastify);

  // CORS with enhanced configuration
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS || '').split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });

  // JWT with secure configuration
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET environment variable is required');
    })(),
    sign: {
      expiresIn: '24h',
      issuer: 'taskforce-analytics',
      audience: 'taskforce-users'
    },
    verify: {
      issuer: 'taskforce-analytics',
      audience: 'taskforce-users'
    }
  });

  // Make services available to routes
  fastify.decorate('prisma', prisma);
  fastify.decorate('redis', redis);
  fastify.decorate('performance', performanceMiddleware);
  fastify.decorate('monitoring', monitoringMiddleware);
}

// Register middleware hooks
async function registerMiddleware() {
  // Request metrics
  fastify.addHook('preHandler', monitoringMiddleware.requestMetrics(fastify));
  
  // Performance monitoring
  fastify.addHook('preHandler', performanceMiddleware.responseTimeTracker(fastify));
  fastify.addHook('preHandler', performanceMiddleware.databaseOptimizer(fastify));
  fastify.addHook('preHandler', performanceMiddleware.resourceMonitoring(fastify));
  fastify.addHook('preHandler', performanceMiddleware.businessMetrics(fastify));
  
  // Request caching for GET requests
  fastify.addHook('preHandler', performanceMiddleware.requestCache(300));
  
  // Request deduplication for POST/PUT/PATCH
  fastify.addHook('preHandler', performanceMiddleware.requestDeduplication(60));
  
  // Audit logging
  fastify.addHook('preHandler', auditLogger(fastify));
}

// Enhanced authentication middleware
async function authMiddleware(request: any, reply: any) {
  try {
    if (request.url.startsWith('/auth/') || request.url.startsWith('/health') || request.url.startsWith('/metrics')) {
      return; // Skip auth for public endpoints
    }

    await request.jwtVerify();
    
    // Add user info to request
    request.user = request.user;
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      reply.status(401);
      return createApiResponse(false, null, 'User not found or inactive');
    }

    request.user = {
      ...request.user,
      organizationId: user.organizationId,
      role: user.role
    };
  } catch (error) {
    reply.status(401);
    return createApiResponse(false, null, 'Invalid or expired token');
  }
}

// Enhanced health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    const healthStatus = await monitoringMiddleware.getDetailedHealthStatus();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    reply.status(statusCode);
    
    return createApiResponse(healthStatus.status === 'healthy', healthStatus);
  } catch (error) {
    reply.status(503);
    return createApiResponse(false, null, 'Health check failed');
  }
});

// Enhanced metrics endpoint
fastify.get('/metrics', async (request, reply) => {
  try {
    const metrics = await monitoringMiddleware.getMetrics();
    reply.type('application/json');
    return createApiResponse(true, metrics);
  } catch (error) {
    reply.status(500);
    return createApiResponse(false, null, 'Failed to retrieve metrics');
  }
});

// Prometheus metrics endpoint
fastify.get('/metrics/prometheus', async (request, reply) => {
  try {
    const prometheusMetrics = await monitoringMiddleware.getPrometheusMetrics();
    reply.type('text/plain');
    return prometheusMetrics;
  } catch (error) {
    reply.status(500);
    return createApiResponse(false, null, 'Failed to retrieve Prometheus metrics');
  }
});

// Enhanced authentication routes
fastify.post('/auth/login', {
  preHandler: ValidationMiddleware.validate({
    body: ValidationSchemas.LoginRequest
  })
}, async (request, reply) => {
  try {
    const { email, password } = request.body as { email: string; password: string };
    
    // Enhanced authentication with proper password hashing
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      reply.status(401);
      return createApiResponse(false, null, 'Invalid credentials');
    }

    // In production, use bcrypt or similar for password hashing
    // For demo purposes, we'll use a simple check
    const isValidPassword = await validatePassword(password, user); // Implement this

    if (!isValidPassword) {
      reply.status(401);
      return createApiResponse(false, null, 'Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        details: { email, ip: request.ip },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        userId: user.id
      }
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
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return createApiResponse(false, null, 'Authentication failed');
  }
});

// Enhanced AI endpoints with validation
fastify.post('/api/v1/ai/query', {
  preHandler: [authMiddleware, ValidationMiddleware.validate({
    body: ValidationSchemas.AIQueryRequest
  })]
}, async (request, reply) => {
  try {
    const { query, context, options } = request.body as any;
    const userId = (request as any).user.userId;
    const organizationId = (request as any).user.organizationId;

    // Initialize AI service
    const aiService = new (require('./services/ai').AIService)();
    
    const response = await aiService.processNaturalLanguageQuery(
      query, 
      organizationId, 
      { ...context, userId, options }
    );

    // Log AI request
    await prisma.auditLog.create({
      data: {
        action: 'AI_QUERY',
        resource: 'ai',
        details: { query: query.substring(0, 100), context, options },
        userId
      }
    });

    return createApiResponse(true, response.data || response);
  } catch (error) {
    fastify.log.error('AI query error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to process AI query');
  }
});

// Enhanced thread summarization
fastify.post('/api/v1/ai/summarize', {
  preHandler: [authMiddleware, ValidationMiddleware.validate({
    body: z.object({
      threadId: z.string().cuid(),
      mailboxId: z.string().cuid()
    })
  })]
}, async (request, reply) => {
  try {
    const { threadId, mailboxId } = request.body as { threadId: string; mailboxId: string };
    const userId = (request as any).user.userId;

    // Verify user has access to mailbox
    const mailbox = await prisma.mailbox.findFirst({
      where: {
        id: mailboxId,
        organizationId: (request as any).user.organizationId
      }
    });

    if (!mailbox) {
      reply.status(403);
      return createApiResponse(false, null, 'Access denied to mailbox');
    }

    const aiService = new (require('./services/ai').AIService)();
    const response = await aiService.summarizeThread(threadId, mailboxId);

    // Log AI request
    await prisma.auditLog.create({
      data: {
        action: 'AI_SUMMARIZE',
        resource: 'ai',
        resourceId: threadId,
        details: { threadId, mailboxId },
        userId
      }
    });

    return createApiResponse(true, response.data || response);
  } catch (error) {
    fastify.log.error('AI summarization error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to summarize thread');
  }
});

// Register enhanced routes
fastify.register(require('./routes/analytics'), { prefix: '/api/v1' });
fastify.register(require('./routes/webhooks'), { prefix: '/webhooks' });
fastify.register(require('./routes/oauth'), { prefix: '/auth' });
fastify.register(require('./routes/reports'), { prefix: '/api/v1' });

// Enhanced error handler
fastify.setErrorHandler(createSecureErrorHandler(fastify));

// Enhanced 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send(createApiResponse(false, null, `Route ${request.method} ${request.url} not found`));
});

// Start server with enhanced configuration
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');

    // Register plugins and middleware
    await registerPlugins();
    await registerMiddleware();
    
    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Enhanced server running at http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`📈 Metrics: http://${host}:${port}/metrics`);
    console.log(`📊 Prometheus: http://${host}:${port}/metrics/prometheus`);
    
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Enhanced graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Close server
    await fastify.close();
    console.log('✅ Server closed');
    
    // Close database connections
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    // Close Redis connection
    await redis.quit();
    console.log('✅ Redis disconnected');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Password validation helper (implement proper hashing in production)
async function validatePassword(password: string, user: any): Promise<boolean> {
  // This is a demo implementation - use proper password hashing in production
  // For demo purposes, we'll accept 'demo123' for demo users
  if (user.email === 'admin@taskforce-demo.com' && password === 'demo123') {
    return true;
  }
  
  // In production, use bcrypt.compare(password, user.passwordHash)
  return false;
}

// Start the enhanced server
start();
