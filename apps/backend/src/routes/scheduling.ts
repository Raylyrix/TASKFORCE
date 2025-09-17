import { FastifyInstance } from 'fastify';
import { EmailScheduler } from '../services/email-scheduler';
import { supabase } from '../config/supabase';

// Temporary local implementation
function createApiResponse(success: boolean, data: any = null, error: string | null = null) {
  return { success, data, error };
}

export async function schedulingRoutes(fastify: FastifyInstance) {
  const emailScheduler = new EmailScheduler();

  // Schedule email endpoint
  fastify.post('/api/v1/schedule-mail', {
    schema: {
      body: {
        type: 'object',
        required: ['recipients', 'subject', 'body', 'scheduled_at'],
        properties: {
          recipients: {
            type: 'array',
            items: { type: 'string', format: 'email' },
            minItems: 1
          },
          subject: { type: 'string', minLength: 1 },
          body: { type: 'string', minLength: 1 },
          html_body: { type: 'string' },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                content: { type: 'string' },
                contentType: { type: 'string' }
              }
            }
          },
          scheduled_at: { type: 'string', format: 'date-time' },
          max_retries: { type: 'number', minimum: 1, maximum: 10 },
          metadata: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId, organizationId } = request.user as any;
      const emailData = request.body as any;

      // Validate scheduled time is in the future
      const scheduledAt = new Date(emailData.scheduled_at);
      if (scheduledAt <= new Date()) {
        reply.status(400);
        return createApiResponse(false, null, 'Scheduled time must be in the future');
      }

      // Schedule the email
      const emailId = await emailScheduler.scheduleEmail({
        user_id: userId,
        organization_id: organizationId,
        recipients: emailData.recipients,
        subject: emailData.subject,
        body: emailData.body,
        html_body: emailData.html_body,
        attachments: emailData.attachments || [],
        scheduled_at: emailData.scheduled_at,
        max_retries: emailData.max_retries || 3,
        metadata: emailData.metadata || {},
      });

      return createApiResponse(true, { 
        email_id: emailId,
        scheduled_at: emailData.scheduled_at,
        status: 'pending'
      });

    } catch (error) {
      console.error('Schedule email error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to schedule email');
    }
  });

  // Get email status endpoint
  fastify.get('/api/v1/status/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { id } = request.params as { id: string };

      // Get email status from Supabase
      const { data: emailData, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !emailData) {
        reply.status(404);
        return createApiResponse(false, null, 'Email not found');
      }

      return createApiResponse(true, {
        id: emailData.id,
        status: emailData.status,
        scheduled_at: emailData.scheduled_at,
        sent_at: emailData.sent_at,
        retry_count: emailData.retry_count,
        max_retries: emailData.max_retries,
        error_message: emailData.error_message,
        created_at: emailData.created_at,
        updated_at: emailData.updated_at,
      });

    } catch (error) {
      console.error('Get email status error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to get email status');
    }
  });

  // Cancel email endpoint
  fastify.delete('/api/v1/cancel/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { id } = request.params as { id: string };

      // Check if email exists and belongs to user
      const { data: emailData, error } = await supabase
        .from('scheduled_emails')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !emailData) {
        reply.status(404);
        return createApiResponse(false, null, 'Email not found');
      }

      if (emailData.status !== 'pending') {
        reply.status(400);
        return createApiResponse(false, null, 'Only pending emails can be cancelled');
      }

      // Cancel the email
      const cancelled = await emailScheduler.cancelEmail(id);

      if (cancelled) {
        return createApiResponse(true, { message: 'Email cancelled successfully' });
      } else {
        reply.status(500);
        return createApiResponse(false, null, 'Failed to cancel email');
      }

    } catch (error) {
      console.error('Cancel email error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to cancel email');
    }
  });

  // List user's scheduled emails
  fastify.get('/api/v1/scheduled-emails', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'] },
          limit: { type: 'number', minimum: 1, maximum: 100 },
          offset: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { status, limit = 20, offset = 0 } = request.query as any;

      let query = supabase
        .from('scheduled_emails')
        .select('id, recipients, subject, scheduled_at, status, sent_at, retry_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: emails, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return createApiResponse(true, {
        emails: emails || [],
        pagination: {
          limit,
          offset,
          total: emails?.length || 0
        }
      });

    } catch (error) {
      console.error('List scheduled emails error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to list scheduled emails');
    }
  });

  // Get queue statistics
  fastify.get('/api/v1/queue-stats', async (request, reply) => {
    try {
      await request.jwtVerify();

      const stats = await emailScheduler.getQueueStats();
      return createApiResponse(true, stats);

    } catch (error) {
      console.error('Get queue stats error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to get queue statistics');
    }
  });

  // Test email endpoint
  fastify.post('/api/v1/test-email', {
    schema: {
      body: {
        type: 'object',
        required: ['to'],
        properties: {
          to: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await request.jwtVerify();
      const { to } = request.body as { to: string };

      // Import EmailService here to avoid circular dependency
      const { EmailService } = await import('../services/email-service');
      const emailService = new EmailService();

      const success = await emailService.sendTestEmail(to);

      if (success) {
        return createApiResponse(true, { message: 'Test email sent successfully' });
      } else {
        reply.status(500);
        return createApiResponse(false, null, 'Failed to send test email');
      }

    } catch (error) {
      console.error('Test email error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to send test email');
    }
  });

  // Get email logs for audit trail
  fastify.get('/api/v1/email-logs/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { id } = request.params as { id: string };

      // Check if email belongs to user
      const { data: emailData, error: emailError } = await supabase
        .from('scheduled_emails')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (emailError || !emailData) {
        reply.status(404);
        return createApiResponse(false, null, 'Email not found');
      }

      // Get logs
      const { data: logs, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('email_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return createApiResponse(true, { logs: logs || [] });

    } catch (error) {
      console.error('Get email logs error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to get email logs');
    }
  });

  // Cleanup old jobs endpoint (admin only)
  fastify.post('/api/v1/cleanup-jobs', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { role } = request.user as any;

      if (role !== 'admin') {
        reply.status(403);
        return createApiResponse(false, null, 'Admin access required');
      }

      await emailScheduler.cleanupOldJobs();
      return createApiResponse(true, { message: 'Cleanup completed successfully' });

    } catch (error) {
      console.error('Cleanup jobs error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to cleanup jobs');
    }
  });
}
