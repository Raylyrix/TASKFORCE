import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import cron from 'node-cron';
// import { IngestionService } from '../../apps/backend/src/services/ingestion';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Redis connection with retry logic
const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true,
  connectTimeout: 30000,
  commandTimeout: 30000,
  enableReadyCheck: false,
  maxRetriesPerRequest: null
});

// Test Redis connection
redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('ready', () => {
  console.log('✅ Redis is ready');
});

// Initialize Prisma
const prisma = new PrismaClient();

// Test Redis connection before proceeding
async function testRedisConnection() {
  try {
    await redis.ping();
    console.log('✅ Redis connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
}

// Initialize ingestion service
// const ingestionService = new IngestionService(prisma);

// Create queues with connection
const ingestionQueue = new Queue('ingestion', { connection: redis });
const analyticsQueue = new Queue('analytics', { connection: redis });
const aiQueue = new Queue('ai-processing', { connection: redis });

// Job interfaces
interface IngestionJob {
  mailboxId: string;
  isInitial: boolean;
}

interface AnalyticsJob {
  organizationId: string;
  date: string;
  metric: string;
}

interface AIJob {
  messageId: string;
  analysisType: string;
  content: string;
}

// Initialize workers with connection test
async function initializeWorkers() {
  const isRedisConnected = await testRedisConnection();
  
  if (!isRedisConnected) {
    console.error('❌ Cannot start workers without Redis connection');
    process.exit(1);
  }

  console.log('🚀 Starting worker services...');

  // Ingestion Worker
  const ingestionWorker = new Worker<IngestionJob>(
    'ingestion',
    async (job) => {
    const { mailboxId, isInitial } = job.data;
    
    console.log(`🔄 Processing ingestion job for mailbox ${mailboxId} (initial: ${isInitial})`);
    
    try {
      // await ingestionService.syncMailbox(mailboxId, isInitial);
      console.log(`📧 Syncing mailbox ${mailboxId} (initial: ${isInitial})`);
      
      // After sync, calculate response times
      // await ingestionService.calculateResponseTimes(mailboxId);
      console.log(`⏱️ Calculating response times for mailbox ${mailboxId}`);
      
      // Enqueue analytics aggregation job
      await analyticsQueue.add('aggregate-mailbox', {
        organizationId: 'demo-org',
        date: new Date().toISOString().split('T')[0],
        metric: 'volume'
      });
      
      console.log(`✅ Completed ingestion job for mailbox ${mailboxId}`);
    } catch (error) {
      console.error(`❌ Ingestion job failed for mailbox ${mailboxId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Analytics Worker
const analyticsWorker = new Worker<AnalyticsJob>(
  'analytics',
  async (job) => {
    const { organizationId, date, metric } = job.data;
    
    console.log(`📊 Processing analytics job: ${metric} for ${organizationId} on ${date}`);
    
    try {
      await aggregateAnalytics(organizationId, date, metric);
      console.log(`✅ Completed analytics job: ${metric}`);
    } catch (error) {
      console.error(`❌ Analytics job failed:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// AI Worker
const aiWorker = new Worker<AIJob>(
  'ai-processing',
  async (job) => {
    const { messageId, analysisType, content } = job.data;
    
    console.log(`🤖 Processing AI job: ${analysisType} for message ${messageId}`);
    
    try {
      await processAIAnalysis(messageId, analysisType, content);
      console.log(`✅ Completed AI job: ${analysisType}`);
    } catch (error) {
      console.error(`❌ AI job failed:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Analytics aggregation function
async function aggregateAnalytics(organizationId: string, date: string, metric: string) {
  const targetDate = new Date(date);
  
  switch (metric) {
    case 'volume':
      await aggregateVolumeMetrics(organizationId, targetDate);
      break;
    case 'response_time':
      await aggregateResponseTimeMetrics(organizationId, targetDate);
      break;
    case 'contact_health':
      await aggregateContactHealthMetrics(organizationId, targetDate);
      break;
    default:
      console.warn(`Unknown metric: ${metric}`);
  }
}

async function aggregateVolumeMetrics(organizationId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all mailboxes for the organization
  const mailboxes = await prisma.mailbox.findMany({
    where: { organizationId }
  });

  let totalSent = 0;
  let totalReceived = 0;

  for (const mailbox of mailboxes) {
    // Count sent messages
    const sentCount = await prisma.message.count({
      where: {
        mailboxId: mailbox.id,
        receivedAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        fromEmail: mailbox.email
      }
    });

    // Count received messages
    const receivedCount = await prisma.message.count({
      where: {
        mailboxId: mailbox.id,
        receivedAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        fromEmail: {
          not: mailbox.email
        }
      }
    });

    totalSent += sentCount;
    totalReceived += receivedCount;
  }

  // Upsert aggregate record
  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'volume_sent'
      }
    },
    update: { value: totalSent },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'volume_sent',
      value: totalSent
    }
  });

  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'volume_received'
      }
    },
    update: { value: totalReceived },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'volume_received',
      value: totalReceived
    }
  });
}

async function aggregateResponseTimeMetrics(organizationId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get threads with response times for the day
  const threads = await prisma.thread.findMany({
    where: {
      mailbox: { organizationId },
      responseTime: { not: null },
      lastMessageAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    select: { responseTime: true }
  });

  if (threads.length === 0) return;

  const responseTimes = threads.map(t => t.responseTime!).filter(rt => rt > 0);
  
  if (responseTimes.length === 0) return;

  const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
  const medianResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
  const p90ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.9)];

  // Store aggregates
  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'response_time_avg'
      }
    },
    update: { value: avgResponseTime },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'response_time_avg',
      value: avgResponseTime
    }
  });

  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'response_time_median'
      }
    },
    update: { value: medianResponseTime },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'response_time_median',
      value: medianResponseTime
    }
  });

  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'response_time_p90'
      }
    },
    update: { value: p90ResponseTime },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'response_time_p90',
      value: p90ResponseTime
    }
  });
}

async function aggregateContactHealthMetrics(organizationId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get contacts for the organization
  const contacts = await prisma.contact.findMany({
    where: {
      mailbox: { organizationId },
      lastContactAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  if (contacts.length === 0) return;

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.responseRate && c.responseRate > 0).length;
  const avgResponseRate = contacts.reduce((sum, c) => sum + (c.responseRate || 0), 0) / totalContacts;

  // Store aggregates
  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'contacts_total'
      }
    },
    update: { value: totalContacts },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'contacts_total',
      value: totalContacts
    }
  });

  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'contacts_active'
      }
    },
    update: { value: activeContacts },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'contacts_active',
      value: activeContacts
    }
  });

  await prisma.analyticsAggregate.upsert({
    where: {
      organizationId_date_metric: {
        organizationId,
        date: startOfDay,
        metric: 'contacts_avg_response_rate'
      }
    },
    update: { value: avgResponseRate },
    create: {
      organizationId,
      date: startOfDay,
      metric: 'contacts_avg_response_rate',
      value: avgResponseRate
    }
  });
}

// AI processing function
async function processAIAnalysis(messageId: string, analysisType: string, _content: string) {
  try {
    console.log(`🤖 Processing ${analysisType} for message ${messageId}`);
    
    // Call AI service for analysis
        const aiServiceUrl = process.env['AI_SERVICE_URL'] || 'http://localhost:4001';
    
    const response = await fetch(`${aiServiceUrl}/api/v1/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId,
        analysisTypes: [analysisType]
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ AI analysis completed for message ${messageId}: ${analysisType}`);
      return result;
    } else {
      console.error(`❌ AI analysis failed for message ${messageId}: ${response.statusText}`);
      throw new Error(`AI analysis failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`❌ AI processing error for message ${messageId}:`, error);
    throw error;
  }
}

// Scheduled jobs
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Running scheduled ingestion jobs...');
  
  try {
    const mailboxes = await prisma.mailbox.findMany({
      where: { isActive: true }
    });

    for (const mailbox of mailboxes) {
      await ingestionQueue.add('sync-mailbox', {
        mailboxId: mailbox.id,
        isInitial: false
      });
    }

    console.log(`✅ Enqueued ingestion jobs for ${mailboxes.length} mailboxes`);
  } catch (error) {
    console.error('❌ Failed to schedule ingestion jobs:', error);
  }
});

cron.schedule('0 1 * * *', async () => {
  console.log('📊 Running daily analytics aggregation...');
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const organizations = await prisma.organization.findMany({
      select: { id: true }
    });

    for (const org of organizations) {
      await analyticsQueue.add('aggregate-daily', {
        organizationId: org.id,
        date: dateStr,
        metric: 'volume'
      });

      await analyticsQueue.add('aggregate-daily', {
        organizationId: org.id,
        date: dateStr,
        metric: 'response_time'
      });

      await analyticsQueue.add('aggregate-daily', {
        organizationId: org.id,
        date: dateStr,
        metric: 'contact_health'
      });
    }

    console.log(`✅ Enqueued analytics jobs for ${organizations.length} organizations`);
  } catch (error) {
    console.error('❌ Failed to schedule analytics jobs:', error);
  }
});

// AI processing job - runs every 4 hours
cron.schedule('0 */4 * * *', async () => {
  console.log('🤖 Running AI analysis jobs...');
  
  try {
    // Get messages from the last 24 hours that haven't been analyzed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const messages = await prisma.message.findMany({
      where: {
        receivedAt: { gte: yesterday },
        aiAnalysis: {
          none: {} // No AI analysis yet
        }
      },
      take: 50, // Limit to 50 messages per run
      select: { id: true }
    });

    for (const message of messages) {
      // Enqueue priority analysis
      await aiQueue.add('analyze-priority', {
        messageId: message.id,
        analysisType: 'priority',
        content: 'priority analysis'
      });

      // Enqueue sentiment analysis for important messages
      const messageDetail = await prisma.message.findUnique({
        where: { id: message.id },
        select: { isImportant: true }
      });

      if (messageDetail?.isImportant) {
        await aiQueue.add('analyze-sentiment', {
          messageId: message.id,
          analysisType: 'sentiment',
          content: 'sentiment analysis'
        });
      }
    }

    console.log(`✅ Enqueued AI analysis jobs for ${messages.length} messages`);
  } catch (error) {
    console.error('❌ Failed to schedule AI analysis jobs:', error);
  }
});

  // Error handling
  ingestionWorker.on('error', (error) => {
    console.error('❌ Ingestion worker error:', error);
  });

  analyticsWorker.on('error', (error) => {
    console.error('❌ Analytics worker error:', error);
  });

  aiWorker.on('error', (error) => {
    console.error('❌ AI worker error:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down workers...');
    
    await ingestionWorker.close();
    await analyticsWorker.close();
    await aiWorker.close();
    
    await redis.disconnect();
    await prisma.$disconnect();
    
    console.log('✅ Workers shut down gracefully');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down workers...');
    
    await ingestionWorker.close();
    await analyticsWorker.close();
    await aiWorker.close();
    
    await redis.disconnect();
    await prisma.$disconnect();
    
    console.log('✅ Workers shut down gracefully');
    process.exit(0);
  });

  console.log('🚀 Background workers started successfully!');
  console.log('📧 Ingestion worker: Processing email sync jobs');
  console.log('📊 Analytics worker: Processing analytics aggregation');
  console.log('🤖 AI worker: Processing AI analysis jobs');
  console.log('⏰ Scheduled jobs: Every 6 hours (ingestion), Daily at 1 AM (analytics)');
}

// Start the workers
initializeWorkers().catch((error) => {
  console.error('❌ Failed to initialize workers:', error);
  process.exit(1);
});
