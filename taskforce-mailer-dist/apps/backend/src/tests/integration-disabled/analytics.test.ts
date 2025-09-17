import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Integration tests for analytics endpoints
describe('Analytics Integration Tests', () => {
  let fastify: any;
  let prisma: PrismaClient;
  let redis: Redis;
  let authToken: string;
  let organizationId: string;
  let mailboxId: string;

  beforeAll(async () => {
    // Initialize test services
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taskforce_test'
        }
      }
    });

    redis = new Redis({
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
      db: 1
    });

    fastify = Fastify({ logger: false });

    // Register plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: 'test-secret'
    });

    fastify.decorate('prisma', prisma);
    fastify.decorate('redis', redis);

    // Register routes
    fastify.register(require('../../routes/analytics'), { prefix: '/api/v1' });
  });

  afterAll(async () => {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.analyticsAggregate.deleteMany();
    await prisma.message.deleteMany();
    await prisma.thread.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.mailbox.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await redis.flushdb();

    // Create test data
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        domain: 'test.com'
      }
    });
    organizationId = org.id;

    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: org.id,
        isActive: true
      }
    });

    const mailbox = await prisma.mailbox.create({
      data: {
        email: 'test@test.com',
        provider: 'GMAIL',
        isActive: true,
        // organizationId: org.id // Commented out due to Prisma schema
      } as any
    });
    mailboxId = mailbox.id;

    // Create test messages
    await createTestMessages();

    // Get auth token
    authToken = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: org.id
    });
  });

  async function createTestMessages() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Create test contacts
    const contact1 = await prisma.contact.create({
      data: {
        email: 'contact1@external.com',
        name: 'Contact One',
        domain: 'external.com',
        isInternal: false,
        mailboxId: mailboxId
      }
    });

    const contact2 = await prisma.contact.create({
      data: {
        email: 'contact2@internal.com',
        name: 'Contact Two',
        domain: 'internal.com',
        isInternal: true,
        mailboxId: mailboxId
      }
    });

    // Create test thread
    const thread = await prisma.thread.create({
      data: {
        threadId: 'test-thread-1',
        subject: 'Test Thread',
        messageCount: 3,
        lastMessageAt: now,
        mailboxId: mailboxId,
        responseTime: 120 // 2 hours
      }
    });

    // Create test messages
    const messages = [
      {
        messageId: 'msg-1',
        threadId: thread.id,
        subject: 'Test Thread',
        fromEmail: 'contact1@external.com',
        fromName: 'Contact One',
        toEmails: ['test@test.com'],
        receivedAt: lastWeek,
        hasAttachments: false,
        mailboxId: mailboxId
      },
      {
        messageId: 'msg-2',
        threadId: thread.id,
        subject: 'Re: Test Thread',
        fromEmail: 'test@test.com',
        fromName: 'Test User',
        toEmails: ['contact1@external.com'],
        sentAt: yesterday,
        hasAttachments: true,
        mailboxId: mailboxId
      },
      {
        messageId: 'msg-3',
        threadId: thread.id,
        subject: 'Re: Test Thread',
        fromEmail: 'contact2@internal.com',
        fromName: 'Contact Two',
        toEmails: ['test@test.com'],
        receivedAt: now,
        hasAttachments: false,
        mailboxId: mailboxId
      }
    ];

    for (const msg of messages) {
      await prisma.message.create({ data: msg as any });
    }

    // Create message-contact relationships
    await prisma.messageContact.createMany({
      data: [
        { messageId: 'msg-1', contactId: contact1.id, role: 'FROM' },
        { messageId: 'msg-1', contactId: contact2.id, role: 'TO' },
        { messageId: 'msg-2', contactId: contact1.id, role: 'TO' },
        { messageId: 'msg-2', contactId: contact2.id, role: 'FROM' },
        { messageId: 'msg-3', contactId: contact2.id, role: 'FROM' },
        { messageId: 'msg-3', contactId: contact1.id, role: 'TO' }
      ]
    });

    // Create analytics aggregates
    await prisma.analyticsAggregate.createMany({
      data: [
        {
          date: new Date(now.toDateString()),
          metric: 'volume_sent',
          value: 1,
          organizationId: organizationId
        },
        {
          date: new Date(now.toDateString()),
          metric: 'volume_received',
          value: 2,
          organizationId: organizationId
        },
        {
          date: new Date(now.toDateString()),
          metric: 'avg_response_time',
          value: 120,
          organizationId: organizationId
        }
      ]
    });
  }

  describe('GET /api/v1/analytics/overview', () => {
    it('should return overview data for authenticated user', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('volume');
      expect(data.data).toHaveProperty('responseTimes');
      expect(data.data).toHaveProperty('topContacts');
      expect(data.data).toHaveProperty('recentActivity');
    });

    it('should require authentication', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should filter data by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/analytics/overview?startDate=${startDate}&endDate=${endDate}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/volume', () => {
    it('should return volume data', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/volume',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('sent');
      expect(data.data).toHaveProperty('received');
      expect(data.data).toHaveProperty('trends');
    });

    it('should support different time periods', async () => {
      const periods = ['day', 'week', 'month'];
      
      for (const period of periods) {
        const response = await fastify.inject({
          method: 'GET',
          url: `/api/v1/analytics/volume?period=${period}`,
          headers: {
            authorization: `Bearer ${authToken}`
          }
        });

        expect(response.statusCode).toBe(200);
        
        const data = JSON.parse(response.body);
        expect(data.success).toBe(true);
      }
    });
  });

  describe('GET /api/v1/analytics/response-times', () => {
    it('should return response time metrics', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/response-times',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('average');
      expect(data.data).toHaveProperty('median');
      expect(data.data).toHaveProperty('fastest');
      expect(data.data).toHaveProperty('slowest');
    });
  });

  describe('GET /api/v1/analytics/contacts', () => {
    it('should return contact health data', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/contacts',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('topContacts');
      expect(data.data).toHaveProperty('contactHealth');
      expect(data.data).toHaveProperty('internalVsExternal');
    });

    it('should support pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/contacts?page=1&limit=10',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/threads', () => {
    it('should return thread analysis data', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/threads',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('threadCount');
      expect(data.data).toHaveProperty('avgThreadLength');
      expect(data.data).toHaveProperty('longestThreads');
    });

    it('should return specific thread details', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/threads/test-thread-1',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('messages');
      expect(data.data).toHaveProperty('participants');
      expect(data.data).toHaveProperty('timeline');
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const promises = [];
      
      // Make 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          fastify.inject({
            method: 'GET',
            url: '/api/v1/analytics/overview',
            headers: {
              authorization: `Bearer ${authToken}`
            }
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Caching Tests', () => {
    it('should cache GET requests', async () => {
      // First request
      const response1 = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response1.statusCode).toBe(200);
      expect(response1.headers['x-cache']).toBe('MISS');

      // Second request should be cached
      const response2 = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response2.statusCode).toBe(200);
      expect(response2.headers['x-cache']).toBe('HIT');
    });
  });
});
