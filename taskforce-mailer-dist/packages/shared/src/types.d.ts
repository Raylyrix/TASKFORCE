import { z } from 'zod';
export declare const UserRoleSchema: z.ZodEnum<["VIEWER", "ANALYST", "MANAGER", "ADMIN", "OWNER"]>;
export declare const TeamRoleSchema: z.ZodEnum<["MEMBER", "LEAD", "ADMIN"]>;
export declare const EmailProviderSchema: z.ZodEnum<["GMAIL", "OUTLOOK", "EXCHANGE"]>;
export declare const AnalysisTypeSchema: z.ZodEnum<["PRIORITY", "SENTIMENT", "SUMMARY", "TASK_EXTRACTION", "CATEGORIZATION", "SMART_REPLY"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type EmailProvider = z.infer<typeof EmailProviderSchema>;
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};
export declare const DateRangeSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
}, "strip", z.ZodTypeAny, {
    start: string;
    end: string;
}, {
    start: string;
    end: string;
}>;
export declare const AnalyticsFiltersSchema: z.ZodObject<{
    dateRange: z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>;
    mailboxIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    teamIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    contactIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    dateRange: {
        start: string;
        end: string;
    };
    mailboxIds?: string[] | undefined;
    teamIds?: string[] | undefined;
    contactIds?: string[] | undefined;
    labels?: string[] | undefined;
}, {
    dateRange: {
        start: string;
        end: string;
    };
    mailboxIds?: string[] | undefined;
    teamIds?: string[] | undefined;
    contactIds?: string[] | undefined;
    labels?: string[] | undefined;
}>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>;
export declare const VolumeDataSchema: z.ZodObject<{
    date: z.ZodString;
    sent: z.ZodNumber;
    received: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    received: number;
    date: string;
    sent: number;
    total: number;
}, {
    received: number;
    date: string;
    sent: number;
    total: number;
}>;
export declare const VolumeResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        sent: z.ZodNumber;
        received: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        received: number;
        date: string;
        sent: number;
        total: number;
    }, {
        received: number;
        date: string;
        sent: number;
        total: number;
    }>, "many">;
    summary: z.ZodObject<{
        totalSent: z.ZodNumber;
        totalReceived: z.ZodNumber;
        avgDailySent: z.ZodNumber;
        avgDailyReceived: z.ZodNumber;
        growthRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        totalSent: number;
        totalReceived: number;
        avgDailySent: number;
        avgDailyReceived: number;
        growthRate?: number | undefined;
    }, {
        totalSent: number;
        totalReceived: number;
        avgDailySent: number;
        avgDailyReceived: number;
        growthRate?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        received: number;
        date: string;
        sent: number;
        total: number;
    }[];
    summary: {
        totalSent: number;
        totalReceived: number;
        avgDailySent: number;
        avgDailyReceived: number;
        growthRate?: number | undefined;
    };
}, {
    data: {
        received: number;
        date: string;
        sent: number;
        total: number;
    }[];
    summary: {
        totalSent: number;
        totalReceived: number;
        avgDailySent: number;
        avgDailyReceived: number;
        growthRate?: number | undefined;
    };
}>;
export type VolumeData = z.infer<typeof VolumeDataSchema>;
export type VolumeResponse = z.infer<typeof VolumeResponseSchema>;
export declare const ResponseTimeDataSchema: z.ZodObject<{
    date: z.ZodString;
    avgResponseTime: z.ZodNumber;
    medianResponseTime: z.ZodNumber;
    p90ResponseTime: z.ZodNumber;
    responseCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    avgResponseTime: number;
    medianResponseTime: number;
    p90ResponseTime: number;
    responseCount: number;
}, {
    date: string;
    avgResponseTime: number;
    medianResponseTime: number;
    p90ResponseTime: number;
    responseCount: number;
}>;
export declare const ResponseTimeResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        avgResponseTime: z.ZodNumber;
        medianResponseTime: z.ZodNumber;
        p90ResponseTime: z.ZodNumber;
        responseCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        avgResponseTime: number;
        medianResponseTime: number;
        p90ResponseTime: number;
        responseCount: number;
    }, {
        date: string;
        avgResponseTime: number;
        medianResponseTime: number;
        p90ResponseTime: number;
        responseCount: number;
    }>, "many">;
    summary: z.ZodObject<{
        overallAvg: z.ZodNumber;
        overallMedian: z.ZodNumber;
        overallP90: z.ZodNumber;
        fastestResponse: z.ZodNumber;
        slowestResponse: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        overallAvg: number;
        overallMedian: number;
        overallP90: number;
        fastestResponse: number;
        slowestResponse: number;
    }, {
        overallAvg: number;
        overallMedian: number;
        overallP90: number;
        fastestResponse: number;
        slowestResponse: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        date: string;
        avgResponseTime: number;
        medianResponseTime: number;
        p90ResponseTime: number;
        responseCount: number;
    }[];
    summary: {
        overallAvg: number;
        overallMedian: number;
        overallP90: number;
        fastestResponse: number;
        slowestResponse: number;
    };
}, {
    data: {
        date: string;
        avgResponseTime: number;
        medianResponseTime: number;
        p90ResponseTime: number;
        responseCount: number;
    }[];
    summary: {
        overallAvg: number;
        overallMedian: number;
        overallP90: number;
        fastestResponse: number;
        slowestResponse: number;
    };
}>;
export type ResponseTimeData = z.infer<typeof ResponseTimeDataSchema>;
export type ResponseTimeResponse = z.infer<typeof ResponseTimeResponseSchema>;
export declare const ContactDataSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
    messageCount: z.ZodNumber;
    responseRate: z.ZodNumber;
    avgResponseTime: z.ZodOptional<z.ZodNumber>;
    lastContact: z.ZodString;
    healthScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    messageCount: number;
    responseRate: number;
    lastContact: string;
    healthScore: number;
    avgResponseTime?: number | undefined;
    name?: string | undefined;
    domain?: string | undefined;
}, {
    id: string;
    email: string;
    messageCount: number;
    responseRate: number;
    lastContact: string;
    healthScore: number;
    avgResponseTime?: number | undefined;
    name?: string | undefined;
    domain?: string | undefined;
}>;
export declare const ContactResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        domain: z.ZodOptional<z.ZodString>;
        messageCount: z.ZodNumber;
        responseRate: z.ZodNumber;
        avgResponseTime: z.ZodOptional<z.ZodNumber>;
        lastContact: z.ZodString;
        healthScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        messageCount: number;
        responseRate: number;
        lastContact: string;
        healthScore: number;
        avgResponseTime?: number | undefined;
        name?: string | undefined;
        domain?: string | undefined;
    }, {
        id: string;
        email: string;
        messageCount: number;
        responseRate: number;
        lastContact: string;
        healthScore: number;
        avgResponseTime?: number | undefined;
        name?: string | undefined;
        domain?: string | undefined;
    }>, "many">;
    summary: z.ZodObject<{
        totalContacts: z.ZodNumber;
        activeContacts: z.ZodNumber;
        avgResponseRate: z.ZodNumber;
        topDomains: z.ZodArray<z.ZodObject<{
            domain: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            domain: string;
            count: number;
        }, {
            domain: string;
            count: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        totalContacts: number;
        activeContacts: number;
        avgResponseRate: number;
        topDomains: {
            domain: string;
            count: number;
        }[];
    }, {
        totalContacts: number;
        activeContacts: number;
        avgResponseRate: number;
        topDomains: {
            domain: string;
            count: number;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id: string;
        email: string;
        messageCount: number;
        responseRate: number;
        lastContact: string;
        healthScore: number;
        avgResponseTime?: number | undefined;
        name?: string | undefined;
        domain?: string | undefined;
    }[];
    summary: {
        totalContacts: number;
        activeContacts: number;
        avgResponseRate: number;
        topDomains: {
            domain: string;
            count: number;
        }[];
    };
}, {
    data: {
        id: string;
        email: string;
        messageCount: number;
        responseRate: number;
        lastContact: string;
        healthScore: number;
        avgResponseTime?: number | undefined;
        name?: string | undefined;
        domain?: string | undefined;
    }[];
    summary: {
        totalContacts: number;
        activeContacts: number;
        avgResponseRate: number;
        topDomains: {
            domain: string;
            count: number;
        }[];
    };
}>;
export type ContactData = z.infer<typeof ContactDataSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
export declare const AIQuerySchema: z.ZodObject<{
    query: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
        }, {
            start: string;
            end: string;
        }>>;
        mailboxIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeCharts: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        includeCharts: boolean;
        dateRange?: {
            start: string;
            end: string;
        } | undefined;
        mailboxIds?: string[] | undefined;
    }, {
        dateRange?: {
            start: string;
            end: string;
        } | undefined;
        mailboxIds?: string[] | undefined;
        includeCharts?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    context?: {
        includeCharts: boolean;
        dateRange?: {
            start: string;
            end: string;
        } | undefined;
        mailboxIds?: string[] | undefined;
    } | undefined;
}, {
    query: string;
    context?: {
        dateRange?: {
            start: string;
            end: string;
        } | undefined;
        mailboxIds?: string[] | undefined;
        includeCharts?: boolean | undefined;
    } | undefined;
}>;
export declare const AIResponseSchema: z.ZodObject<{
    response: z.ZodString;
    charts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        data: z.ZodAny;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        data?: any;
    }, {
        type: string;
        title: string;
        data?: any;
    }>, "many">>;
    sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    response: string;
    charts?: {
        type: string;
        title: string;
        data?: any;
    }[] | undefined;
    sources?: string[] | undefined;
    confidence?: number | undefined;
}, {
    response: string;
    charts?: {
        type: string;
        title: string;
        data?: any;
    }[] | undefined;
    sources?: string[] | undefined;
    confidence?: number | undefined;
}>;
export type AIQuery = z.infer<typeof AIQuerySchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const LoginResponseSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<["VIEWER", "ANALYST", "MANAGER", "ADMIN", "OWNER"]>;
        organizationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        role: "VIEWER" | "ANALYST" | "MANAGER" | "ADMIN" | "OWNER";
        organizationId: string;
        name?: string | undefined;
    }, {
        id: string;
        email: string;
        role: "VIEWER" | "ANALYST" | "MANAGER" | "ADMIN" | "OWNER";
        organizationId: string;
        name?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    token: string;
    user: {
        id: string;
        email: string;
        role: "VIEWER" | "ANALYST" | "MANAGER" | "ADMIN" | "OWNER";
        organizationId: string;
        name?: string | undefined;
    };
}, {
    token: string;
    user: {
        id: string;
        email: string;
        role: "VIEWER" | "ANALYST" | "MANAGER" | "ADMIN" | "OWNER";
        organizationId: string;
        name?: string | undefined;
    };
}>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export declare const WebhookEventSchema: z.ZodObject<{
    type: z.ZodString;
    mailboxId: z.ZodString;
    data: z.ZodAny;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    mailboxId: string;
    timestamp: string;
    data?: any;
}, {
    type: string;
    mailboxId: string;
    timestamp: string;
    data?: any;
}>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export declare const ReportRequestSchema: z.ZodObject<{
    type: z.ZodEnum<["WEEKLY", "MONTHLY", "QUARTERLY", "CUSTOM"]>;
    dateRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>>;
    format: z.ZodDefault<z.ZodEnum<["PDF", "CSV", "EXCEL"]>>;
    includeAIInsights: z.ZodDefault<z.ZodBoolean>;
    recipients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM";
    format: "PDF" | "CSV" | "EXCEL";
    includeAIInsights: boolean;
    dateRange?: {
        start: string;
        end: string;
    } | undefined;
    recipients?: string[] | undefined;
}, {
    type: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM";
    dateRange?: {
        start: string;
        end: string;
    } | undefined;
    format?: "PDF" | "CSV" | "EXCEL" | undefined;
    includeAIInsights?: boolean | undefined;
    recipients?: string[] | undefined;
}>;
export type ReportRequest = z.infer<typeof ReportRequestSchema>;
//# sourceMappingURL=types.d.ts.map