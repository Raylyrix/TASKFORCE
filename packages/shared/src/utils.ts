import { z } from 'zod';

// Utility functions used across the platform

/**
 * Validates and parses request data using Zod schemas
 */
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.errors.map(e => e.message).join(', ')
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Creates a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
) {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generates a hash for caching prompts
 */
export async function hashString(input: string): Promise<string> {
  // Use Node.js crypto module for server-side hashing
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Calculates response time between two dates
 */
export function calculateResponseTime(sentAt: Date, receivedAt: Date): number {
  return Math.floor((receivedAt.getTime() - sentAt.getTime()) / (1000 * 60)); // minutes
}

/**
 * Determines if an email domain is internal
 */
export function isInternalDomain(email: string, internalDomains: string[]): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? internalDomains.some(d => domain === d.toLowerCase()) : false;
}

/**
 * Extracts domain from email address
 */
export function extractDomain(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Formats bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculates health score for a contact based on various metrics
 */
export function calculateContactHealthScore(
  responseRate: number,
  avgResponseTime: number,
  messageCount: number
): number {
  // Normalize response rate (0-100)
  const rateScore = Math.min(responseRate * 100, 100);
  
  // Normalize response time (faster = higher score, max 24 hours = 0 score)
  const timeScore = Math.max(0, 100 - (avgResponseTime / (24 * 60)) * 100);
  
  // Message count factor (more messages = higher engagement)
  const countScore = Math.min(messageCount * 2, 100);
  
  // Weighted average
  return Math.round((rateScore * 0.4 + timeScore * 0.3 + countScore * 0.3));
}

/**
 * Generates a unique ID for caching
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
