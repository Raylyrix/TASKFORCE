import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import cron from 'node-cron';
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

// Analytics aggregation function (simplified without database)
async function aggregateAnalytics(organizationId: string, date: string, metric: string) {
  console.log(`📊 Processing analytics for ${organizationId} - ${metric} on ${date}`);
  
  // Simulate analytics processing
  switch (metric) {
    case 'volume':
      console.log(`📈 Aggregating volume metrics for ${organizationId}`);
      break;
    case 'response_time':
      console.log(`⏱️ Aggregating response time metrics for ${organizationId}`);
      break;
    case 'contact_health':
      console.log(`👥 Aggregating contact health metrics for ${organizationId}`);
      break;
    default:
      console.warn(`Unknown metric: ${metric}`);
  }
  
  // In a real implementation, this would call the backend API
  // to store the aggregated data
  console.log(`✅ Analytics aggregation completed for ${metric}`);
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

// Scheduled jobs (simplified without database)
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Running scheduled ingestion jobs...');
  
  try {
    // Simulate mailbox processing
    console.log('📧 Processing mailboxes for ingestion...');
    
    // In a real implementation, this would fetch mailboxes from the backend API
    await ingestionQueue.add('sync-mailbox', {
      mailboxId: 'demo-mailbox-1',
      isInitial: false
    });

    console.log('✅ Enqueued ingestion jobs for demo mailboxes');
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

    // Simulate organization processing
    console.log(`📈 Processing analytics for demo organizations on ${dateStr}`);
    
    await analyticsQueue.add('aggregate-daily', {
      organizationId: 'demo-org-1',
      date: dateStr,
      metric: 'volume'
    });

    await analyticsQueue.add('aggregate-daily', {
      organizationId: 'demo-org-1',
      date: dateStr,
      metric: 'response_time'
    });

    await analyticsQueue.add('aggregate-daily', {
      organizationId: 'demo-org-1',
      date: dateStr,
      metric: 'contact_health'
    });

    console.log('✅ Enqueued analytics jobs for demo organizations');
  } catch (error) {
    console.error('❌ Failed to schedule analytics jobs:', error);
  }
});

// AI processing job - runs every 4 hours
cron.schedule('0 */4 * * *', async () => {
  console.log('🤖 Running AI analysis jobs...');
  
  try {
    // Simulate message processing
    console.log('📝 Processing messages for AI analysis...');
    
    // In a real implementation, this would fetch messages from the backend API
    await aiQueue.add('analyze-priority', {
      messageId: 'demo-message-1',
      analysisType: 'priority',
      content: 'priority analysis'
    });

    await aiQueue.add('analyze-sentiment', {
      messageId: 'demo-message-2',
      analysisType: 'sentiment',
      content: 'sentiment analysis'
    });

    console.log('✅ Enqueued AI analysis jobs for demo messages');
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
    
    console.log('✅ Workers shut down gracefully');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down workers...');
    
    await ingestionWorker.close();
    await analyticsWorker.close();
    await aiWorker.close();
    
    await redis.disconnect();
    
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
