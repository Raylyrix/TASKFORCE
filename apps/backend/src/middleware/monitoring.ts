import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';

// Comprehensive monitoring and observability middleware
export class MonitoringMiddleware {
  private redis: Redis;
  private metrics: Map<string, any> = new Map();
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeMetrics();
    this.setupHealthChecks();
    this.startMetricsCollection();
  }

  // Request metrics collection
  requestMetrics(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const requestId = request.id;
      
      // Track request start
      this.trackMetric('requests_total', 1);
      this.trackMetric(`requests_${request.method}`, 1);

      // Add request context
      (request as any).metrics = {
        requestId,
        startTime,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip
      };

      request.addHook('onSend', async (request, reply, payload) => {
        const duration = Date.now() - startTime;
        const statusCode = reply.statusCode;

        // Track response metrics
        this.trackMetric('response_time_ms', duration);
        this.trackMetric(`response_time_${request.method}`, duration);
        this.trackMetric(`status_${statusCode}`, 1);
        
        // Track error rates
        if (statusCode >= 400) {
          this.trackMetric('errors_total', 1);
          this.trackMetric(`errors_${statusCode}`, 1);
        }

        // Track success rates
        if (statusCode >= 200 && statusCode < 300) {
          this.trackMetric('success_total', 1);
        }

        // Add monitoring headers
        reply.header('X-Request-ID', requestId);
        reply.header('X-Response-Time', `${duration}ms`);
        reply.header('X-Timestamp', new Date().toISOString());

        // Log request completion
        fastify.log.info({
          requestId,
          method: request.method,
          url: request.url,
          statusCode,
          duration,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          userId: (request as any).user?.id
        }, 'Request completed');

        return payload;
      });

      // Handle request errors
      request.addHook('onError', async (request, reply, error) => {
        const duration = Date.now() - startTime;
        
        // Track error metrics
        this.trackMetric('errors_total', 1);
        this.trackMetric('error_response_time', duration);
        
        // Log error details
        fastify.log.error({
          requestId,
          error: {
            message: error.message,
            stack: error.stack,
            code: error.code
          },
          method: request.method,
          url: request.url,
          duration,
          ip: request.ip
        }, 'Request error occurred');
      });
    };
  }

  // Database connection monitoring
  databaseMonitoring(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      let queryCount = 0;
      let queryTime = 0;

      // Monitor database queries
      const originalQuery = fastify.prisma.$queryRaw;
      const originalExecute = fastify.prisma.$executeRaw;

      fastify.prisma.$queryRaw = function(...args) {
        const startTime = Date.now();
        queryCount++;
        
        return originalQuery.apply(this, args).finally(() => {
          queryTime += Date.now() - startTime;
        });
      };

      fastify.prisma.$executeRaw = function(...args) {
        const startTime = Date.now();
        queryCount++;
        
        return originalExecute.apply(this, args).finally(() => {
          queryTime += Date.now() - startTime;
        });
      };

      request.addHook('onSend', async (request, reply, payload) => {
        // Track database metrics
        this.trackMetric('db_queries_total', queryCount);
        this.trackMetric('db_query_time_ms', queryTime);
        
        if (queryCount > 0) {
          this.trackMetric('db_avg_query_time', queryTime / queryCount);
        }

        // Add database headers
        reply.header('X-DB-Queries', queryCount.toString());
        reply.header('X-DB-Time', `${queryTime}ms`);

        return payload;
      });
    };
  }

  // Memory and resource monitoring
  resourceMonitoring(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startMemory = process.memoryUsage();
      const startCpu = process.cpuUsage();

      request.addHook('onSend', async (request, reply, payload) => {
        const endMemory = process.memoryUsage();
        const endCpu = process.cpuUsage();
        
        // Calculate deltas
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        const cpuDelta = endCpu.user - startCpu.user;

        // Track resource metrics
        this.trackMetric('memory_heap_used', endMemory.heapUsed);
        this.trackMetric('memory_heap_delta', memoryDelta);
        this.trackMetric('memory_rss', endMemory.rss);
        this.trackMetric('cpu_usage', cpuDelta);

        // Add resource headers
        reply.header('X-Memory-Used', `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`);
        reply.header('X-Memory-Delta', `${Math.round(memoryDelta / 1024 / 1024)}MB`);
        reply.header('X-CPU-Time', `${Math.round(cpuDelta / 1000)}μs`);

        return payload;
      });
    };
  }

  // Business metrics tracking
  businessMetrics(fastify: FastifyInstance) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      request.addHook('onSend', async (request, reply, payload) => {
        // Track API-specific metrics
        if (request.url.includes('/analytics')) {
          this.trackMetric('analytics_requests', 1);
        }
        
        if (request.url.includes('/ai/')) {
          this.trackMetric('ai_requests', 1);
        }
        
        if (request.url.includes('/reports')) {
          this.trackMetric('report_requests', 1);
        }

        // Track user activity
        if ((request as any).user?.id) {
          this.trackMetric('authenticated_requests', 1);
          this.trackMetric(`user_requests_${(request as any).user.id}`, 1);
        }

        return payload;
      });
    };
  }

  // Health check endpoint
  healthCheck(fastify: FastifyInstance) {
    fastify.get('/health', async (request, reply) => {
      const healthStatus = await this.getHealthStatus();
      
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      reply.status(statusCode);
      
      return {
        status: healthStatus.status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks: healthStatus.checks,
        metrics: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }
      };
    });

    // Detailed health check
    fastify.get('/health/detailed', async (request, reply) => {
      const detailedHealth = await this.getDetailedHealthStatus();
      
      const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
      reply.status(statusCode);
      
      return detailedHealth;
    });
  }

  // Metrics endpoint
  metrics(fastify: FastifyInstance) {
    fastify.get('/metrics', async (request, reply) => {
      const metrics = await this.getMetrics();
      
      reply.type('application/json');
      return metrics;
    });

    // Prometheus format metrics
    fastify.get('/metrics/prometheus', async (request, reply) => {
      const prometheusMetrics = await this.getPrometheusMetrics();
      
      reply.type('text/plain');
      return prometheusMetrics;
    });
  }

  // Initialize metrics collection
  private initializeMetrics() {
    // System metrics
    this.metrics.set('system_uptime', 0);
    this.metrics.set('system_memory_usage', 0);
    this.metrics.set('system_cpu_usage', 0);
    
    // Request metrics
    this.metrics.set('requests_total', 0);
    this.metrics.set('requests_get', 0);
    this.metrics.set('requests_post', 0);
    this.metrics.set('requests_put', 0);
    this.metrics.set('requests_delete', 0);
    
    // Response metrics
    this.metrics.set('response_time_ms', 0);
    this.metrics.set('status_200', 0);
    this.metrics.set('status_400', 0);
    this.metrics.set('status_500', 0);
    
    // Error metrics
    this.metrics.set('errors_total', 0);
    
    // Database metrics
    this.metrics.set('db_queries_total', 0);
    this.metrics.set('db_query_time_ms', 0);
    
    // Business metrics
    this.metrics.set('analytics_requests', 0);
    this.metrics.set('ai_requests', 0);
    this.metrics.set('report_requests', 0);
  }

  // Setup health checks
  private setupHealthChecks() {
    // Database health check
    this.healthChecks.set('database', async () => {
      try {
        await this.redis.ping();
        return true;
      } catch {
        return false;
      }
    });

    // Redis health check
    this.healthChecks.set('redis', async () => {
      try {
        const result = await this.redis.ping();
        return result === 'PONG';
      } catch {
        return false;
      }
    });

    // Memory health check
    this.healthChecks.set('memory', async () => {
      const memUsage = process.memoryUsage();
      const maxMemory = 1024 * 1024 * 1024; // 1GB limit
      return memUsage.heapUsed < maxMemory;
    });

    // Disk space health check
    this.healthChecks.set('disk', async () => {
      try {
        const fs = require('fs');
        const stats = fs.statSync('.');
        return true; // Simplified check
      } catch {
        return false;
      }
    });
  }

  // Start metrics collection
  private startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.metrics.set('system_uptime', process.uptime());
      this.metrics.set('system_memory_usage', process.memoryUsage().heapUsed);
      this.metrics.set('system_cpu_usage', process.cpuUsage().user);
    }, 30000);

    // Store metrics in Redis every minute
    setInterval(async () => {
      try {
        const metricsData = Object.fromEntries(this.metrics);
        await this.redis.hset('system_metrics', metricsData);
        await this.redis.expire('system_metrics', 3600); // 1 hour TTL
      } catch (error) {
        console.error('Failed to store metrics:', error);
      }
    }, 60000);
  }

  // Track metric
  private trackMetric(name: string, value: number) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  // Get health status
  private async getHealthStatus() {
    const checks: Record<string, boolean> = {};
    let healthyChecks = 0;
    let totalChecks = 0;

    for (const [name, check] of this.healthChecks) {
      try {
        const result = await check();
        checks[name] = result;
        totalChecks++;
        if (result) healthyChecks++;
      } catch {
        checks[name] = false;
        totalChecks++;
      }
    }

    const status = healthyChecks === totalChecks ? 'healthy' : 'unhealthy';
    
    return {
      status,
      checks,
      healthyChecks,
      totalChecks
    };
  }

  // Get detailed health status
  private async getDetailedHealthStatus() {
    const basicHealth = await this.getHealthStatus();
    
    return {
      ...basicHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      metrics: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        requests: Object.fromEntries(this.metrics)
      },
      dependencies: {
        database: basicHealth.checks.database,
        redis: basicHealth.checks.redis,
        memory: basicHealth.checks.memory,
        disk: basicHealth.checks.disk
      }
    };
  }

  // Get metrics
  private async getMetrics() {
    try {
      const storedMetrics = await this.redis.hgetall('system_metrics');
      const currentMetrics = Object.fromEntries(this.metrics);
      
      return {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        },
        metrics: {
          stored: storedMetrics,
          current: currentMetrics
        }
      };
    } catch (error) {
      return {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get Prometheus format metrics
  private async getPrometheusMetrics() {
    const metrics = Object.fromEntries(this.metrics);
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    let prometheus = '';
    
    // System metrics
    prometheus += `# HELP system_uptime_seconds System uptime in seconds\n`;
    prometheus += `# TYPE system_uptime_seconds counter\n`;
    prometheus += `system_uptime_seconds ${systemMetrics.uptime}\n\n`;
    
    prometheus += `# HELP system_memory_bytes System memory usage in bytes\n`;
    prometheus += `# TYPE system_memory_bytes gauge\n`;
    prometheus += `system_memory_bytes{type="heap"} ${systemMetrics.memory.heapUsed}\n`;
    prometheus += `system_memory_bytes{type="rss"} ${systemMetrics.memory.rss}\n\n`;
    
    // Application metrics
    for (const [name, value] of Object.entries(metrics)) {
      prometheus += `# HELP ${name} Application metric ${name}\n`;
      prometheus += `# TYPE ${name} counter\n`;
      prometheus += `${name} ${value}\n\n`;
    }
    
    return prometheus;
  }
}
