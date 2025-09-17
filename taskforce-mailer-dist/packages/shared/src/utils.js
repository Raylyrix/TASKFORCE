"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.createApiResponse = createApiResponse;
exports.hashString = hashString;
exports.calculateResponseTime = calculateResponseTime;
exports.isInternalDomain = isInternalDomain;
exports.extractDomain = extractDomain;
exports.formatBytes = formatBytes;
exports.calculateContactHealthScore = calculateContactHealthScore;
exports.generateCacheKey = generateCacheKey;
exports.safeJsonParse = safeJsonParse;
exports.debounce = debounce;
exports.throttle = throttle;
function validateRequest(data, schema) {
    try {
        const result = schema.safeParse(data);
        if (result.success) {
            return { success: true, data: result.data };
        }
        else {
            return {
                success: false,
                error: result.error.errors.map(e => e.message).join(', ')
            };
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown validation error'
        };
    }
}
function createApiResponse(success, data, error, message) {
    return {
        success,
        data,
        error,
        message,
        timestamp: new Date().toISOString()
    };
}
async function hashString(input) {
    const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
    return crypto.createHash('sha256').update(input).digest('hex');
}
function calculateResponseTime(sentAt, receivedAt) {
    return Math.floor((receivedAt.getTime() - sentAt.getTime()) / (1000 * 60));
}
function isInternalDomain(email, internalDomains) {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? internalDomains.some(d => domain === d.toLowerCase()) : false;
}
function extractDomain(email) {
    const parts = email.split('@');
    return parts.length === 2 && parts[1] ? parts[1].toLowerCase() : null;
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
function calculateContactHealthScore(responseRate, avgResponseTime, messageCount) {
    const rateScore = Math.min(responseRate * 100, 100);
    const timeScore = Math.max(0, 100 - (avgResponseTime / (24 * 60)) * 100);
    const countScore = Math.min(messageCount * 2, 100);
    return Math.round((rateScore * 0.4 + timeScore * 0.3 + countScore * 0.3));
}
function generateCacheKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
}
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
//# sourceMappingURL=utils.js.map