import { z } from 'zod';

// Common types used across the platform
export const UserRoleSchema = z.enum(['VIEWER', 'ANALYST', 'MANAGER', 'ADMIN', 'OWNER']);
export const TeamRoleSchema = z.enum(['MEMBER', 'LEAD', 'ADMIN']);
export const EmailProviderSchema = z.enum(['GMAIL', 'OUTLOOK', 'EXCHANGE']);
export const AnalysisTypeSchema = z.enum([
  'PRIORITY',
  'SENTIMENT', 
  'SUMMARY',
  'TASK_EXTRACTION',
  'CATEGORIZATION',
  'SMART_REPLY'
]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type EmailProvider = z.infer<typeof EmailProviderSchema>;
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Analytics schemas
export const DateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const AnalyticsFiltersSchema = z.object({
  dateRange: DateRangeSchema,
  mailboxIds: z.array(z.string()).optional(),
  teamIds: z.array(z.string()).optional(),
  contactIds: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
});

export type DateRange = z.infer<typeof DateRangeSchema>;
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>;

// Volume analytics
export const VolumeDataSchema = z.object({
  date: z.string(),
  sent: z.number(),
  received: z.number(),
  total: z.number(),
});

export const VolumeResponseSchema = z.object({
  data: z.array(VolumeDataSchema),
  summary: z.object({
    totalSent: z.number(),
    totalReceived: z.number(),
    avgDailySent: z.number(),
    avgDailyReceived: z.number(),
    growthRate: z.number().optional(),
  }),
});

export type VolumeData = z.infer<typeof VolumeDataSchema>;
export type VolumeResponse = z.infer<typeof VolumeResponseSchema>;

// Response time analytics
export const ResponseTimeDataSchema = z.object({
  date: z.string(),
  avgResponseTime: z.number(),
  medianResponseTime: z.number(),
  p90ResponseTime: z.number(),
  responseCount: z.number(),
});

export const ResponseTimeResponseSchema = z.object({
  data: z.array(ResponseTimeDataSchema),
  summary: z.object({
    overallAvg: z.number(),
    overallMedian: z.number(),
    overallP90: z.number(),
    fastestResponse: z.number(),
    slowestResponse: z.number(),
  }),
});

export type ResponseTimeData = z.infer<typeof ResponseTimeDataSchema>;
export type ResponseTimeResponse = z.infer<typeof ResponseTimeResponseSchema>;

// Contact analytics
export const ContactDataSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().optional(),
  domain: z.string().optional(),
  messageCount: z.number(),
  responseRate: z.number(),
  avgResponseTime: z.number().optional(),
  lastContact: z.string().datetime(),
  healthScore: z.number(),
});

export const ContactResponseSchema = z.object({
  data: z.array(ContactDataSchema),
  summary: z.object({
    totalContacts: z.number(),
    activeContacts: z.number(),
    avgResponseRate: z.number(),
    topDomains: z.array(z.object({
      domain: z.string(),
      count: z.number(),
    })),
  }),
});

export type ContactData = z.infer<typeof ContactDataSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;

// AI request schemas
export const AIQuerySchema = z.object({
  query: z.string(),
  context: z.object({
    dateRange: DateRangeSchema.optional(),
    mailboxIds: z.array(z.string()).optional(),
    includeCharts: z.boolean().default(false),
  }).optional(),
});

export const AIResponseSchema = z.object({
  response: z.string(),
  charts: z.array(z.object({
    type: z.string(),
    data: z.any(),
    title: z.string(),
  })).optional(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().optional(),
});

export type AIQuery = z.infer<typeof AIQuerySchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

// Authentication schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().optional(),
    role: UserRoleSchema,
    organizationId: z.string(),
  }),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Webhook schemas
export const WebhookEventSchema = z.object({
  type: z.string(),
  mailboxId: z.string(),
  data: z.any(),
  timestamp: z.string().datetime(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Report schemas
export const ReportRequestSchema = z.object({
  type: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']),
  dateRange: DateRangeSchema.optional(),
  format: z.enum(['PDF', 'CSV', 'EXCEL']).default('PDF'),
  includeAIInsights: z.boolean().default(true),
  recipients: z.array(z.string().email()).optional(),
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;
