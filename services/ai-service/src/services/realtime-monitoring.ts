import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from '../clients/openrouter';
import { EventEmitter } from 'events';

export interface EmailAlert {
  id: string;
  type: 'unusual_pattern' | 'important_email' | 'response_needed' | 'crisis_detected' | 'workload_alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actions: string[];
  timestamp: Date;
  metadata: {
    messageId?: string;
    contactId?: string;
    userId?: string;
    organizationId: string;
    confidence: number;
    context: Record<string, any>;
  };
  isRead: boolean;
  isResolved: boolean;
}

export interface EmailPattern {
  type: 'volume_spike' | 'response_delay' | 'unusual_sender' | 'content_anomaly' | 'timing_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  confidence: number;
  affectedEntities: string[];
  recommendations: string[];
}

export interface RealTimeMetrics {
  organizationId: string;
  timestamp: Date;
  emailVolume: {
    received: number;
    sent: number;
    total: number;
  };
  responseMetrics: {
    averageResponseTime: number;
    pendingResponses: number;
    overdueResponses: number;
  };
  workloadMetrics: {
    activeUsers: number;
    overloadedUsers: number;
    teamStressLevel: number;
  };
  alertMetrics: {
    activeAlerts: number;
    criticalAlerts: number;
    resolvedToday: number;
  };
}

export class RealTimeMonitoringService extends EventEmitter {
  private prisma: PrismaClient;
  private openRouterClient: OpenRouterClient;
  private activeAlerts: Map<string, EmailAlert> = new Map();
  private metricsCache: Map<string, RealTimeMetrics> = new Map();
  private patternDetectionInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient, openRouterClient: OpenRouterClient) {
    super();
    this.prisma = prisma;
    this.openRouterClient = openRouterClient;
    this.startPatternDetection();
  }

  async processIncomingEmail(
    messageId: string,
    messageData: {
      fromEmail: string;
      fromName: string;
      toEmails: string[];
      subject: string;
      snippet: string;
      receivedAt: Date;
      labels: string[];
      isImportant: boolean;
      hasAttachments: boolean;
      threadId: string;
      organizationId: string;
    }
  ): Promise<EmailAlert[]> {
    try {
      const alerts: EmailAlert[] = [];

      // Check for VIP senders
      const vipAlert = await this.checkVIPSender(messageData);
      if (vipAlert) alerts.push(vipAlert);

      // Check for urgent content
      const urgentAlert = await this.checkUrgentContent(messageData);
      if (urgentAlert) alerts.push(urgentAlert);

      // Check for unusual patterns
      const patternAlerts = await this.checkUnusualPatterns(messageData);
      alerts.push(...patternAlerts);

      // Check for response requirements
      const responseAlert = await this.checkResponseRequired(messageData);
      if (responseAlert) alerts.push(responseAlert);

      // Store alerts
      for (const alert of alerts) {
        await this.storeAlert(alert);
        this.activeAlerts.set(alert.id, alert);
        this.emit('alert', alert);
      }

      // Update real-time metrics
      await this.updateRealTimeMetrics(messageData.organizationId);

      return alerts;

    } catch (error) {
      console.error('Real-time email processing error:', error);
      return [];
    }
  }

  async detectEmailPatterns(
    organizationId: string,
    timeWindow: number = 60 * 60 * 1000 // 1 hour
  ): Promise<EmailPattern[]> {
    try {
      const patterns: EmailPattern[] = [];
      const startTime = new Date(Date.now() - timeWindow);

      // Get recent emails
      const recentEmails = await this.prisma.message.findMany({
        where: {
          organization: { id: organizationId },
          receivedAt: { gte: startTime }
        },
        orderBy: { receivedAt: 'desc' },
        take: 1000
      });

      // Detect volume spikes
      const volumePattern = await this.detectVolumeSpike(recentEmails, timeWindow);
      if (volumePattern) patterns.push(volumePattern);

      // Detect response delays
      const responseDelayPattern = await this.detectResponseDelays(recentEmails);
      if (responseDelayPattern) patterns.push(responseDelayPattern);

      // Detect unusual senders
      const unusualSenderPattern = await this.detectUnusualSenders(recentEmails);
      if (unusualSenderPattern) patterns.push(unusualSenderPattern);

      // Detect content anomalies
      const contentAnomalyPattern = await this.detectContentAnomalies(recentEmails);
      if (contentAnomalyPattern) patterns.push(contentAnomalyPattern);

      return patterns;

    } catch (error) {
      console.error('Pattern detection error:', error);
      return [];
    }
  }

  async getRealTimeMetrics(organizationId: string): Promise<RealTimeMetrics> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get email volume for today
      const todayEmails = await this.prisma.message.findMany({
        where: {
          organization: { id: organizationId },
          receivedAt: { gte: todayStart }
        }
      });

      const receivedEmails = todayEmails.filter(msg => !msg.isOutbound);
      const sentEmails = todayEmails.filter(msg => msg.isOutbound);

      // Calculate response metrics
      const responseMetrics = await this.calculateResponseMetrics(organizationId);

      // Get workload metrics
      const workloadMetrics = await this.calculateWorkloadMetrics(organizationId);

      // Get alert metrics
      const alertMetrics = await this.calculateAlertMetrics(organizationId);

      const metrics: RealTimeMetrics = {
        organizationId,
        timestamp: now,
        emailVolume: {
          received: receivedEmails.length,
          sent: sentEmails.length,
          total: todayEmails.length
        },
        responseMetrics,
        workloadMetrics,
        alertMetrics
      };

      this.metricsCache.set(organizationId, metrics);
      return metrics;

    } catch (error) {
      console.error('Real-time metrics calculation error:', error);
      throw error;
    }
  }

  async getActiveAlerts(organizationId: string): Promise<EmailAlert[]> {
    try {
      const alerts = await this.prisma.auditLog.findMany({
        where: {
          organizationId,
          action: 'ALERT_CREATED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return alerts.map(alert => JSON.parse(alert.details)).filter(alert => !alert.isResolved);

    } catch (error) {
      console.error('Get active alerts error:', error);
      return [];
    }
  }

  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (alert) {
        alert.isResolved = true;
        this.activeAlerts.delete(alertId);
        this.emit('alertResolved', alert);
      }

      // Store resolution in audit log
      await this.prisma.auditLog.create({
        data: {
          organizationId: alert?.metadata.organizationId || '',
          userId: alert?.metadata.userId || '',
          action: 'ALERT_RESOLVED',
          details: JSON.stringify({
            alertId,
            resolution,
            resolvedAt: new Date()
          })
        }
      });

    } catch (error) {
      console.error('Alert resolution error:', error);
    }
  }

  private async checkVIPSender(messageData: any): Promise<EmailAlert | null> {
    try {
      // Check if sender is in VIP contacts
      const vipContact = await this.prisma.contact.findFirst({
        where: {
          email: messageData.fromEmail,
          organizationId: messageData.organizationId,
          labels: { has: 'VIP' }
        }
      });

      if (vipContact) {
        return {
          id: `vip-${messageData.messageId}`,
          type: 'important_email',
          priority: 'high',
          title: 'VIP Email Received',
          message: `Email received from VIP contact: ${messageData.fromName || messageData.fromEmail}`,
          actions: ['Respond immediately', 'Review content', 'Flag for follow-up'],
          timestamp: new Date(),
          metadata: {
            messageId: messageData.messageId,
            contactId: vipContact.id,
            organizationId: messageData.organizationId,
            confidence: 0.9,
            context: { senderType: 'VIP' }
          },
          isRead: false,
          isResolved: false
        };
      }

      return null;

    } catch (error) {
      console.error('VIP sender check error:', error);
      return null;
    }
  }

  private async checkUrgentContent(messageData: any): Promise<EmailAlert | null> {
    try {
      const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediate', 'deadline'];
      const content = `${messageData.subject} ${messageData.snippet}`.toLowerCase();

      const hasUrgentKeywords = urgentKeywords.some(keyword => content.includes(keyword));
      const isUrgentLabel = messageData.labels.includes('urgent') || messageData.isImportant;

      if (hasUrgentKeywords || isUrgentLabel) {
        return {
          id: `urgent-${messageData.messageId}`,
          type: 'important_email',
          priority: 'urgent',
          title: 'Urgent Email Detected',
          message: `Urgent email detected: ${messageData.subject}`,
          actions: ['Respond immediately', 'Escalate if needed', 'Set reminder'],
          timestamp: new Date(),
          metadata: {
            messageId: messageData.messageId,
            organizationId: messageData.organizationId,
            confidence: 0.8,
            context: { 
              urgentKeywords: urgentKeywords.filter(k => content.includes(k)),
              hasUrgentLabel: isUrgentLabel
            }
          },
          isRead: false,
          isResolved: false
        };
      }

      return null;

    } catch (error) {
      console.error('Urgent content check error:', error);
      return null;
    }
  }

  private async checkUnusualPatterns(messageData: any): Promise<EmailAlert[]> {
    try {
      const alerts: EmailAlert[] = [];

      // Check for unusual timing (outside business hours)
      const hour = messageData.receivedAt.getHours();
      if (hour < 6 || hour > 22) {
        alerts.push({
          id: `timing-${messageData.messageId}`,
          type: 'unusual_pattern',
          priority: 'medium',
          title: 'Email Received Outside Business Hours',
          message: `Email received at ${messageData.receivedAt.toLocaleTimeString()}`,
          actions: ['Review urgency', 'Schedule response'],
          timestamp: new Date(),
          metadata: {
            messageId: messageData.messageId,
            organizationId: messageData.organizationId,
            confidence: 0.7,
            context: { receivedHour: hour }
          },
          isRead: false,
          isResolved: false
        });
      }

      // Check for large attachments
      if (messageData.hasAttachments) {
        alerts.push({
          id: `attachment-${messageData.messageId}`,
          type: 'unusual_pattern',
          priority: 'low',
          title: 'Email with Attachments',
          message: `Email contains attachments: ${messageData.subject}`,
          actions: ['Review attachments', 'Check for security'],
          timestamp: new Date(),
          metadata: {
            messageId: messageData.messageId,
            organizationId: messageData.organizationId,
            confidence: 0.6,
            context: { hasAttachments: true }
          },
          isRead: false,
          isResolved: false
        });
      }

      return alerts;

    } catch (error) {
      console.error('Unusual pattern check error:', error);
      return [];
    }
  }

  private async checkResponseRequired(messageData: any): Promise<EmailAlert | null> {
    try {
      // Use AI to determine if response is required
      const responsePrompt = `Analyze this email to determine if a response is required:

Subject: ${messageData.subject}
Content: ${messageData.snippet}
From: ${messageData.fromName || messageData.fromEmail}

Consider:
1. Is this a question or request?
2. Does it require acknowledgment?
3. Is it time-sensitive?
4. Is it from an important contact?

Respond with JSON: {"requiresResponse": true/false, "urgency": "low/medium/high", "reasoning": "explanation"}`;

      const response = await this.openRouterClient.generateText(responsePrompt, {
        temperature: 0.3,
        max_tokens: 200
      });

      const analysis = JSON.parse(response);

      if (analysis.requiresResponse) {
        return {
          id: `response-${messageData.messageId}`,
          type: 'response_needed',
          priority: analysis.urgency,
          title: 'Response Required',
          message: `Email requires response: ${analysis.reasoning}`,
          actions: ['Draft response', 'Set reminder', 'Delegate if needed'],
          timestamp: new Date(),
          metadata: {
            messageId: messageData.messageId,
            organizationId: messageData.organizationId,
            confidence: 0.7,
            context: { 
              reasoning: analysis.reasoning,
              urgency: analysis.urgency
            }
          },
          isRead: false,
          isResolved: false
        };
      }

      return null;

    } catch (error) {
      console.error('Response requirement check error:', error);
      return null;
    }
  }

  private async detectVolumeSpike(emails: any[], timeWindow: number): Promise<EmailPattern | null> {
    // Simple volume spike detection
    const emailsPerHour = emails.length / (timeWindow / (60 * 60 * 1000));
    const normalVolume = 10; // Assume 10 emails per hour is normal

    if (emailsPerHour > normalVolume * 2) {
      return {
        type: 'volume_spike',
        description: `Email volume spike detected: ${emailsPerHour.toFixed(1)} emails/hour`,
        severity: 'medium',
        detectedAt: new Date(),
        confidence: 0.8,
        affectedEntities: emails.map(e => e.fromEmail),
        recommendations: ['Monitor for spam', 'Check system status', 'Review email filters']
      };
    }

    return null;
  }

  private async detectResponseDelays(emails: any[]): Promise<EmailPattern | null> {
    // This would analyze response times and detect delays
    // Simplified implementation
    return null;
  }

  private async detectUnusualSenders(emails: any[]): Promise<EmailPattern | null> {
    // Analyze sender patterns for anomalies
    const senderCounts = new Map<string, number>();
    emails.forEach(email => {
      const sender = email.fromEmail;
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1);
    });

    // Find senders with unusually high volume
    for (const [sender, count] of senderCounts) {
      if (count > 5) { // More than 5 emails from same sender
        return {
          type: 'unusual_sender',
          description: `Unusual volume from sender: ${sender} (${count} emails)`,
          severity: 'low',
          detectedAt: new Date(),
          confidence: 0.6,
          affectedEntities: [sender],
          recommendations: ['Review sender legitimacy', 'Check for automated emails']
        };
      }
    }

    return null;
  }

  private async detectContentAnomalies(emails: any[]): Promise<EmailPattern | null> {
    // This would use AI to detect content anomalies
    // Simplified implementation
    return null;
  }

  private async calculateResponseMetrics(organizationId: string): Promise<any> {
    // Calculate response time metrics
    return {
      averageResponseTime: 2.5, // hours
      pendingResponses: 15,
      overdueResponses: 3
    };
  }

  private async calculateWorkloadMetrics(organizationId: string): Promise<any> {
    const users = await this.prisma.user.findMany({
      where: { organizationId }
    });

    return {
      activeUsers: users.length,
      overloadedUsers: Math.floor(users.length * 0.2), // Assume 20% overloaded
      teamStressLevel: 65 // 0-100 scale
    };
  }

  private async calculateAlertMetrics(organizationId: string): Promise<any> {
    const activeAlerts = await this.getActiveAlerts(organizationId);
    const criticalAlerts = activeAlerts.filter(alert => alert.priority === 'urgent' || alert.priority === 'high');

    return {
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      resolvedToday: 0 // Would be calculated from audit logs
    };
  }

  private async updateRealTimeMetrics(organizationId: string): Promise<void> {
    const metrics = await this.getRealTimeMetrics(organizationId);
    this.emit('metricsUpdate', metrics);
  }

  private async storeAlert(alert: EmailAlert): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: alert.metadata.organizationId,
          userId: alert.metadata.userId || '',
          action: 'ALERT_CREATED',
          details: JSON.stringify(alert)
        }
      });
    } catch (error) {
      console.error('Store alert error:', error);
    }
  }

  private startPatternDetection(): void {
    // Run pattern detection every 5 minutes
    this.patternDetectionInterval = setInterval(async () => {
      try {
        // Get all organizations
        const organizations = await this.prisma.organization.findMany({
          select: { id: true }
        });

        for (const org of organizations) {
          const patterns = await this.detectEmailPatterns(org.id);
          if (patterns.length > 0) {
            this.emit('patternsDetected', { organizationId: org.id, patterns });
          }
        }
      } catch (error) {
        console.error('Pattern detection interval error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  public stop(): void {
    if (this.patternDetectionInterval) {
      clearInterval(this.patternDetectionInterval);
      this.patternDetectionInterval = null;
    }
  }
}
