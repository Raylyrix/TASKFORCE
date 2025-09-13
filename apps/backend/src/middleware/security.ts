import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { z } from 'zod';

// Security middleware for comprehensive protection
export async function registerSecurityMiddleware(fastify: FastifyInstance) {
  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100, // requests
    timeWindow: '1 minute',
    errorResponseBuilder: function (request, context) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.round(context.timeWindow / 1000)
      };
    },
    keyGenerator: function (request) {
      return request.ip + ':' + request.headers['user-agent'];
    }
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  });

  // Request validation middleware
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        reply.status(400);
        return {
          success: false,
          error: 'Content-Type must be application/json'
        };
      }
    }

    // Sanitize request body
    if (request.body && typeof request.body === 'object') {
      request.body = sanitizeObject(request.body);
    }
  });
}

// Input sanitization
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove potentially dangerous keys
    if (key.startsWith('__') || key.includes('eval') || key.includes('script')) {
      continue;
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}

function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validation schemas
export const CommonSchemas = {
  Pagination: z.object({
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  DateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  }).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date"
  }),

  Email: z.string().email('Invalid email format'),
  
  CUID: z.string().cuid('Invalid ID format'),

  WebhookPayload: z.object({
    headers: z.record(z.string()),
    body: z.any(),
    timestamp: z.coerce.date().default(() => new Date())
  })
};

// Enhanced error handler
export function createSecureErrorHandler(fastify: FastifyInstance) {
  return (error: any, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id;
    const timestamp = new Date().toISOString();
    
    // Log full error details internally
    fastify.log.error({
      requestId,
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode
      },
      request: {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      }
    }, 'Request error occurred');

    // Determine if error should be exposed to client
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isValidationError = error.validation;
    const isClientError = error.statusCode >= 400 && error.statusCode < 500;

    let response = {
      success: false,
      error: 'An internal error occurred',
      requestId,
      timestamp
    };

    if (isDevelopment || isValidationError || isClientError) {
      response.error = error.message;
      if (isDevelopment && error.stack) {
        (response as any).stack = error.stack;
      }
    }

    reply.status(error.statusCode || 500).send(response);
  };
}

// Audit logging middleware
export function auditLogger(fastify: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    
    request.addHook('onSend', async (request, reply, payload) => {
      const duration = Date.now() - startTime;
      
      // Log audit event
      fastify.log.info({
        audit: {
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          duration,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          userId: (request as any).user?.id,
          organizationId: (request as any).user?.organizationId
        }
      }, 'Request completed');

      // Store in audit log if user is authenticated
      if ((request as any).user?.id) {
        try {
          await fastify.prisma.auditLog.create({
            data: {
              action: `${request.method} ${request.url}`,
              resource: request.url,
              resourceId: (request.params as any)?.id,
              details: {
                method: request.method,
                statusCode: reply.statusCode,
                duration,
                ip: request.ip,
                userAgent: request.headers['user-agent']
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              userId: (request as any).user.id
            }
          });
        } catch (auditError) {
          fastify.log.error(auditError, 'Failed to create audit log');
        }
      }

      return payload;
    });
  };
}
