import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ReportingService } from '../services/reporting';
import { createApiResponse } from '@taskforce/shared';
import { z } from 'zod';

const reportConfigSchema = z.object({
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  format: z.enum(['pdf', 'excel', 'email']),
  template: z.string().optional(),
  recipients: z.array(z.string().email()).optional(),
  includeAI: z.boolean().default(true)
});

export async function reportRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma as PrismaClient;
  const reportingService = new ReportingService(prisma);

  // Generate report
  fastify.post('/api/v1/reports/generate', {
    schema: {
      body: reportConfigSchema
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId, organizationId } = request.user as any;
      const config = request.body as any;

      const result = await reportingService.generateReport({
        userId,
        organizationId,
        dateRange: {
          start: new Date(config.dateRange.start),
          end: new Date(config.dateRange.end)
        },
        format: config.format,
        template: config.template,
        recipients: config.recipients,
        includeAI: config.includeAI
      });

      if (result.filePath && config.format !== 'email') {
        // Return file download link
        return createApiResponse(true, {
          message: 'Report generated successfully',
          downloadUrl: `/api/v1/reports/download/${result.filePath.split('/').pop()}`,
          reportData: result.data
        });
      } else {
        return createApiResponse(true, {
          message: 'Report generated and sent successfully',
          reportData: result.data
        });
      }
    } catch (error) {
      fastify.log.error('Report generation error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Report generation failed'));
    }
  });

  // Download report file
  fastify.get('/api/v1/reports/download/:filename', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { filename } = request.params as { filename: string };
      
      // Security: Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        reply.status(400).send(createApiResponse(false, null, 'Invalid filename'));
        return;
      }

      const filePath = `${__dirname}/../../reports/${filename}`;
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        reply.status(404).send(createApiResponse(false, null, 'Report file not found'));
        return;
      }

      // Set appropriate headers
      const ext = filename.split('.').pop();
      const contentType = ext === 'pdf' ? 'application/pdf' : 
                         ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                         'application/octet-stream';

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      
      return reply.sendFile(filename, `${__dirname}/../../reports/`);
    } catch (error) {
      fastify.log.error('Report download error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Report download failed'));
    }
  });

  // Get user's reports history
  fastify.get('/api/v1/reports', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId, organizationId } = request.user as any;

      const reports = await reportingService.getReports(userId, organizationId);

      return createApiResponse(true, { reports });
    } catch (error) {
      fastify.log.error('Get reports error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Failed to fetch reports'));
    }
  });

  // Schedule recurring report
  fastify.post('/api/v1/reports/schedule', {
    schema: {
      body: z.object({
        dateRange: z.object({
          start: z.string().datetime(),
          end: z.string().datetime()
        }),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        format: z.enum(['pdf', 'excel', 'email']),
        recipients: z.array(z.string().email()).optional(),
        includeAI: z.boolean().default(true)
      })
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId, organizationId } = request.user as any;
      const config = request.body as any;

      await reportingService.scheduleReport(userId, {
        organizationId,
        dateRange: {
          start: new Date(config.dateRange.start),
          end: new Date(config.dateRange.end)
        },
        format: config.format,
        recipients: config.recipients,
        includeAI: config.includeAI
      });

      return createApiResponse(true, { message: 'Report scheduled successfully' });
    } catch (error) {
      fastify.log.error('Schedule report error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Failed to schedule report'));
    }
  });

  // Get report templates
  fastify.get('/api/v1/reports/templates', async (request, reply) => {
    try {
      await request.jwtVerify();

      const templates = [
        {
          id: 'standard',
          name: 'Standard Report',
          description: 'Comprehensive email analytics report with charts and insights',
          preview: '/api/v1/reports/preview/standard'
        },
        {
          id: 'executive',
          name: 'Executive Summary',
          description: 'High-level overview for management and stakeholders',
          preview: '/api/v1/reports/preview/executive'
        },
        {
          id: 'detailed',
          name: 'Detailed Analysis',
          description: 'In-depth analysis with all metrics and AI insights',
          preview: '/api/v1/reports/preview/detailed'
        }
      ];

      return createApiResponse(true, { templates });
    } catch (error) {
      fastify.log.error('Get templates error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Failed to fetch templates'));
    }
  });

  // Preview report template
  fastify.get('/api/v1/reports/preview/:templateId', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { templateId } = request.params as { templateId: string };

      // Generate a preview of the template with sample data
      const sampleData = {
        overview: {
          totalSent: 245,
          totalReceived: 189,
          averageResponseTime: '2h 15m',
          topContact: 'john.doe@company.com',
          responseRate: 87,
          activeThreads: 23
        },
        volume: {
          daily: [
            { date: '2024-01-01', sent: 12, received: 8, total: 20 },
            { date: '2024-01-02', sent: 15, received: 11, total: 26 },
            { date: '2024-01-03', sent: 18, received: 9, total: 27 }
          ]
        },
        insights: [
          'Your response rate of 87% is excellent and above industry average.',
          'Consider using email templates to improve your 2h 15m average response time.',
          'Your top contact represents 15% of your email volume - consider prioritizing responses.'
        ]
      };

      const reportingService = new ReportingService(prisma);
      const htmlContent = await reportingService['generateHTMLReport'](sampleData, { template: templateId });

      reply.header('Content-Type', 'text/html');
      return htmlContent;
    } catch (error) {
      fastify.log.error('Preview template error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Failed to preview template'));
    }
  });

  // Delete report
  fastify.delete('/api/v1/reports/:reportId', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId, organizationId } = request.user as any;
      const { reportId } = request.params as { reportId: string };

      const report = await prisma.report.findFirst({
        where: {
          id: reportId,
          userId,
          organizationId
        }
      });

      if (!report) {
        reply.status(404).send(createApiResponse(false, null, 'Report not found'));
        return;
      }

      await prisma.report.delete({
        where: { id: reportId }
      });

      return createApiResponse(true, { message: 'Report deleted successfully' });
    } catch (error) {
      fastify.log.error('Delete report error:', error);
      reply.status(500).send(createApiResponse(false, null, 'Failed to delete report'));
    }
  });
}
