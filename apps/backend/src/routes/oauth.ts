import { FastifyInstance } from 'fastify';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
// import { createApiResponse } from '@taskforce/shared';
// Temporary local implementation
function createApiResponse(success: boolean, data: any = null, error: string | null = null) {
  return { success, data, error };
}

export async function oauthRoutes(fastify: FastifyInstance) {
  const prisma = (fastify as any).prisma as PrismaClient;

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || 'http://localhost:4000/auth/google/callback'
  );

  // Gmail OAuth initiation
  fastify.get('/auth/google', async (request, reply) => {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: 'taskforce-analytics'
      });

      // Redirect to Google OAuth
      reply.redirect(authUrl);
    } catch (error) {
      console.error('OAuth initiation error:', error as any);
      reply.status(500).send(createApiResponse(false, null, 'OAuth initiation failed'));
    }
  });

  // Gmail OAuth callback
  fastify.get('/auth/google/callback', async (request, reply) => {
    try {
      const { code, state } = request.query as { code?: string; state?: string };

      if (!code) {
        reply.status(400).send(createApiResponse(false, null, 'Authorization code not provided'));
        return;
      }

      if (state !== 'taskforce-analytics') {
        reply.status(400).send(createApiResponse(false, null, 'Invalid state parameter'));
        return;
      }

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info using People API
      const people = google.people({ version: 'v1', auth: oauth2Client });
      const userInfo = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses'
      });

      // Extract email and name from People API response
      const emailAddresses = userInfo.data.emailAddresses?.[0]?.value;
      const names = userInfo.data.names?.[0];
      
      if (!emailAddresses) {
        reply.status(400).send(createApiResponse(false, null, 'Could not retrieve user email'));
        return;
      }

      // Get or create organization (demo organization for now)
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
              internalDomains: ['taskforce-demo.com', 'company.com']
            }
          }
        });
      }

      // Get or create user
      let user = await prisma.user.findUnique({
        where: { email: emailAddresses }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: emailAddresses,
            name: names?.displayName || names?.givenName || emailAddresses,
            role: 'ADMIN',
            organizationId: organization.id,
            preferences: {
              theme: 'dark',
              notifications: true,
              defaultDateRange: '7d'
            }
          }
        });
      }

      // Get or create mailbox
      let mailbox = await prisma.mailbox.findUnique({
        where: {
          email_organizationId: {
            email: emailAddresses,
            organizationId: organization.id
          }
        }
      });

      if (!mailbox) {
        mailbox = await prisma.mailbox.create({
          data: {
            email: emailAddresses,
            provider: 'GMAIL',
            providerId: names?.metadata?.source?.id || 'gmail_' + Date.now(),
            displayName: names?.displayName || emailAddresses,
            // organizationId: organization.id, // Commented out due to Prisma schema
            settings: {
              token: tokens as any,
              syncInterval: 15, // minutes
              maxMessages: 10000,
              labels: ['INBOX', 'SENT', 'IMPORTANT']
            } as any
          } as any
        });
      } else {
        // Update existing mailbox with new tokens
        await prisma.mailbox.update({
          where: { id: mailbox.id },
          data: {
            settings: {
              ...mailbox.settings as any,
              token: tokens
            },
            lastSyncAt: new Date()
          }
        });
      }

      // Generate JWT token for the user
      const jwtToken = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        mailboxId: mailbox.id
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&success=true`);

    } catch (error) {
      console.error('OAuth callback error:', error as any);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      reply.redirect(`${frontendUrl}/auth/callback?success=false&error=${encodeURIComponent(errorMessage)}`);
    }
  });

  // Google Calendar freebusy
  fastify.post('/api/v1/google/freebusy', async (request, reply) => {
    try {
      const { accessToken, timeMin, timeMax, calendars } = request.body as {
        accessToken: string; timeMin: string; timeMax: string; calendars: string[];
      };
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const resp = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: calendars.map(email => ({ id: email }))
        }
      });
      return createApiResponse(true, resp.data);
    } catch (error) {
      console.error('Freebusy error:', error as any);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      reply.status(500);
      return createApiResponse(false, null, errorMessage);
    }
  });

  // Google Meet link creation via Calendar event insert
  fastify.post('/api/v1/google/meet', async (request, reply) => {
    try {
      const { accessToken, summary, start, end, attendees } = request.body as {
        accessToken: string;
        summary: string;
        start: { dateTime: string; timeZone?: string };
        end: { dateTime: string; timeZone?: string };
        attendees?: { email: string }[];
      };
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const resp = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary,
          start,
          end,
          attendees,
          conferenceData: {
            createRequest: {
              requestId: `req-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          }
        },
        conferenceDataVersion: 1
      });
      return createApiResponse(true, resp.data);
    } catch (error) {
      console.error('Meet create error:', error as any);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      reply.status(500);
      return createApiResponse(false, null, errorMessage);
    }
  });

  // Check authentication status
  fastify.get('/auth/status', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: true,
          teamMemberships: {
            include: { team: true }
          }
        }
      });

      if (!user) {
        reply.status(401).send(createApiResponse(false, null, 'User not found'));
        return;
      }

      return createApiResponse(true, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
          teams: user.teamMemberships.map(m => m.team)
        }
      });
    } catch (error) {
      reply.status(401).send(createApiResponse(false, null, 'Not authenticated'));
    }
  });

  // Logout
  fastify.post('/auth/logout', async (request, reply) => {
    try {
      // In a real implementation, you might want to revoke the Google token
      reply.send(createApiResponse(true, { message: 'Logged out successfully' }));
    } catch (error) {
      console.error('Logout error:', error as any);
      reply.status(500).send(createApiResponse(false, null, 'Logout failed'));
    }
  });

  // Test Gmail connection
  fastify.get('/auth/test-gmail', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { mailboxId } = request.user as any;

      const mailbox = await prisma.mailbox.findUnique({
        where: { id: mailboxId }
      });

      if (!mailbox || !(mailbox.settings as any)?.token) {
        reply.status(400).send(createApiResponse(false, null, 'No Gmail connection found'));
        return;
      }

      // Test Gmail API connection
      oauth2Client.setCredentials((mailbox.settings as any).token as any);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      return createApiResponse(true, {
        connected: true,
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal,
        threadsTotal: profile.data.threadsTotal
      });
    } catch (error) {
      console.error('Gmail test error:', error as any);
      reply.status(500).send(createApiResponse(false, null, 'Gmail connection test failed'));
    }
  });
}
