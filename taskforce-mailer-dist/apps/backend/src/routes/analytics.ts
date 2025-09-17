import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/analytics';
// import { createApiResponse, validateRequest, AnalyticsFiltersSchema } from '@taskforce/shared';
// Temporary local implementations
function createApiResponse(success: boolean, data: any = null, error: string | null = null) {
  return { success, data, error };
}
function validateRequest(data: any, schema: any) { return { success: true, data }; }
type AnalyticsFiltersSchema = any;

export async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new AnalyticsService((fastify as any).prisma);

  // Overview analytics endpoint
  fastify.get('/api/v1/analytics/overview', async (request, reply) => {
    try {
      // In a real app, you'd get organizationId from JWT token
      const organizationId = 'demo-org'; // This would come from auth

      const overview = await analyticsService.getOverviewAnalytics(organizationId);

      return createApiResponse(true, overview);
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch analytics overview');
    }
  });

  // Volume analytics endpoint
  fastify.get('/api/v1/analytics/volume', async (request, reply) => {
    try {
      const validation = validateRequest(request.query, {} as any);
      if (!validation.success) {
        reply.status(400);
        return createApiResponse(false, null, (validation as any).error);
      }

      const filters = validation.data;
      const organizationId = 'demo-org'; // This would come from auth

      const volumeData = await analyticsService.getVolumeAnalytics(organizationId, filters.dateRange);

      return createApiResponse(true, volumeData);
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch volume data');
    }
  });

  // Response time analytics endpoint
  fastify.get('/api/v1/analytics/response-times', async (request, reply) => {
    try {
      const validation = validateRequest(request.query, {} as any);
      if (!validation.success) {
        reply.status(400);
        return createApiResponse(false, null, (validation as any).error);
      }

      const filters = validation.data;
      const organizationId = 'demo-org'; // This would come from auth

      const responseTimeData = await analyticsService.getResponseTimeAnalytics(organizationId, filters.dateRange);

      return createApiResponse(true, responseTimeData);
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch response time data');
    }
  });

  // Contact analytics endpoint
  fastify.get('/api/v1/analytics/contacts', async (request, reply) => {
    try {
      const validation = validateRequest(request.query, {} as any);
      if (!validation.success) {
        reply.status(400);
        return createApiResponse(false, null, (validation as any).error);
      }

      const filters = validation.data;
      const organizationId = 'demo-org'; // This would come from auth

      const contactData = await analyticsService.getContactAnalytics(organizationId, filters.dateRange);

      return createApiResponse(true, contactData);
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch contact data');
    }
  });

  // Thread analytics endpoint
  fastify.get('/api/v1/analytics/threads', async (request, reply) => {
    try {
      const { threadId, mailboxId } = request.query as { threadId?: string; mailboxId?: string };
      
      if (!threadId || !mailboxId) {
        reply.status(400);
        return createApiResponse(false, null, 'Thread ID and Mailbox ID are required');
      }

      // Get thread details
      const thread = await (fastify as any).prisma.thread.findUnique({
        where: {
          threadId_mailboxId: {
            threadId,
            mailboxId
          }
        },
        include: {
          messages: {
            orderBy: { receivedAt: 'asc' },
            select: {
              id: true,
              messageId: true,
              subject: true,
              fromEmail: true,
              fromName: true,
              toEmails: true,
              receivedAt: true,
              snippet: true,
              hasAttachments: true,
              isRead: true,
              isImportant: true
            }
          }
        }
      });

      if (!thread) {
        reply.status(404);
        return createApiResponse(false, null, 'Thread not found');
      }

      return createApiResponse(true, {
        thread: {
          id: thread.id,
          threadId: thread.threadId,
          subject: thread.subject,
          messageCount: thread.messageCount,
          lastMessageAt: thread.lastMessageAt,
          responseTime: thread.responseTime,
          isResolved: thread.isResolved
        },
        messages: thread.messages
      });
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch thread data');
    }
  });

  // Forecasting endpoint
  fastify.get('/api/v1/analytics/forecast', async (request, reply) => {
    try {
      const { days = 30 } = request.query as { days?: number };
      const organizationId = 'demo-org'; // This would come from auth

      // Get historical data for forecasting
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 2) * 24 * 60 * 60 * 1000);

      const volumeData = await analyticsService.getVolumeAnalytics(organizationId, {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      // Simple linear regression for forecasting
      const forecast = this.generateForecast(volumeData.data, 7); // Forecast next 7 days

      return createApiResponse(true, {
        forecast,
        confidence: 0.75,
        method: 'linear_regression',
        historicalDays: days
      });
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to generate forecast');
    }
  });

  // Anomaly detection endpoint
  fastify.get('/api/v1/analytics/anomalies', async (request, reply) => {
    try {
      const { threshold = 2 } = request.query as { threshold?: number };
      const organizationId = 'demo-org'; // This would come from auth

      // Get recent volume data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const volumeData = await analyticsService.getVolumeAnalytics(organizationId, {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      // Detect anomalies using simple statistical methods
      const anomalies = this.detectAnomalies(volumeData.data, threshold);

      return createApiResponse(true, {
        anomalies,
        threshold,
        method: 'statistical_outlier',
        period: '30d'
      });
    } catch (error) {
      console.error(error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to detect anomalies');
    }
  });

  // Helper methods for forecasting and anomaly detection
  function generateForecast(historicalData: any[], days: number): any[] {
    if (historicalData.length < 2) return [];

    // Simple linear regression
    const n = historicalData.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = historicalData.reduce((sum, day) => sum + day.total, 0);
    const xySum = historicalData.reduce((sum, day, index) => sum + index * day.total, 0);
    const x2Sum = historicalData.reduce((sum, day, index) => sum + index * index, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const forecast = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedTotal = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
      
      // Estimate sent/received split based on historical average
      const avgSentRatio = historicalData.reduce((sum, day) => sum + (day.sent / day.total), 0) / n;
      const predictedSent = Math.round(predictedTotal * avgSentRatio);
      const predictedReceived = predictedTotal - predictedSent;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        sent: predictedSent,
        received: predictedReceived,
        total: predictedTotal,
        confidence: Math.max(0, 1 - (i * 0.1)) // Decreasing confidence over time
      });
    }

    return forecast;
  }

  function detectAnomalies(data: any[], threshold: number): any[] {
    if (data.length < 3) return [];

    const totals = data.map(day => day.total);
    const mean = totals.reduce((sum, val) => sum + val, 0) / totals.length;
    const variance = totals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totals.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = [];

    for (let i = 0; i < data.length; i++) {
      const zScore = Math.abs(totals[i] - mean) / stdDev;
      
      if (zScore > threshold) {
        anomalies.push({
          date: data[i].date,
          value: totals[i],
          expected: Math.round(mean),
          zScore: Math.round(zScore * 100) / 100,
          severity: zScore > threshold * 2 ? 'high' : 'medium'
        });
      }
    }

    return anomalies.sort((a, b) => b.zScore - a.zScore);
  }
}
