"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRequestSchema = exports.WebhookEventSchema = exports.LoginResponseSchema = exports.LoginRequestSchema = exports.AIResponseSchema = exports.AIQuerySchema = exports.ContactResponseSchema = exports.ContactDataSchema = exports.ResponseTimeResponseSchema = exports.ResponseTimeDataSchema = exports.VolumeResponseSchema = exports.VolumeDataSchema = exports.AnalyticsFiltersSchema = exports.DateRangeSchema = exports.ApiResponseSchema = exports.AnalysisTypeSchema = exports.EmailProviderSchema = exports.TeamRoleSchema = exports.UserRoleSchema = void 0;
const zod_1 = require("zod");
exports.UserRoleSchema = zod_1.z.enum(['VIEWER', 'ANALYST', 'MANAGER', 'ADMIN', 'OWNER']);
exports.TeamRoleSchema = zod_1.z.enum(['MEMBER', 'LEAD', 'ADMIN']);
exports.EmailProviderSchema = zod_1.z.enum(['GMAIL', 'OUTLOOK', 'EXCHANGE']);
exports.AnalysisTypeSchema = zod_1.z.enum([
    'PRIORITY',
    'SENTIMENT',
    'SUMMARY',
    'TASK_EXTRACTION',
    'CATEGORIZATION',
    'SMART_REPLY'
]);
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema.optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
exports.ApiResponseSchema = ApiResponseSchema;
exports.DateRangeSchema = zod_1.z.object({
    start: zod_1.z.string().datetime(),
    end: zod_1.z.string().datetime(),
});
exports.AnalyticsFiltersSchema = zod_1.z.object({
    dateRange: exports.DateRangeSchema,
    mailboxIds: zod_1.z.array(zod_1.z.string()).optional(),
    teamIds: zod_1.z.array(zod_1.z.string()).optional(),
    contactIds: zod_1.z.array(zod_1.z.string()).optional(),
    labels: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.VolumeDataSchema = zod_1.z.object({
    date: zod_1.z.string(),
    sent: zod_1.z.number(),
    received: zod_1.z.number(),
    total: zod_1.z.number(),
});
exports.VolumeResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.VolumeDataSchema),
    summary: zod_1.z.object({
        totalSent: zod_1.z.number(),
        totalReceived: zod_1.z.number(),
        avgDailySent: zod_1.z.number(),
        avgDailyReceived: zod_1.z.number(),
        growthRate: zod_1.z.number().optional(),
    }),
});
exports.ResponseTimeDataSchema = zod_1.z.object({
    date: zod_1.z.string(),
    avgResponseTime: zod_1.z.number(),
    medianResponseTime: zod_1.z.number(),
    p90ResponseTime: zod_1.z.number(),
    responseCount: zod_1.z.number(),
});
exports.ResponseTimeResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.ResponseTimeDataSchema),
    summary: zod_1.z.object({
        overallAvg: zod_1.z.number(),
        overallMedian: zod_1.z.number(),
        overallP90: zod_1.z.number(),
        fastestResponse: zod_1.z.number(),
        slowestResponse: zod_1.z.number(),
    }),
});
exports.ContactDataSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    domain: zod_1.z.string().optional(),
    messageCount: zod_1.z.number(),
    responseRate: zod_1.z.number(),
    avgResponseTime: zod_1.z.number().optional(),
    lastContact: zod_1.z.string().datetime(),
    healthScore: zod_1.z.number(),
});
exports.ContactResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.ContactDataSchema),
    summary: zod_1.z.object({
        totalContacts: zod_1.z.number(),
        activeContacts: zod_1.z.number(),
        avgResponseRate: zod_1.z.number(),
        topDomains: zod_1.z.array(zod_1.z.object({
            domain: zod_1.z.string(),
            count: zod_1.z.number(),
        })),
    }),
});
exports.AIQuerySchema = zod_1.z.object({
    query: zod_1.z.string(),
    context: zod_1.z.object({
        dateRange: exports.DateRangeSchema.optional(),
        mailboxIds: zod_1.z.array(zod_1.z.string()).optional(),
        includeCharts: zod_1.z.boolean().default(false),
    }).optional(),
});
exports.AIResponseSchema = zod_1.z.object({
    response: zod_1.z.string(),
    charts: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        data: zod_1.z.any(),
        title: zod_1.z.string(),
    })).optional(),
    sources: zod_1.z.array(zod_1.z.string()).optional(),
    confidence: zod_1.z.number().optional(),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.LoginResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
    user: zod_1.z.object({
        id: zod_1.z.string(),
        email: zod_1.z.string(),
        name: zod_1.z.string().optional(),
        role: exports.UserRoleSchema,
        organizationId: zod_1.z.string(),
    }),
});
exports.WebhookEventSchema = zod_1.z.object({
    type: zod_1.z.string(),
    mailboxId: zod_1.z.string(),
    data: zod_1.z.any(),
    timestamp: zod_1.z.string().datetime(),
});
exports.ReportRequestSchema = zod_1.z.object({
    type: zod_1.z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']),
    dateRange: exports.DateRangeSchema.optional(),
    format: zod_1.z.enum(['PDF', 'CSV', 'EXCEL']).default('PDF'),
    includeAIInsights: zod_1.z.boolean().default(true),
    recipients: zod_1.z.array(zod_1.z.string().email()).optional(),
});
//# sourceMappingURL=types.js.map