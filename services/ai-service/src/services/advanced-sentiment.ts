import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from '../clients/openrouter';
import { hashString } from '@taskforce/shared';

export interface EmotionAnalysis {
  emotion: 'happy' | 'satisfied' | 'neutral' | 'concerned' | 'frustrated' | 'angry' | 'urgent';
  intensity: number; // 0-1
  confidence: number; // 0-1
  keywords: string[];
  context: string;
}

export interface RelationshipHealth {
  clientId: string;
  clientEmail: string;
  healthScore: number; // 0-100
  sentiment: EmotionAnalysis;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  lastInteraction: Date;
  communicationFrequency: number; // emails per week
  responseTimeTrend: 'improving' | 'stable' | 'declining';
}

export interface TeamStressLevel {
  userId: string;
  userName: string;
  stressLevel: number; // 0-100
  indicators: string[];
  recommendations: string[];
  workloadScore: number;
  communicationOverload: boolean;
  urgentEmailsRatio: number;
}

export interface CrisisDetection {
  type: 'relationship_crisis' | 'communication_breakdown' | 'workload_overload' | 'security_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedEntities: string[];
  description: string;
  recommendations: string[];
  detectedAt: Date;
  confidence: number;
}

export class AdvancedSentimentService {
  private prisma: PrismaClient;
  private openRouterClient: OpenRouterClient;

  constructor(prisma: PrismaClient, openRouterClient: OpenRouterClient) {
    this.prisma = prisma;
    this.openRouterClient = openRouterClient;
  }

  async analyzeEmailSentiment(
    messageId: string,
    content: string,
    context: {
      sender: string;
      recipient: string;
      subject: string;
      timestamp: Date;
      threadId?: string;
    }
  ): Promise<EmotionAnalysis> {
    try {
      const sentimentPrompt = `Analyze the emotional tone and sentiment of this email communication:

**Email Details:**
- From: ${context.sender}
- To: ${context.recipient}
- Subject: ${context.subject}
- Content: ${content}
- Date: ${context.timestamp.toISOString()}

**Analysis Required:**
1. Primary emotion (happy, satisfied, neutral, concerned, frustrated, angry, urgent)
2. Emotional intensity (0.0 to 1.0)
3. Confidence level (0.0 to 1.0)
4. Key emotional keywords
5. Contextual understanding

**Response Format (JSON):**
{
  "emotion": "primary_emotion",
  "intensity": 0.0-1.0,
  "confidence": 0.0-1.0,
  "keywords": ["keyword1", "keyword2"],
  "context": "brief contextual explanation"
}`;

      const response = await this.openRouterClient.generateText(sentimentPrompt, {
        temperature: 0.3,
        max_tokens: 500
      });

      const analysis = JSON.parse(response);
      
      // Store analysis result
      await this.storeSentimentAnalysis(messageId, analysis, content);
      
      return analysis;

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        emotion: 'neutral',
        intensity: 0.5,
        confidence: 0.1,
        keywords: [],
        context: 'Analysis failed'
      };
    }
  }

  async trackRelationshipHealth(
    organizationId: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    }
  ): Promise<RelationshipHealth[]> {
    try {
      // Get all contacts with recent email activity
      const contacts = await this.prisma.contact.findMany({
        where: {
          organizationId,
          messages: {
            some: {
              receivedAt: {
                gte: timeRange.start,
                lte: timeRange.end
              }
            }
          }
        },
        include: {
          messages: {
            where: {
              receivedAt: {
                gte: timeRange.start,
                lte: timeRange.end
              }
            },
            orderBy: { receivedAt: 'desc' },
            take: 20 // Last 20 messages for analysis
          }
        }
      });

      const relationshipHealth: RelationshipHealth[] = [];

      for (const contact of contacts) {
        // Analyze sentiment over time
        const sentimentAnalysis = await this.analyzeContactSentiment(contact.messages);
        
        // Calculate health score
        const healthScore = await this.calculateHealthScore(contact, sentimentAnalysis);
        
        // Determine trend
        const trend = await this.calculateTrend(contact.messages);
        
        // Generate recommendations
        const recommendations = await this.generateRecommendations(contact, sentimentAnalysis, healthScore);
        
        // Identify risk factors
        const riskFactors = await this.identifyRiskFactors(contact, sentimentAnalysis);

        relationshipHealth.push({
          clientId: contact.id,
          clientEmail: contact.email,
          healthScore,
          sentiment: sentimentAnalysis,
          trend,
          riskFactors,
          recommendations,
          lastInteraction: contact.messages[0]?.receivedAt || new Date(),
          communicationFrequency: contact.messages.length / 4.3, // per week
          responseTimeTrend: 'stable' // Would be calculated from actual response times
        });
      }

      return relationshipHealth;

    } catch (error) {
      console.error('Relationship health tracking error:', error);
      throw error;
    }
  }

  async monitorTeamStressLevel(
    organizationId: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
      end: new Date()
    }
  ): Promise<TeamStressLevel[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { organizationId },
        include: {
          mailboxes: {
            include: {
              messages: {
                where: {
                  receivedAt: {
                    gte: timeRange.start,
                    lte: timeRange.end
                  }
                }
              }
            }
          }
        }
      });

      const teamStressLevels: TeamStressLevel[] = [];

      for (const user of users) {
        const allMessages = user.mailboxes.flatMap(mb => mb.messages);
        
        // Analyze stress indicators
        const stressAnalysis = await this.analyzeUserStress(allMessages, user);
        
        // Calculate workload score
        const workloadScore = await this.calculateWorkloadScore(allMessages);
        
        // Check for communication overload
        const communicationOverload = allMessages.length > 100; // More than 100 emails per week
        
        // Calculate urgent emails ratio
        const urgentEmails = allMessages.filter(msg => 
          msg.labels.includes('urgent') || 
          msg.isImportant ||
          msg.subject?.toLowerCase().includes('urgent') ||
          msg.subject?.toLowerCase().includes('asap')
        ).length;
        const urgentEmailsRatio = allMessages.length > 0 ? urgentEmails / allMessages.length : 0;

        teamStressLevels.push({
          userId: user.id,
          userName: user.name || user.email,
          stressLevel: stressAnalysis.stressLevel,
          indicators: stressAnalysis.indicators,
          recommendations: stressAnalysis.recommendations,
          workloadScore,
          communicationOverload,
          urgentEmailsRatio
        });
      }

      return teamStressLevels;

    } catch (error) {
      console.error('Team stress monitoring error:', error);
      throw error;
    }
  }

  async detectCrises(
    organizationId: string
  ): Promise<CrisisDetection[]> {
    try {
      const crises: CrisisDetection[] = [];

      // Check for relationship crises
      const relationshipHealth = await this.trackRelationshipHealth(organizationId);
      const criticalRelationships = relationshipHealth.filter(rh => 
        rh.healthScore < 30 || rh.trend === 'critical'
      );

      for (const relationship of criticalRelationships) {
        crises.push({
          type: 'relationship_crisis',
          severity: relationship.healthScore < 20 ? 'critical' : 'high',
          affectedEntities: [relationship.clientEmail],
          description: `Critical relationship health detected for ${relationship.clientEmail}. Health score: ${relationship.healthScore}`,
          recommendations: relationship.recommendations,
          detectedAt: new Date(),
          confidence: 0.8
        });
      }

      // Check for team stress crises
      const teamStress = await this.monitorTeamStressLevel(organizationId);
      const stressedTeamMembers = teamStress.filter(ts => 
        ts.stressLevel > 80 || ts.communicationOverload
      );

      for (const member of stressedTeamMembers) {
        crises.push({
          type: 'workload_overload',
          severity: member.stressLevel > 90 ? 'critical' : 'high',
          affectedEntities: [member.userName],
          description: `High stress level detected for ${member.userName}. Stress level: ${member.stressLevel}`,
          recommendations: member.recommendations,
          detectedAt: new Date(),
          confidence: 0.7
        });
      }

      // Check for communication breakdowns
      const communicationBreakdowns = await this.detectCommunicationBreakdowns(organizationId);
      crises.push(...communicationBreakdowns);

      return crises;

    } catch (error) {
      console.error('Crisis detection error:', error);
      throw error;
    }
  }

  private async analyzeContactSentiment(messages: any[]): Promise<EmotionAnalysis> {
    if (messages.length === 0) {
      return {
        emotion: 'neutral',
        intensity: 0.5,
        confidence: 0.1,
        keywords: [],
        context: 'No recent messages'
      };
    }

    // Analyze the most recent messages
    const recentMessages = messages.slice(0, 5);
    const content = recentMessages.map(msg => 
      `${msg.subject || ''} ${msg.snippet || ''}`
    ).join(' ');

    return await this.analyzeEmailSentiment(
      recentMessages[0].id,
      content,
      {
        sender: recentMessages[0].fromEmail,
        recipient: recentMessages[0].toEmails[0] || 'unknown',
        subject: recentMessages[0].subject || '',
        timestamp: recentMessages[0].receivedAt,
        threadId: recentMessages[0].threadId
      }
    );
  }

  private async calculateHealthScore(contact: any, sentiment: EmotionAnalysis): Promise<number> {
    let score = 50; // Base score

    // Adjust based on sentiment
    switch (sentiment.emotion) {
      case 'happy':
      case 'satisfied':
        score += 30;
        break;
      case 'neutral':
        score += 0;
        break;
      case 'concerned':
        score -= 20;
        break;
      case 'frustrated':
        score -= 40;
        break;
      case 'angry':
        score -= 60;
        break;
      case 'urgent':
        score -= 10; // Urgent might indicate problems
        break;
    }

    // Adjust based on communication frequency
    const messageCount = contact.messages.length;
    if (messageCount > 10) score += 10; // Regular communication
    else if (messageCount < 3) score -= 20; // Low communication

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  private async calculateTrend(messages: any[]): Promise<'improving' | 'stable' | 'declining' | 'critical'> {
    if (messages.length < 3) return 'stable';

    // Simple trend analysis based on recent messages
    const recent = messages.slice(0, 3);
    const older = messages.slice(3, 6);

    // This is a simplified trend calculation
    // In a real implementation, you'd analyze sentiment over time
    return 'stable'; // Placeholder
  }

  private async generateRecommendations(
    contact: any, 
    sentiment: EmotionAnalysis, 
    healthScore: number
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (healthScore < 30) {
      recommendations.push('Schedule immediate follow-up call');
      recommendations.push('Review recent interactions for issues');
      recommendations.push('Consider escalating to management');
    } else if (healthScore < 50) {
      recommendations.push('Increase communication frequency');
      recommendations.push('Send proactive status updates');
    } else if (healthScore > 80) {
      recommendations.push('Maintain current communication level');
      recommendations.push('Consider upselling opportunities');
    }

    if (sentiment.emotion === 'frustrated' || sentiment.emotion === 'angry') {
      recommendations.push('Address concerns promptly');
      recommendations.push('Offer alternative solutions');
    }

    return recommendations;
  }

  private async identifyRiskFactors(
    contact: any, 
    sentiment: EmotionAnalysis
  ): Promise<string[]> {
    const riskFactors: string[] = [];

    if (sentiment.emotion === 'angry' || sentiment.emotion === 'frustrated') {
      riskFactors.push('Negative sentiment detected');
    }

    if (contact.messages.length < 2) {
      riskFactors.push('Low communication frequency');
    }

    if (sentiment.intensity > 0.8 && sentiment.emotion !== 'happy') {
      riskFactors.push('High emotional intensity');
    }

    return riskFactors;
  }

  private async analyzeUserStress(messages: any[], user: any): Promise<{
    stressLevel: number;
    indicators: string[];
    recommendations: string[];
  }> {
    const indicators: string[] = [];
    let stressLevel = 50; // Base stress level

    // Analyze message patterns for stress indicators
    const urgentMessages = messages.filter(msg => 
      msg.labels.includes('urgent') || msg.isImportant
    ).length;

    if (urgentMessages > messages.length * 0.3) {
      indicators.push('High ratio of urgent emails');
      stressLevel += 20;
    }

    // Check for late-night emails (stress indicator)
    const lateNightEmails = messages.filter(msg => {
      const hour = msg.receivedAt.getHours();
      return hour < 6 || hour > 22;
    }).length;

    if (lateNightEmails > 5) {
      indicators.push('Working outside normal hours');
      stressLevel += 15;
    }

    // Check email volume
    if (messages.length > 50) {
      indicators.push('High email volume');
      stressLevel += 10;
    }

    const recommendations: string[] = [];
    if (stressLevel > 70) {
      recommendations.push('Consider delegating some emails');
      recommendations.push('Schedule breaks between email sessions');
      recommendations.push('Review email prioritization');
    }

    return {
      stressLevel: Math.min(100, stressLevel),
      indicators,
      recommendations
    };
  }

  private async calculateWorkloadScore(messages: any[]): Promise<number> {
    // Simple workload calculation based on email volume and complexity
    let score = messages.length * 2; // Base score from volume
    
    // Add complexity factors
    const messagesWithAttachments = messages.filter(msg => msg.hasAttachments).length;
    score += messagesWithAttachments * 3; // Attachments add complexity
    
    return Math.min(100, score);
  }

  private async detectCommunicationBreakdowns(organizationId: string): Promise<CrisisDetection[]> {
    // This would detect patterns like:
    // - No responses to important emails
    // - Escalating tone in threads
    // - Communication gaps
    return []; // Placeholder
  }

  private async storeSentimentAnalysis(
    messageId: string, 
    analysis: EmotionAnalysis, 
    content: string
  ): Promise<void> {
    try {
      const promptHash = await hashString(content);
      
      await this.prisma.aIAnalysis.create({
        data: {
          messageId,
          analysisType: 'SENTIMENT',
          result: analysis,
          confidence: analysis.confidence,
          model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-nano-9b-v2:free',
          promptHash,
          processingTime: 0
        }
      });
    } catch (error) {
      console.error('Failed to store sentiment analysis:', error);
    }
  }
}
