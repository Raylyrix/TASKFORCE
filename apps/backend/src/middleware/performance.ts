import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';

// Performance optimization middleware
export class PerformanceMiddleware {
  private redis: Redis;
  private metrics: Map<string, number> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
    this.startMetricsCollection();
  }

  // Response time tracking
  responseTimeTracker(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      
      request.addHook('onSend', async (request, reply, payload) => {
        const duration = Date.now() - startTime;
        
        // Track response time metrics
        this.trackMetric(`response_time_${request.method}`, duration);
        this.trackMetric(`response_time_${reply.statusCode}`, duration);
        
        // Add response time header
        reply.header('X-Response-Time', `${duration}ms`);
        
        return payload;
      });
    };
  }

  // Request caching middleware
  requestCache(ttl: number = 300) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Only cache GET requests
      if (request.method !== 'GET') {
        return;
      }

      const cacheKey = `cache:${request.method}:${request.url}:${JSON.stringify(request.query)}`;
      
      try {
        // Try to get from cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          reply.header('X-Cache', 'HIT');
          return JSON.parse(cached);
        }
      } catch (error) {
        // Cache miss or error - continue with normal processing
      }

      // Add cache set hook
      request.addHook('onSend', async (request, reply, payload) => {
        // Only cache successful responses
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          try {
            await this.redis.setex(cacheKey, ttl, JSON.stringify(payload));
            reply.header('X-Cache', 'MISS');
          } catch (error) {
            // Cache set failed - log but don't fail request
            console.error('Cache set failed:', error);
          }
        }
        
        return payload;
      });
    };
  }

  // Database query optimization
  databaseOptimizer(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      let queryCount = 0;

      // Monitor database queries
      const originalQuery = fastify.prisma.$queryRaw;
      fastify.prisma.$queryRaw = function(...args) {
        queryCount++;
        return originalQuery.apply(this, args);
      };

      request.addHook('onSend', async (request, reply, payload) => {
        const duration = Date.now() - startTime;
        
        // Track database performance
        this.trackMetric('db_query_count', queryCount);
        this.trackMetric('db_query_time', duration);
        
        // Add performance headers
        reply.header('X-Query-Count', queryCount.toString());
        reply.header('X-DB-Time', `${duration}ms`);
        
        return payload;
      });
    };
  }

  // Memory usage monitoring
  memoryMonitor(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startMemory = process.memoryUsage();
      
      request.addHook('onSend', async (request, reply, payload) => {
        const endMemory = process.memoryUsage();
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        
        // Track memory usage
        this.trackMetric('memory_heap_used', endMemory.heapUsed);
        this.trackMetric('memory_heap_delta', memoryDelta);
        
        // Add memory headers
        reply.header('X-Memory-Used', `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);
        reply.header('X-Memory-Delta', `${Math.round(memoryDelta / 1024 / 1024)}MB`);
        
        return payload;
      });
    };
  }

  // Compression middleware
  compression(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const originalSend = reply.send;
      reply.send = function(payload) {
        // Add compression headers for large responses
        if (payload && JSON.stringify(payload).length > 1024) {
          reply.header('Content-Encoding', 'gzip');
        }
        return originalSend.call(this, payload);
      };
    };
  }

  // Request deduplication
  requestDeduplication(ttl: number = 60) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Only dedupe POST/PUT/PATCH requests
      if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
        return;
      }

      const dedupeKey = `dedupe:${request.method}:${request.url}:${JSON.stringify(request.body)}`;
      
      try {
        // Check if request is already being processed
        const existing = await this.redis.get(dedupeKey);
        if (existing) {
          reply.status(409);
          return {
            success: false,
            error: 'Duplicate request detected',
            requestId: existing
          };
        }

        // Mark request as being processed
        await this.redis.setex(dedupeKey, ttl, request.id);
        
        // Clean up on completion
        request.addHook('onSend', async (request, reply, payload) => {
          await this.redis.del(dedupeKey);
          return payload;
        });
      } catch (error) {
        // Deduplication failed - continue with normal processing
        console.error('Deduplication failed:', error);
      }
    };
  }

  // Metrics collection
  private trackMetric(name: string, value: number) {
    this.metrics.set(name, (this.metrics.get(name) || 0) + value);
  }

  private startMetricsCollection() {
    // Collect and store metrics every minute
    setInterval(async () => {
      try {
        const metrics = Object.fromEntries(this.metrics);
        await this.redis.hset('metrics', metrics);
        
        // Reset counters
        this.metrics.clear();
      } catch (error) {
        console.error('Failed to store metrics:', error);
      }
    }, 60000);
  }

  // Get performance metrics
  async getMetrics(): Promise<any> {
    try {
      const stored = await this.redis.hgetall('metrics');
      const current = Object.fromEntries(this.metrics);
      
      return {
        stored: stored,
        current: current,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return { error: 'Failed to retrieve metrics' };
    }
  }
}

// Connection pooling configuration
export const databaseConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // Connection pooling
      connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      pool_timeout: parseInt(process.env.DB_POOL_TIMEOUT || '30000'),
      // SSL configuration
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  }
};

// Redis configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Connection pooling
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  // Performance tuning
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Memory optimization
  maxmemory: '256mb',
  maxmemoryPolicy: 'allkeys-lru'
};
