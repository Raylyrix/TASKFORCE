import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from './clients/openrouter';
import { AIAnalysisService } from './services/analysis';
import { createApiResponse, validateRequest, AIQuerySchema, hashString } from '@taskforce/shared';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize AI services
const openRouterClient = new OpenRouterClient();
const aiAnalysisService = new AIAnalysisService(prisma, openRouterClient);

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
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true
  });

  // Make services available to routes
  fastify.decorate('prisma', prisma);
  fastify.decorate('aiAnalysisService', aiAnalysisService);
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
      return createApiResponse(false, null, validation.error);
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
      context
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
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down AI service...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the AI service
start();
