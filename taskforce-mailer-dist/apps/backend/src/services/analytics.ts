import { PrismaClient } from '@prisma/client';
// import { DateRange, VolumeResponse, ResponseTimeResponse, ContactResponse } from '@taskforce/shared';
// Temporary local types
type DateRange = { start: string; end: string; };
type VolumeResponse = any;
type ResponseTimeResponse = any;
type ContactResponse = any;

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getVolumeAnalytics(
    organizationId: string,
    dateRange: DateRange
  ): Promise<VolumeResponse> {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Get all mailboxes for the organization
    const mailboxes = await this.prisma.mailbox.findMany({
      where: { organizationId },
      select: { id: true, email: true }
    });

    const mailboxIds = mailboxes.map(m => m.id);

    // Get daily volume data
    const volumeData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Count sent messages (from any mailbox in the org)
      const sentCount = await this.prisma.message.count({
        where: {
          mailboxId: { in: mailboxIds },
          receivedAt: { gte: dayStart, lte: dayEnd },
          fromEmail: { in: mailboxes.map(m => m.email) }
        }
      });

      // Count received messages (to any mailbox in the org)
      const receivedCount = await this.prisma.message.count({
        where: {
          mailboxId: { in: mailboxIds },
          receivedAt: { gte: dayStart, lte: dayEnd },
          fromEmail: { notIn: mailboxes.map(m => m.email) }
        }
      });

      volumeData.push({
        date: currentDate.toISOString().split('T')[0],
        sent: sentCount,
        received: receivedCount,
        total: sentCount + receivedCount
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary
    const totalSent = volumeData.reduce((sum, day) => sum + day.sent, 0);
    const totalReceived = volumeData.reduce((sum, day) => sum + day.received, 0);
    const days = volumeData.length;
    const avgDailySent = days > 0 ? totalSent / days : 0;
    const avgDailyReceived = days > 0 ? totalReceived / days : 0;

    // Calculate growth rate (compare first half vs second half)
    const midPoint = Math.floor(volumeData.length / 2);
    const firstHalfSent = volumeData.slice(0, midPoint).reduce((sum, day) => sum + day.sent, 0);
    const secondHalfSent = volumeData.slice(midPoint).reduce((sum, day) => sum + day.sent, 0);
    const growthRate = firstHalfSent > 0 ? ((secondHalfSent - firstHalfSent) / firstHalfSent) * 100 : 0;

    return {
      data: volumeData,
      summary: {
        totalSent,
        totalReceived,
        avgDailySent: Math.round(avgDailySent * 100) / 100,
        avgDailyReceived: Math.round(avgDailyReceived * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100
      }
    };
  }

  async getResponseTimeAnalytics(
    organizationId: string,
    dateRange: DateRange
  ): Promise<ResponseTimeResponse> {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Get mailboxes for the organization
    const mailboxes = await this.prisma.mailbox.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const mailboxIds = mailboxes.map(m => m.id);

    // Get daily response time data
    const responseTimeData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Get threads with response times for this day
      const threads = await this.prisma.thread.findMany({
        where: {
          mailboxId: { in: mailboxIds },
          responseTime: { not: null },
          lastMessageAt: { gte: dayStart, lte: dayEnd }
        },
        select: { responseTime: true }
      });

      const responseTimes = threads
        .map(t => t.responseTime!)
        .filter(rt => rt > 0);

      let avgResponseTime = 0;
      let medianResponseTime = 0;
      let p90ResponseTime = 0;

      if (responseTimes.length > 0) {
        const sorted = responseTimes.sort((a, b) => a - b);
        
        avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
        medianResponseTime = sorted[Math.floor(sorted.length / 2)];
        p90ResponseTime = sorted[Math.floor(sorted.length * 0.9)];
      }

      responseTimeData.push({
        date: currentDate.toISOString().split('T')[0],
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        medianResponseTime,
        p90ResponseTime,
        responseCount: responseTimes.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate overall summary
    const allResponseTimes: number[] = [];
    for (const day of responseTimeData) {
      // Reconstruct response times for overall calculation
      const threads = await this.getThreadsForDay(organizationId, day.date);
      const dayResponseTimes = threads.map((t: any) => t.responseTime!).filter((rt: any) => rt > 0);
      allResponseTimes.push(...dayResponseTimes);
    }
    allResponseTimes.sort((a, b) => a - b);

    const overallAvg = allResponseTimes.length > 0 
      ? allResponseTimes.reduce((sum, rt) => sum + rt, 0) / allResponseTimes.length 
      : 0;
    
    const overallMedian = allResponseTimes.length > 0 
      ? allResponseTimes[Math.floor(allResponseTimes.length / 2)] 
      : 0;
    
    const overallP90 = allResponseTimes.length > 0 
      ? allResponseTimes[Math.floor(allResponseTimes.length * 0.9)] 
      : 0;

    const fastestResponse = allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0;
    const slowestResponse = allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0;

    return {
      data: responseTimeData,
      summary: {
        overallAvg: Math.round(overallAvg * 100) / 100,
        overallMedian,
        overallP90,
        fastestResponse,
        slowestResponse
      }
    };
  }

  async getContactAnalytics(
    organizationId: string,
    dateRange: DateRange
  ): Promise<ContactResponse> {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Get mailboxes for the organization
    const mailboxes = await this.prisma.mailbox.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const mailboxIds = mailboxes.map(m => m.id);

    // Get contacts with activity in the date range
    const contacts = await this.prisma.contact.findMany({
      where: {
        mailboxId: { in: mailboxIds },
        lastContactAt: { gte: startDate, lte: endDate }
      },
      orderBy: { contactCount: 'desc' },
      take: 50 // Top 50 contacts
    });

    // Calculate health scores and response rates
    const contactData = await Promise.all(
      contacts.map(async (contact) => {
        // Get recent messages with this contact
        const recentMessages = await this.prisma.message.findMany({
          where: {
            mailboxId: contact.mailboxId,
            OR: [
              { fromEmail: contact.email },
              { toEmails: { has: contact.email } },
              { ccEmails: { has: contact.email } }
            ],
            receivedAt: { gte: startDate, lte: endDate }
          },
          orderBy: { receivedAt: 'desc' },
          take: 10
        });

        // Calculate response rate (simplified heuristic)
        let responseRate = 0;
        if (recentMessages.length > 1) {
          const responses = recentMessages.filter((msg, index) => {
            if (index === 0) return false;
            const prevMsg = recentMessages[index - 1];
            return msg.fromEmail !== prevMsg.fromEmail;
          }).length;
          responseRate = responses / (recentMessages.length - 1);
        }

        // Calculate average response time
        const avgResponseTime = contact.avgResponseTime || 0;

        // Calculate health score
        const healthScore = this.calculateHealthScore(
          responseRate,
          avgResponseTime,
          contact.contactCount
        );

        return {
          id: contact.id,
          email: contact.email,
          name: contact.name,
          domain: contact.domain,
          messageCount: contact.contactCount,
          responseRate: Math.round(responseRate * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime),
          lastContact: contact.lastContactAt?.toISOString() || '',
          healthScore
        };
      })
    );

    // Sort by health score
    contactData.sort((a, b) => b.healthScore - a.healthScore);

    // Calculate summary
    const totalContacts = contactData.length;
    const activeContacts = contactData.filter(c => c.responseRate > 0).length;
    const avgResponseRate = contactData.length > 0 
      ? contactData.reduce((sum, c) => sum + c.responseRate, 0) / contactData.length 
      : 0;

    // Get top domains
    const domainCounts = new Map<string, number>();
    contactData.forEach(contact => {
      if (contact.domain) {
        domainCounts.set(contact.domain, (domainCounts.get(contact.domain) || 0) + 1);
      }
    });

    const topDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    return {
      data: contactData,
      summary: {
        totalContacts,
        activeContacts,
        avgResponseRate: Math.round(avgResponseRate * 100) / 100,
        topDomains
      }
    };
  }

  async getOverviewAnalytics(organizationId: string): Promise<any> {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get mailboxes
    const mailboxes = await this.prisma.mailbox.findMany({
      where: { organizationId },
      select: { id: true, email: true }
    });

    const mailboxIds = mailboxes.map(m => m.id);

    // Get volume metrics for last 7 days
    const totalSent = await this.prisma.message.count({
      where: {
        mailboxId: { in: mailboxIds },
        receivedAt: { gte: last7Days },
        fromEmail: { in: mailboxes.map(m => m.email) }
      }
    });

    const totalReceived = await this.prisma.message.count({
      where: {
        mailboxId: { in: mailboxIds },
        receivedAt: { gte: last7Days },
        fromEmail: { notIn: mailboxes.map(m => m.email) }
      }
    });

    // Get response time metrics
    const threadsWithResponseTime = await this.prisma.thread.findMany({
      where: {
        mailboxId: { in: mailboxIds },
        responseTime: { not: null },
        lastMessageAt: { gte: last7Days }
      },
      select: { responseTime: true }
    });

    const responseTimes = threadsWithResponseTime
      .map(t => t.responseTime!)
      .filter(rt => rt > 0);

    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
      : 0;

    // Get active contacts
    const activeContacts = await this.prisma.contact.count({
      where: {
        mailboxId: { in: mailboxIds },
        lastContactAt: { gte: last7Days }
      }
    });

    // Get top contact
    const topContact = await this.prisma.contact.findFirst({
      where: {
        mailboxId: { in: mailboxIds },
        lastContactAt: { gte: last7Days }
      },
      orderBy: { contactCount: 'desc' },
      select: {
        email: true,
        name: true,
        contactCount: true
      }
    });

    // Get volume trend for last 7 days
    const volumeTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const sent = await this.prisma.message.count({
        where: {
          mailboxId: { in: mailboxIds },
          receivedAt: { gte: dayStart, lte: dayEnd },
          fromEmail: { in: mailboxes.map(m => m.email) }
        }
      });

      const received = await this.prisma.message.count({
        where: {
          mailboxId: { in: mailboxIds },
          receivedAt: { gte: dayStart, lte: dayEnd },
          fromEmail: { notIn: mailboxes.map(m => m.email) }
        }
      });

      volumeTrend.push({
        date: date.toISOString().split('T')[0],
        sent,
        received
      });
    }

    // Get response time distribution
    const responseTimeDistribution = [
      { range: '0-1h', count: responseTimes.filter(rt => rt <= 60).length },
      { range: '1-4h', count: responseTimes.filter(rt => rt > 60 && rt <= 240).length },
      { range: '4-8h', count: responseTimes.filter(rt => rt > 240 && rt <= 480).length },
      { range: '8-24h', count: responseTimes.filter(rt => rt > 480 && rt <= 1440).length },
      { range: '>24h', count: responseTimes.filter(rt => rt > 1440).length }
    ];

    return {
      totalSent,
      totalReceived,
      avgResponseTime,
      activeContacts,
      topContact: topContact ? {
        email: topContact.email,
        name: topContact.name,
        messageCount: topContact.contactCount
      } : null,
      volumeTrend,
      responseTimeDistribution
    };
  }

  private calculateHealthScore(responseRate: number, avgResponseTime: number, messageCount: number): number {
    // Normalize response rate (0-100)
    const rateScore = Math.min(responseRate * 100, 100);
    
    // Normalize response time (faster = higher score, max 24 hours = 0 score)
    const timeScore = Math.max(0, 100 - (avgResponseTime / (24 * 60)) * 100);
    
    // Message count factor (more messages = higher engagement)
    const countScore = Math.min(messageCount * 2, 100);
    
    // Weighted average
    return Math.round((rateScore * 0.4 + timeScore * 0.3 + countScore * 0.3));
  }

  private async getThreadsForDay(organizationId: string, date: string): Promise<any[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const mailboxes = await this.prisma.mailbox.findMany({
      where: { organizationId },
      select: { id: true }
    });

    const mailboxIds = mailboxes.map(m => m.id);

    return await this.prisma.thread.findMany({
      where: {
        mailboxId: { in: mailboxIds },
        responseTime: { not: null },
        lastMessageAt: { gte: dayStart, lte: dayEnd }
      },
      select: { responseTime: true }
    });
  }
}
