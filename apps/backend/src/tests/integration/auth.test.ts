import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Integration tests for authentication
describe('Authentication Integration Tests', () => {
  let fastify: any;
  let prisma: PrismaClient;
  let redis: Redis;

  beforeAll(async () => {
    // Initialize test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taskforce_test'
        }
      }
    });

    // Initialize test Redis
    redis = new Redis({
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
      db: 1 // Use different DB for tests
    });

    // Initialize Fastify app
    fastify = Fastify({
      logger: false // Disable logging for tests
    });

    // Register test plugins
    await fastify.register(require('@fastify/jwt'), {
      secret: 'test-secret'
    });

    fastify.decorate('prisma', prisma);
    fastify.decorate('redis', redis);
  });

  afterAll(async () => {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await redis.flushdb();
  });

  describe('POST /auth/login', () => {
    it('should authenticate valid user', async () => {
      // Create test organization and user
      const org = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          domain: 'test.com'
        }
      });

      const user = await prisma.user.create({
        data: {
          email: 'test@test.com',
          name: 'Test User',
          role: 'ADMIN',
          organizationId: org.id,
          isActive: true
        }
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'admin@taskforce-demo.com',
          password: 'demo123'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.email).toBe('admin@taskforce-demo.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'invalid@test.com',
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should validate request body', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'invalid-email',
          password: '123' // Too short
        }
      });

      expect(response.statusCode).toBe(400);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation failed');
    });

    it('should create audit log for successful login', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'admin@taskforce-demo.com',
          password: 'demo123'
        }
      });

      expect(response.statusCode).toBe(200);

      // Check audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: { action: 'LOGIN_SUCCESS' }
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].details).toHaveProperty('email');
    });
  });

  describe('JWT Token Validation', () => {
    let token: string;

    beforeEach(async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'admin@taskforce-demo.com',
          password: 'demo123'
        }
      });

      const data = JSON.parse(response.body);
      token = data.data.token;
    });

    it('should accept valid JWT token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      // Should not return 401 (unauthorized)
      expect(response.statusCode).not.toBe(401);
    });

    it('should reject invalid JWT token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid or expired token');
    });

    it('should reject expired JWT token', async () => {
      // Create expired token
      const expiredToken = fastify.jwt.sign(
        { userId: 'test', exp: Math.floor(Date.now() / 1000) - 3600 },
        { secret: 'test-secret' }
      );

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const promises = [];
      
      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        promises.push(
          fastify.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
              email: 'invalid@test.com',
              password: 'wrongpassword'
            }
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.statusCode === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
