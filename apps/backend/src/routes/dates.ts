import { FastifyInstance } from 'fastify';

import { google } from 'googleapis';
import { getPrismaClient, type PrismaClient, type Mailbox, type Message, type Contact, type Thread, type User, type Organization, type Analytics, type Report } from '../lib/prisma';


// Simple API response helper
function createApiResponse(success: boolean, data: any = null, error: string | null = null) {
  return { success, data, error, timestamp: new Date().toISOString() };
}

// Google OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:4000/auth/google/callback'
);

export async function datesRoutes(fastify: FastifyInstance) {
  const prisma = getPrismaClient();

  // ===== EVENT TYPES =====

  // Create event type
  fastify.post('/api/v1/dates/event-types', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      
      const {
        title,
        description,
        durationMin,
        type = 'ONE_ON_ONE',
        bufferBefore = 0,
        bufferAfter = 0,
        isActive = true,
        requiresConfirmation = false,
        maxBookings,
        price,
        currency = 'USD',
        settings = {}
      } = request.body as {
        title: string;
        description?: string;
        durationMin: number;
        type?: 'ONE_ON_ONE' | 'GROUP' | 'ROUND_ROBIN' | 'COLLECTIVE';
        bufferBefore?: number;
        bufferAfter?: number;
        isActive?: boolean;
        requiresConfirmation?: boolean;
        maxBookings?: number;
        price?: number;
        currency?: string;
        settings?: any;
      };

      const eventType = await prisma.eventType.create({
        data: {
          title,
          description,
          durationMin,
          type: type as any,
          bufferBefore,
          bufferAfter,
          isActive,
          requiresConfirmation,
          maxBookings,
          price,
          currency,
          settings,
          ownerId: userId,
        },
        include: {
          availability: true,
          questions: true,
        },
      });

      return createApiResponse(true, eventType);
    } catch (error) {
      console.error('Event type creation error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to create event type');
    }
  });

  // Get event types for user
  fastify.get('/api/v1/dates/event-types', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      
      const eventTypes = await prisma.eventType.findMany({
        where: { ownerId: userId },
        include: {
          availability: true,
          questions: true,
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return createApiResponse(true, eventTypes);
    } catch (error) {
      console.error('Event types fetch error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch event types');
    }
  });

  // Get specific event type (public)
  fastify.get('/api/v1/dates/event-types/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const eventType = await prisma.eventType.findUnique({
        where: { id },
        include: {
          availability: true,
          questions: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!eventType) {
        reply.status(404);
        return createApiResponse(false, null, 'Event type not found');
      }

      return createApiResponse(true, eventType);
    } catch (error) {
      console.error('Event type fetch error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch event type');
    }
  });

  // Update event type
  fastify.put('/api/v1/dates/event-types/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { id } = request.params as { id: string };
      
      const updateData = request.body as any;

      // Verify ownership
      const existingEventType = await prisma.eventType.findUnique({
        where: { id }
      });

      if (!existingEventType || existingEventType.ownerId !== userId) {
        reply.status(403);
        return createApiResponse(false, null, 'Not authorized to update this event type');
      }

      const eventType = await prisma.eventType.update({
        where: { id },
        data: updateData,
        include: {
          availability: true,
          questions: true,
        }
      });

      return createApiResponse(true, eventType);
    } catch (error) {
      console.error('Event type update error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to update event type');
    }
  });

  // Delete event type
  fastify.delete('/api/v1/dates/event-types/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { id } = request.params as { id: string };

      // Verify ownership
      const existingEventType = await prisma.eventType.findUnique({
        where: { id }
      });

      if (!existingEventType || existingEventType.ownerId !== userId) {
        reply.status(403);
        return createApiResponse(false, null, 'Not authorized to delete this event type');
      }

      await prisma.eventType.delete({
        where: { id }
      });

      return createApiResponse(true, { deleted: true });
    } catch (error) {
      console.error('Event type deletion error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to delete event type');
    }
  });

  // ===== AVAILABILITY =====

  // Set availability for event type
  fastify.post('/api/v1/dates/event-types/:eventTypeId/availability', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { eventTypeId } = request.params as { eventTypeId: string };
      
      const { availability } = request.body as {
        availability: Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          isAvailable: boolean;
          timeZone: string;
        }>;
      };

      // Verify ownership
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId }
      });

      if (!eventType || eventType.ownerId !== userId) {
        reply.status(403);
        return createApiResponse(false, null, 'Not authorized to modify this event type');
      }

      // Delete existing availability
      await prisma.availability.deleteMany({
        where: { eventTypeId }
      });

      // Create new availability
      const newAvailability = await prisma.availability.createMany({
        data: availability.map(slot => ({
          ...slot,
          eventTypeId
        }))
      });

      return createApiResponse(true, { created: newAvailability.count });
    } catch (error) {
      console.error('Availability update error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to update availability');
    }
  });

  // Get availability for event type
  fastify.get('/api/v1/dates/event-types/:eventTypeId/availability', async (request, reply) => {
    try {
      const { eventTypeId } = request.params as { eventTypeId: string };
      
      const availability = await prisma.availability.findMany({
        where: { eventTypeId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });

      return createApiResponse(true, availability);
    } catch (error) {
      console.error('Availability fetch error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch availability');
    }
  });

  // ===== BOOKINGS =====

  // Create booking
  fastify.post('/api/v1/dates/bookings', async (request, reply) => {
    try {
      const {
        eventTypeId,
        attendeeEmail,
        attendeeName,
        startTime,
        endTime,
        timeZone = 'UTC',
        location,
        notes,
        responses = []
      } = request.body as {
        eventTypeId: string;
        attendeeEmail: string;
        attendeeName?: string;
        startTime: string;
        endTime: string;
        timeZone?: string;
        location?: string;
        notes?: string;
        responses?: Array<{ questionId: string; answer: string }>;
      };

      // Verify event type exists and is active
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId },
        include: { questions: true }
      });

      if (!eventType || !eventType.isActive) {
        reply.status(400);
        return createApiResponse(false, null, 'Event type not found or inactive');
      }

      // Generate confirmation code
      const confirmationCode = Math.random().toString(36).substring(2, 15);

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          eventTypeId,
          attendeeEmail,
          attendeeName,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          timeZone,
          location,
          notes,
          confirmationCode,
          status: eventType.requiresConfirmation ? 'PENDING' : 'CONFIRMED',
          responses: {
            create: responses.map(response => ({
              questionId: response.questionId,
              answer: response.answer
            }))
          }
        },
        include: {
          eventType: true,
          responses: {
            include: {
              question: true
            }
          }
        }
      });

      return createApiResponse(true, booking);
    } catch (error) {
      console.error('Booking creation error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to create booking');
    }
  });

  // Get bookings for user (as organizer)
  fastify.get('/api/v1/dates/bookings/organizer', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { status, limit = '50', offset = '0' } = request.query as {
        status?: string;
        limit?: string;
        offset?: string;
      };

      const whereClause: any = {
        eventType: {
          ownerId: userId
        }
      };

      if (status) {
        whereClause.status = status;
      }

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          eventType: {
            select: {
              id: true,
              title: true,
              durationMin: true
            }
          },
          responses: {
            include: {
              question: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10)
      });

      return createApiResponse(true, bookings);
    } catch (error) {
      console.error('Bookings fetch error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch bookings');
    }
  });

  // Get bookings for user (as attendee)
  fastify.get('/api/v1/dates/bookings/attendee', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { status, limit = '50', offset = '0' } = request.query as {
        status?: string;
        limit?: string;
        offset?: string;
      };

      const whereClause: any = {
        attendeeId: userId
      };

      if (status) {
        whereClause.status = status;
      }

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: {
          eventType: {
            select: {
              id: true,
              title: true,
              durationMin: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10)
      });

      return createApiResponse(true, bookings);
    } catch (error) {
      console.error('Bookings fetch error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch bookings');
    }
  });

  // Update booking status (confirm, cancel, etc.)
  fastify.patch('/api/v1/dates/bookings/:id/status', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { id } = request.params as { id: string };
      const { status, cancellationReason } = request.body as {
        status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
        cancellationReason?: string;
      };

      // Verify user can modify this booking
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { eventType: true }
      });

      if (!booking) {
        reply.status(404);
        return createApiResponse(false, null, 'Booking not found');
      }

      const canModify = booking.eventType.ownerId === userId || booking.attendeeId === userId;
      if (!canModify) {
        reply.status(403);
        return createApiResponse(false, null, 'Not authorized to modify this booking');
      }

      const updateData: any = { status };
      if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = userId;
        updateData.cancellationReason = cancellationReason;
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          eventType: true,
          responses: {
            include: {
              question: true
            }
          }
        }
      });

      return createApiResponse(true, updatedBooking);
    } catch (error) {
      console.error('Booking status update error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to update booking status');
    }
  });

  // ===== GOOGLE CALENDAR INTEGRATION =====

  // Get Google Calendar free/busy
  fastify.post('/api/v1/dates/google/freebusy', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const { timeMin, timeMax, calendarIds } = request.body as {
        timeMin: string;
        timeMax: string;
        calendarIds: string[];
      };

      // Get user's mailbox with Google token
      const mailbox = await prisma.mailbox.findFirst({
        where: {
          organizationId: userId, // This should be organizationId, not userId
          provider: 'GMAIL'
        }
      });

      if (!mailbox || !(mailbox.settings as any)?.token) {
        reply.status(400);
        return createApiResponse(false, null, 'No Google Calendar connection found');
      }

      oauth2Client.setCredentials((mailbox.settings as any).token);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: calendarIds.map(id => ({ id }))
        }
      });

      return createApiResponse(true, response.data);
    } catch (error) {
      console.error('Free/busy error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch free/busy data');
    }
  });

  // Create Google Meet link
  fastify.post('/api/v1/dates/google/meet', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;
      const {
        summary,
        description,
        start,
        end,
        attendees,
        conferenceDataVersion = 1
      } = request.body as {
        summary: string;
        description?: string;
        start: { dateTime: string; timeZone: string };
        end: { dateTime: string; timeZone: string };
        attendees: { email: string }[];
        conferenceDataVersion?: number;
      };

      // Get user's mailbox with Google token
      const mailbox = await prisma.mailbox.findFirst({
        where: {
          organizationId: userId, // This should be organizationId, not userId
          provider: 'GMAIL'
        }
      });

      if (!mailbox || !(mailbox.settings as any)?.token) {
        reply.status(400);
        return createApiResponse(false, null, 'No Google Calendar connection found');
      }

      oauth2Client.setCredentials((mailbox.settings as any).token);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary,
        description,
        start,
        end,
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: {
          useDefault: true
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion
      });

      return createApiResponse(true, response.data);
    } catch (error) {
      console.error('Google Meet creation error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to create Google Meet link');
    }
  });

  // ===== MAILER INTEGRATION =====

  // Get availability for a user (for Mailer integration)
  fastify.get('/api/v1/dates/availability/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { date, days = '7' } = request.query as { date?: string; days?: string };
      
      const startDate = date ? new Date(date) : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + parseInt(days, 10));
      
      // Get user's event types and their availability
      const eventTypes = await prisma.eventType.findMany({
        where: { 
          ownerId: userId,
          isActive: true
        },
        include: {
          availability: true,
          bookings: {
            where: {
              startTime: {
                gte: startDate,
                lte: endDate
              },
              status: {
                in: ['CONFIRMED', 'PENDING']
              }
            }
          }
        }
      });

      // Generate available slots based on availability settings and existing bookings
      const slots = [];
      const now = new Date();
      
      for (const eventType of eventTypes) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          const dayAvailability = eventType.availability.filter(a => a.dayOfWeek === dayOfWeek);
          
          for (const avail of dayAvailability) {
            if (avail.isAvailable) {
              const [startHour, startMin] = avail.startTime.split(':').map(Number);
              const [endHour, endMin] = avail.endTime.split(':').map(Number);
              
              for (let hour = startHour; hour < endHour; hour++) {
                for (let min = 0; min < 60; min += eventType.durationMin) {
                  const slotTime = new Date(d);
                  slotTime.setHours(hour, min, 0, 0);
                  
                  if (slotTime >= now) {
                    const slotEnd = new Date(slotTime.getTime() + eventType.durationMin * 60000);
                    
                    // Check if slot conflicts with existing bookings
                    const hasConflict = eventType.bookings.some(booking => {
                      const bookingStart = new Date(booking.startTime);
                      const bookingEnd = new Date(booking.endTime);
                      return (slotTime < bookingEnd && slotEnd > bookingStart);
                    });
                    
                    if (!hasConflict) {
                      slots.push({
                        eventTypeId: eventType.id,
                        eventTypeTitle: eventType.title,
                        duration: eventType.durationMin,
                        start: slotTime.toISOString(),
                        end: slotEnd.toISOString(),
                        available: true
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      return createApiResponse(true, {
        userId,
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        slots: slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Availability error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to fetch availability');
    }
  });

  // Generate booking link (for Mailer integration)
  fastify.post('/api/v1/dates/booking-link', async (request, reply) => {
    try {
      const { eventTypeId, userId } = request.body as { eventTypeId: string; userId: string };
      
      // Verify event type exists and user has access
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId }
      });

      if (!eventType) {
        reply.status(404);
        return createApiResponse(false, null, 'Event type not found');
      }

      if (eventType.ownerId !== userId) {
        reply.status(403);
        return createApiResponse(false, null, 'Not authorized to generate booking link');
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const bookingLink = `${baseUrl}/book/${eventTypeId}`;
      
      return createApiResponse(true, {
        link: bookingLink,
        eventTypeId,
        eventTypeTitle: eventType.title,
        userId,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Booking link error:', error as any);
      reply.status(500);
      return createApiResponse(false, null, 'Failed to generate booking link');
    }
  });
}
