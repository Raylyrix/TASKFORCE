import Fastify from 'fastify';
import cors from '@fastify/cors';
// import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from './clients/openrouter';
import { AIAnalysisService } from './services/analysis';
import { AdvancedSentimentService } from './services/advanced-sentiment';
import { RealTimeMonitoringService } from './services/realtime-monitoring';
import { PredictiveAnalyticsService } from './services/predictive-analytics';
import { createApiResponse, validateRequest, AIQuerySchema, hashString } from '@taskforce/shared';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma
// const prisma = new PrismaClient();
const prisma = {} as any;

// Initialize AI services
const openRouterClient = new OpenRouterClient();
const aiAnalysisService = new AIAnalysisService(prisma, openRouterClient);
const sentimentService = new AdvancedSentimentService(prisma, openRouterClient);
const monitoringService = new RealTimeMonitoringService(prisma, openRouterClient);
const predictiveService = new PredictiveAnalyticsService(prisma, openRouterClient);

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
  } as any
});

// Register plugins
async function registerPlugins() {
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true
  });

  // Make services available to routes
  fastify.decorate('prisma', prisma);
  fastify.decorate('aiAnalysisService', aiAnalysisService);
  fastify.decorate('sentimentService', sentimentService);
  fastify.decorate('monitoringService', monitoringService);
  fastify.decorate('predictiveService', predictiveService);
  fastify.decorate('openRouterClient', openRouterClient);
}

// Health check
fastify.get('/health', async (request, reply) => {
  try {
    // Test AI service connection
    const isConnected = await openRouterClient.testConnection();
    
    return createApiResponse(true, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      aiService: isConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    reply.status(503);
    return createApiResponse(false, null, 'AI service connection failed');
  }
});

// Natural Language Query endpoint
fastify.post('/api/v1/ai/query', async (request, reply) => {
  try {
    const validation = validateRequest(request.body, AIQuerySchema);
    if (!validation.success) {
      reply.status(400);
      return createApiResponse(false, null, (validation as any).error);
    }

    const { query, context } = validation.data;
    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`🤖 Processing NLQ: "${query}"`);

    // Check consent for content analysis
    const consentEnabled = process.env.CONSENT_CONTENT === 'true';
    if (!consentEnabled) {
      return createApiResponse(true, {
        response: "AI content analysis is disabled. Please enable CONSENT_CONTENT in your environment variables to use this feature.",
        charts: [],
        sources: [],
        confidence: 0
      });
    }

    const result = await aiAnalysisService.processNaturalLanguageQuery(
      query,
      organizationId,
      context as any
    );

    return createApiResponse(true, result);
  } catch (error) {
    fastify.log.error('AI query error:', error);
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

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`📝 Summarizing thread: ${threadId}`);

    const summary = await aiAnalysisService.summarizeThread(threadId, mailboxId, organizationId);

    return createApiResponse(true, summary);
  } catch (error) {
    fastify.log.error('Thread summarization error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to summarize thread');
  }
});

// Email analysis endpoint
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

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`🔍 Analyzing message: ${messageId} for types: ${analysisTypes.join(', ')}`);

    const analysis = await aiAnalysisService.analyzeMessage(messageId, analysisTypes, organizationId);

    return createApiResponse(true, analysis);
  } catch (error) {
    fastify.log.error('Message analysis error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to analyze message');
  }
});

// Smart reply generation endpoint
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

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`✍️ Generating draft reply for message: ${messageId}`);

    const draft = await aiAnalysisService.generateSmartReply(messageId, organizationId, {
      tone: tone || 'professional',
      length: length || 'medium'
    });

    return createApiResponse(true, draft);
  } catch (error) {
    fastify.log.error('Draft generation error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to generate draft reply');
  }
});

// Priority prediction endpoint
fastify.post('/api/v1/ai/priority', async (request, reply) => {
  try {
    const { messageIds } = request.body as { messageIds: string[] };
    
    if (!messageIds?.length) {
      reply.status(400);
      return createApiResponse(false, null, 'Message IDs are required');
    }

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`⚡ Predicting priorities for ${messageIds.length} messages`);

    const priorities = await aiAnalysisService.predictPriorities(messageIds, organizationId);

    return createApiResponse(true, priorities);
  } catch (error) {
    fastify.log.error('Priority prediction error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to predict priorities');
  }
});

// Task extraction endpoint
fastify.post('/api/v1/ai/extract-tasks', async (request, reply) => {
  try {
    const { messageId } = request.body as { messageId: string };
    
    if (!messageId) {
      reply.status(400);
      return createApiResponse(false, null, 'Message ID is required');
    }

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`📋 Extracting tasks from message: ${messageId}`);

    const tasks = await aiAnalysisService.extractTasks(messageId, organizationId);

    return createApiResponse(true, tasks);
  } catch (error) {
    fastify.log.error('Task extraction error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to extract tasks');
  }
});

// Sentiment analysis endpoint
fastify.post('/api/v1/ai/sentiment', async (request, reply) => {
  try {
    const { messageIds } = request.body as { messageIds: string[] };
    
    if (!messageIds?.length) {
      reply.status(400);
      return createApiResponse(false, null, 'Message IDs are required');
    }

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`😊 Analyzing sentiment for ${messageIds.length} messages`);

    const sentiments = await aiAnalysisService.analyzeSentiment(messageIds, organizationId);

    return createApiResponse(true, sentiments);
  } catch (error) {
    fastify.log.error('Sentiment analysis error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to analyze sentiment');
  }
});

// Auto-categorization endpoint
fastify.post('/api/v1/ai/categorize', async (request, reply) => {
  try {
    const { messageIds, categories } = request.body as { 
      messageIds: string[]; 
      categories?: string[] 
    };
    
    if (!messageIds?.length) {
      reply.status(400);
      return createApiResponse(false, null, 'Message IDs are required');
    }

    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`🏷️ Categorizing ${messageIds.length} messages`);

    const categorizations = await aiAnalysisService.categorizeMessages(
      messageIds, 
      organizationId, 
      categories
    );

    return createApiResponse(true, categorizations);
  } catch (error) {
    fastify.log.error('Categorization error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to categorize messages');
  }
});

// === ADVANCED AI FEATURES ===

// Advanced Sentiment Analysis & Relationship Tracking
fastify.post('/api/v1/ai/advanced-sentiment', async (request, reply) => {
  try {
    const { messageId, content, context } = request.body as { 
      messageId: string;
      content: string;
      context: {
        sender: string;
        recipient: string;
        subject: string;
        timestamp: Date;
        threadId?: string;
      };
    };
    
    if (!messageId || !content) {
      reply.status(400);
      return createApiResponse(false, null, 'Message ID and content are required');
    }

    console.log(`😊 Advanced sentiment analysis for message: ${messageId}`);

    const sentiment = await sentimentService.analyzeEmailSentiment(messageId, content, context);

    return createApiResponse(true, sentiment);
  } catch (error) {
    fastify.log.error('Advanced sentiment analysis error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to analyze sentiment');
  }
});

// Relationship Health Tracking
fastify.get('/api/v1/ai/relationship-health', async (request, reply) => {
  try {
    const { timeRange } = request.query as { timeRange?: string };
    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`💝 Tracking relationship health`);

    const timeWindow = timeRange === '7d' ? { 
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
      end: new Date() 
    } : {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };

    const relationshipHealth = await sentimentService.trackRelationshipHealth(organizationId, timeWindow);

    return createApiResponse(true, relationshipHealth);
  } catch (error) {
    fastify.log.error('Relationship health tracking error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to track relationship health');
  }
});

// Team Stress Level Monitoring
fastify.get('/api/v1/ai/team-stress', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`😰 Monitoring team stress levels`);

    const teamStress = await sentimentService.monitorTeamStressLevel(organizationId);

    return createApiResponse(true, teamStress);
  } catch (error) {
    fastify.log.error('Team stress monitoring error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to monitor team stress');
  }
});

// Crisis Detection
fastify.get('/api/v1/ai/crisis-detection', async (request, reply) => {
  try {
    const organizationId = 'demo-org'; // This would come from JWT token

    console.log(`🚨 Detecting potential crises`);

    const crises = await sentimentService.detectCrises(organizationId);

    return createApiResponse(true, crises);
  } catch (error) {
    fastify.log.error('Crisis detection error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to detect crises');
  }
});

// Real-time Email Monitoring
fastify.post('/api/v1/ai/monitor-email', async (request, reply) => {
  try {
    const messageData = request.body as any;
    
    if (!messageData.messageId || !messageData.organizationId) {
      reply.status(400);
      return createApiResponse(false, null, 'Message data is required');
    }

    console.log(`📧 Processing incoming email for monitoring: ${messageData.messageId}`);

    const alerts = await monitoringService.processIncomingEmail(messageData.messageId, messageData);

    return createApiResponse(true, { alerts, processed: true });
  } catch (error) {
    fastify.log.error('Email monitoring error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to monitor email');
  }
});

// Get Real-time Metrics
fastify.get('/api/v1/ai/realtime-metrics', async (request, reply) => {
  try {
    const { organizationId } = request.query as { organizationId: string };
    const orgId = organizationId || 'demo-org';

    console.log(`📊 Getting real-time metrics for organization: ${orgId}`);

    const metrics = await monitoringService.getRealTimeMetrics(orgId);

    return createApiResponse(true, metrics);
  } catch (error) {
    fastify.log.error('Real-time metrics error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to get real-time metrics');
  }
});

// Get Active Alerts
fastify.get('/api/v1/ai/active-alerts', async (request, reply) => {
  try {
    const { organizationId } = request.query as { organizationId: string };
    const orgId = organizationId || 'demo-org';

    console.log(`🚨 Getting active alerts for organization: ${orgId}`);

    const alerts = await monitoringService.getActiveAlerts(orgId);

    return createApiResponse(true, alerts);
  } catch (error) {
    fastify.log.error('Active alerts error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to get active alerts');
  }
});

// Email Volume Forecasting
fastify.get('/api/v1/ai/forecast-volume', async (request, reply) => {
  try {
    const { period, organizationId } = request.query as { period?: string; organizationId?: string };
    const orgId = organizationId || 'demo-org';
    const forecastPeriod = (period as any) || '30d';

    console.log(`📈 Forecasting email volume for ${forecastPeriod}`);

    const forecast = await predictiveService.forecastEmailVolume(orgId, forecastPeriod);

    return createApiResponse(true, forecast);
  } catch (error) {
    fastify.log.error('Email volume forecasting error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to forecast email volume');
  }
});

// Response Time Prediction
fastify.post('/api/v1/ai/predict-response-times', async (request, reply) => {
  try {
    const { contactIds, organizationId } = request.body as { contactIds?: string[]; organizationId?: string };
    const orgId = organizationId || 'demo-org';

    console.log(`⏱️ Predicting response times for ${contactIds?.length || 'all'} contacts`);

    const predictions = await predictiveService.predictResponseTimes(orgId, contactIds);

    return createApiResponse(true, predictions);
  } catch (error) {
    fastify.log.error('Response time prediction error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to predict response times');
  }
});

// Workload Prediction
fastify.get('/api/v1/ai/predict-workload', async (request, reply) => {
  try {
    const { timeHorizon, organizationId } = request.query as { timeHorizon?: string; organizationId?: string };
    const orgId = organizationId || 'demo-org';
    const horizon = timeHorizon ? parseInt(timeHorizon) : 30;

    console.log(`📊 Predicting workload for ${horizon} days`);

    const predictions = await predictiveService.predictWorkload(orgId, horizon);

    return createApiResponse(true, predictions);
  } catch (error) {
    fastify.log.error('Workload prediction error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to predict workload');
  }
});

// Client Communication Patterns
fastify.post('/api/v1/ai/client-patterns', async (request, reply) => {
  try {
    const { clientIds, organizationId } = request.body as { clientIds?: string[]; organizationId?: string };
    const orgId = organizationId || 'demo-org';

    console.log(`👥 Analyzing client communication patterns for ${clientIds?.length || 'all'} clients`);

    const patterns = await predictiveService.analyzeClientCommunicationPatterns(orgId, clientIds);

    return createApiResponse(true, patterns);
  } catch (error) {
    fastify.log.error('Client pattern analysis error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to analyze client patterns');
  }
});

// Capacity Planning
fastify.get('/api/v1/ai/capacity-planning', async (request, reply) => {
  try {
    const { growthRate, organizationId } = request.query as { growthRate?: string; organizationId?: string };
    const orgId = organizationId || 'demo-org';
    const rate = growthRate ? parseFloat(growthRate) : 0.15;

    console.log(`🏗️ Generating capacity planning with ${rate * 100}% growth rate`);

    const planning = await predictiveService.generateCapacityPlanning(orgId, rate);

    return createApiResponse(true, planning);
  } catch (error) {
    fastify.log.error('Capacity planning error:', error);
    reply.status(500);
    return createApiResponse(false, null, 'Failed to generate capacity planning');
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send(createApiResponse(false, null, 'AI service error'));
});

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send(createApiResponse(false, null, 'AI endpoint not found'));
});

// Start server
async function start() {
  try {
    await registerPlugins();
    
    const port = parseInt(process.env.AI_SERVICE_PORT || '4001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🤖 AI Service running at http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🧠 Model: ${process.env.OPENROUTER_MODEL || 'nvidia/nemotron-nano-9b-v2:free'}`);
    
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down AI service...');
  monitoringService.stop();
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down AI service...');
  monitoringService.stop();
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the AI service
start();
