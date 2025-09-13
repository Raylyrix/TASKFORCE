import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createApiResponse } from '@taskforce/shared';

// Enhanced validation middleware
export class ValidationMiddleware {
  
  // Request validation decorator
  static validate(schema: {
    body?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
    params?: z.ZodSchema<any>;
    headers?: z.ZodSchema<any>;
  }) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const errors: string[] = [];

      try {
        // Validate body
        if (schema.body && request.body) {
          const bodyResult = schema.body.safeParse(request.body);
          if (!bodyResult.success) {
            errors.push(`Body: ${bodyResult.error.errors.map(e => e.message).join(', ')}`);
          } else {
            request.body = bodyResult.data;
          }
        }

        // Validate query parameters
        if (schema.query && request.query) {
          const queryResult = schema.query.safeParse(request.query);
          if (!queryResult.success) {
            errors.push(`Query: ${queryResult.error.errors.map(e => e.message).join(', ')}`);
          } else {
            request.query = queryResult.data;
          }
        }

        // Validate route parameters
        if (schema.params && request.params) {
          const paramsResult = schema.params.safeParse(request.params);
          if (!paramsResult.success) {
            errors.push(`Params: ${paramsResult.error.errors.map(e => e.message).join(', ')}`);
          } else {
            request.params = paramsResult.data;
          }
        }

        // Validate headers
        if (schema.headers && request.headers) {
          const headersResult = schema.headers.safeParse(request.headers);
          if (!headersResult.success) {
            errors.push(`Headers: ${headersResult.error.errors.map(e => e.message).join(', ')}`);
          } else {
            request.headers = headersResult.data;
          }
        }

        // Return validation errors
        if (errors.length > 0) {
          reply.status(400);
          return createApiResponse(false, null, `Validation failed: ${errors.join('; ')}`);
        }

      } catch (error) {
        reply.status(500);
        return createApiResponse(false, null, 'Validation error occurred');
      }
    };
  }

  // Sanitize and validate input
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        // Skip dangerous keys
        if (key.startsWith('__') || key.includes('prototype') || key.includes('constructor')) {
          continue;
        }
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  private static sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .trim();
  }
}

// Common validation schemas
export const ValidationSchemas = {
  // Authentication
  LoginRequest: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  }),

  // Analytics
  AnalyticsQuery: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    mailboxId: z.string().cuid().optional(),
    teamId: z.string().cuid().optional(),
    limit: z.coerce.number().min(1).max(1000).default(100),
    offset: z.coerce.number().min(0).default(0)
  }),

  // AI Requests
  AIQueryRequest: z.object({
    query: z.string().min(1, 'Query cannot be empty').max(1000, 'Query too long'),
    context: z.object({
      threadId: z.string().cuid().optional(),
      messageId: z.string().cuid().optional(),
      includeHistory: z.boolean().default(false)
    }).optional(),
    options: z.object({
      includeSources: z.boolean().default(false),
      maxTokens: z.number().min(1).max(4000).default(1000)
    }).optional()
  }),

  // Report Generation
  ReportRequest: z.object({
    type: z.enum(['pdf', 'excel', 'email']),
    template: z.string().optional(),
    dateRange: z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date()
    }),
    recipients: z.array(z.string().email()).optional(),
    includeCharts: z.boolean().default(true),
    includeAIInsights: z.boolean().default(true)
  }),

  // Webhook Validation
  GmailWebhook: z.object({
    message: z.object({
      data: z.string(),
      messageId: z.string(),
      publishTime: z.string()
    }),
    subscription: z.string()
  }),

  OutlookWebhook: z.object({
    value: z.array(z.object({
      subscriptionId: z.string(),
      subscriptionExpirationDateTime: z.string(),
      changeType: z.string(),
      resource: z.string(),
      resourceData: z.object({
        id: z.string(),
        '@odata.type': z.string(),
        '@odata.id': z.string(),
        '@odata.etag': z.string()
      })
    }))
  }),

  // User Management
  CreateUserRequest: z.object({
    email: z.string().email(),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['VIEWER', 'ANALYST', 'MANAGER', 'ADMIN', 'OWNER']).default('VIEWER'),
    teamIds: z.array(z.string().cuid()).optional()
  }),

  UpdateUserRequest: z.object({
    name: z.string().min(1).optional(),
    role: z.enum(['VIEWER', 'ANALYST', 'MANAGER', 'ADMIN', 'OWNER']).optional(),
    isActive: z.boolean().optional(),
    preferences: z.record(z.any()).optional()
  }),

  // Team Management
  CreateTeamRequest: z.object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
    department: z.string().optional(),
    memberIds: z.array(z.string().cuid()).optional()
  }),

  // Automation Rules
  CreateRuleRequest: z.object({
    name: z.string().min(1, 'Rule name is required'),
    description: z.string().optional(),
    conditions: z.record(z.any()),
    actions: z.record(z.any()),
    isActive: z.boolean().default(true)
  }),

  // Pagination
  PaginationQuery: z.object({
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  // Date Range
  DateRangeQuery: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  }).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date"
  }),

  // File Upload
  FileUpload: z.object({
    filename: z.string().min(1),
    mimetype: z.string().regex(/^(image|application|text)\//, 'Invalid file type'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB')
  })
};

// Validation error formatter
export function formatValidationError(error: z.ZodError): string {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  }).join('; ');
}

// Custom validation functions
export const CustomValidators = {
  // Email domain validation
  isValidEmailDomain: (email: string, allowedDomains: string[]): boolean => {
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  },

  // Strong password validation
  isStrongPassword: (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  },

  // Business hours validation
  isBusinessHours: (date: Date): boolean => {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  },

  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};
