import { z } from 'zod';
export declare function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
export declare function createApiResponse<T>(success: boolean, data?: T, error?: string, message?: string): {
    success: boolean;
    data: T | undefined;
    error: string | undefined;
    message: string | undefined;
    timestamp: string;
};
export declare function hashString(input: string): Promise<string>;
export declare function calculateResponseTime(sentAt: Date, receivedAt: Date): number;
export declare function isInternalDomain(email: string, internalDomains: string[]): boolean;
export declare function extractDomain(email: string): string | null;
export declare function formatBytes(bytes: number): string;
export declare function calculateContactHealthScore(responseRate: number, avgResponseTime: number, messageCount: number): number;
export declare function generateCacheKey(prefix: string, ...parts: (string | number)[]): string;
export declare function safeJsonParse<T>(json: string, fallback: T): T;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map