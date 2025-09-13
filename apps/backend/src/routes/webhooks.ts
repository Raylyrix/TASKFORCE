import { FastifyInstance } from 'fastify';
import { IngestionService } from '../services/ingestion';
import { createApiResponse } from '@taskforce/shared';

export async function webhookRoutes(fastify: FastifyInstance) {
  const ingestionService = new IngestionService(fastify.prisma);

  // Gmail webhook handler
  fastify.post('/webhooks/gmail', async (request, reply) => {
    try {
      const payload = request.body as any;
      
      // Verify webhook authenticity (in production, verify signature)
      console.log('📧 Gmail webhook received:', payload);

      // Process the webhook
      await ingestionService.handleWebhook('gmail', payload);

      reply.status(200);
      return createApiResponse(true, { processed: true });
    } catch (error) {
      fastify.log.error('Gmail webhook error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Webhook processing failed');
    }
  });

  // Microsoft Graph webhook handler
  fastify.post('/webhooks/outlook', async (request, reply) => {
    try {
      const payload = request.body as any;
      
      // Verify webhook authenticity (in production, verify signature)
      console.log('📧 Outlook webhook received:', payload);

      // Process the webhook
      await ingestionService.handleWebhook('outlook', payload);

      reply.status(200);
      return createApiResponse(true, { processed: true });
    } catch (error) {
      fastify.log.error('Outlook webhook error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Webhook processing failed');
    }
  });

  // Webhook validation endpoints (required by providers)
  fastify.get('/webhooks/gmail', async (request, reply) => {
    const { 'hub.challenge': challenge } = request.query as any;
    
    if (challenge) {
      reply.type('text/plain');
      return challenge;
    }
    
    reply.status(400);
    return createApiResponse(false, null, 'Missing challenge parameter');
  });

  fastify.get('/webhooks/outlook', async (request, reply) => {
    const { validationToken } = request.query as any;
    
    if (validationToken) {
      reply.type('text/plain');
      return validationToken;
    }
    
    reply.status(400);
    return createApiResponse(false, null, 'Missing validation token');
  });

  // Manual sync endpoint for testing
  fastify.post('/webhooks/sync/:mailboxId', async (request, reply) => {
    try {
      const { mailboxId } = request.params as { mailboxId: string };
      const { isInitial } = request.body as { isInitial?: boolean };

      await ingestionService.syncMailbox(mailboxId, isInitial || false);

      reply.status(200);
      return createApiResponse(true, { synced: true, mailboxId });
    } catch (error) {
      fastify.log.error('Manual sync error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Sync failed');
    }
  });

  // Calculate response times endpoint
  fastify.post('/webhooks/calculate-response-times/:mailboxId', async (request, reply) => {
    try {
      const { mailboxId } = request.params as { mailboxId: string };

      await ingestionService.calculateResponseTimes(mailboxId);

      reply.status(200);
      return createApiResponse(true, { calculated: true, mailboxId });
    } catch (error) {
      fastify.log.error('Response time calculation error:', error);
      reply.status(500);
      return createApiResponse(false, null, 'Calculation failed');
    }
  });
}
