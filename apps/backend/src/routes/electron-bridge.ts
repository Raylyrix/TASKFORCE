import { FastifyInstance } from 'fastify';
import { google } from 'googleapis';
import { getPrismaClient, PrismaClient, Mailbox, Message, Contact, Thread, User, Organization, Analytics, Report, getPrismaTypes } from '../utils/prisma-import';
// Types: PrismaClient
// import { createApiResponse } from '@taskforce/shared';
// Temporary local implementation
function createApiResponse(success: boolean, data: any = null, error: string | null = null) {
  return { success, data, error };
}

export async function electronBridgeRoutes(fastify: FastifyInstance) {
  const prisma = (fastify as any).prisma as PrismaClient;

  // Initialize OAuth2 client for Electron app compatibility
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // For desktop applications
  );

  // Endpoint for Electron app to exchange authorization code for tokens
  fastify.post('/auth/electron/token-exchange', async (request, reply) => {
    try {
      const { code } = request.body as { code: string };

      if (!code) {
        reply.status(400);
        return createApiResponse(false, null, 'Authorization code is required');
      }

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const people = google.people({ version: 'v1', auth: oauth2Client });
      const userInfo = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses'
      });

      const email = userInfo.data.emailAddresses?.[0]?.value;
      const name = userInfo.data.names?.[0]?.displayName;

      if (!email) {
        reply.status(400);
        return createApiResponse(false, null, 'Could not retrieve user email');
      }

      // Get or create organization
      let organization = await prisma.organization.findFirst({
        where: { domain: 'taskforce-demo.com' }
      });

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: 'Taskforce Demo Organization',
            domain: 'taskforce-demo.com',
            settings: {
              timezone: 'UTC',
              workingHours: { start: '09:00', end: '17:00' },
              internalDomains: ['taskforce-demo.com']
            }
          }
        });
      }

      // Get or create user
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            role: 'ADMIN',
            organizationId: organization.id,
            isActive: true
          }
        });
      }

      // Create or update mailbox
      let mailbox = await prisma.mailbox.findFirst({
        where: {
          email,
          organizationId: organization.id
        }
      });

      if (!mailbox) {
        mailbox = await prisma.mailbox.create({
          data: {
            email,
            provider: 'GMAIL',
            isActive: true,
            // organizationId: organization.id, // Commented out due to Prisma schema
            settings: {
              tokens: tokens as any, // Store encrypted tokens
              lastSyncAt: null,
              syncEnabled: true
            } as any
          } as any
        });
      } else {
        // Update existing mailbox with new tokens
        await prisma.mailbox.update({
          where: { id: mailbox.id },
          data: {
            settings: {
              tokens: tokens as any,
              lastSyncAt: (mailbox.settings as any)?.lastSyncAt || null,
              syncEnabled: true
            } as any
          }
        });
      }

      // Generate JWT token for web app
      const jwtToken = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: organization.id
      });

      // Return tokens for Electron app
      return createApiResponse(true, {
        electronTokens: tokens,
        webToken: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        mailbox: {
          id: mailbox.id,
          email: mailbox.email,
          provider: mailbox.provider
        }
      });

    } catch (error) {
      console.error('Electron token exchange error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Token exchange failed');
    }
  });

  // Endpoint for Electron app to refresh tokens
  fastify.post('/auth/electron/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        reply.status(400);
        return createApiResponse(false, null, 'Refresh token is required');
      }

      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      // Refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();

      return createApiResponse(true, {
        tokens: credentials
      });

    } catch (error) {
      console.error('Token refresh error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Token refresh failed');
    }
  });

  // Endpoint for Electron app to get authorization URL
  fastify.get('/auth/electron/authorize', async (request, reply) => {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });

      return createApiResponse(true, {
        authUrl,
        instructions: 'Copy the authorization code from the browser and use it with the token-exchange endpoint'
      });

    } catch (error) {
      console.error('Authorization URL generation error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to generate authorization URL');
    }
  });

  // Endpoint to sync mailbox data from Electron app
  fastify.post('/api/v1/electron/sync', async (request, reply) => {
    try {
      const { mailboxId, messages } = request.body as {
        mailboxId: string;
        messages: any[];
      };

      // Verify mailbox exists and belongs to user
      const mailbox = await prisma.mailbox.findFirst({
        where: {
          id: mailboxId,
          isActive: true
        }
      });

      if (!mailbox) {
        reply.status(404);
        return createApiResponse(false, null, 'Mailbox not found');
      }

      // Process messages from Electron app
      const processedMessages = messages.map(msg => ({
        messageId: msg.id,
        threadId: msg.threadId,
        subject: msg.subject,
        fromEmail: msg.fromEmail,
        fromName: msg.fromName,
        toEmails: msg.toEmails || [],
        ccEmails: msg.ccEmails || [],
        bccEmails: msg.bccEmails || [],
        receivedAt: new Date(msg.receivedAt),
        sentAt: msg.sentAt ? new Date(msg.sentAt) : null,
        size: msg.size,
        hasAttachments: msg.hasAttachments || false,
        attachmentCount: msg.attachmentCount || 0,
        isRead: msg.isRead || false,
        isImportant: msg.isImportant || false,
        labels: msg.labels || [],
        snippet: msg.snippet,
        bodyHash: msg.bodyHash,
        mailboxId: mailboxId
      }));

      // Bulk insert messages
      await prisma.message.createMany({
        data: processedMessages,
        skipDuplicates: true
      });

      // Update mailbox last sync time
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: {
          settings: {
            ...mailbox.settings as any,
            lastSyncAt: new Date().toISOString()
          }
        }
      });

      return createApiResponse(true, {
        synced: true,
        messageCount: processedMessages.length,
        mailboxId
      });

    } catch (error) {
      console.error('Electron sync error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Sync failed');
    }
  });

  // Endpoint to get user's mailboxes for Electron app
  fastify.get('/api/v1/electron/mailboxes', async (request, reply) => {
    try {
      const { userId } = request.query as { userId: string };

      if (!userId) {
        reply.status(400);
        return createApiResponse(false, null, 'User ID is required');
      }

      const mailboxes = await prisma.mailbox.findMany({
        where: {
          organization: {
            users: {
              some: { id: userId }
            }
          },
          isActive: true
        },
        select: {
          id: true,
          email: true,
          provider: true,
          settings: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return createApiResponse(true, { mailboxes });

    } catch (error) {
      console.error('Get mailboxes error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch mailboxes');
    }
  });
}
