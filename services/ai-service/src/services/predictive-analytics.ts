import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from '../clients/openrouter';

export interface EmailForecast {
  period: '7d' | '30d' | '90d';
  predictedVolume: {
    received: number;
    sent: number;
    total: number;
  };
  confidence: number;
  factors: string[];
  trends: {
    volume: 'increasing' | 'stable' | 'decreasing';
    responseTime: 'improving' | 'stable' | 'declining';
    workload: 'increasing' | 'stable' | 'decreasing';
  };
  recommendations: string[];
  riskFactors: string[];
}

export interface ResponseTimePrediction {
  contactId: string;
  contactEmail: string;
  predictedResponseTime: number; // hours
  confidence: number;
  factors: string[];
  optimizationSuggestions: string[];
  bestTimeToSend: Date;
  urgencyScore: number; // 0-100
}

export interface WorkloadPrediction {
  userId: string;
  userName: string;
  predictedWorkload: number; // emails per day
  capacityUtilization: number; // percentage
  burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  suggestedDelegation: string[];
  optimalSchedule: {
    bestResponseTimes: string[];
    avoidTimes: string[];
    breakRecommendations: string[];
  };
}

export interface ClientCommunicationPattern {
  clientId: string;
  clientEmail: string;
  communicationFrequency: number; // emails per week
  preferredTiming: {
    bestDays: string[];
    bestHours: string[];
    avoidDays: string[];
    avoidHours: string[];
  };
  responsePattern: {
    averageResponseTime: number;
    responseRate: number;
    preferredChannel: 'email' | 'phone' | 'meeting';
  };
  engagementScore: number; // 0-100
  churnRisk: 'low' | 'medium' | 'high';
  nextOptimalContact: Date;
  personalizedStrategy: string[];
}

export interface CapacityPlanning {
  organizationId: string;
  currentCapacity: {
    totalUsers: number;
    activeUsers: number;
    averageEmailsPerUser: number;
    peakLoad: number;
  };
  futureNeeds: {
    predictedGrowth: number; // percentage
    requiredStaffing: number;
    trainingNeeds: string[];
    technologyUpgrades: string[];
  };
  recommendations: {
    hiring: string[];
    training: string[];
    automation: string[];
    process: string[];
  };
  timeline: {
    immediate: string[]; // next 30 days
    shortTerm: string[]; // next 3 months
    longTerm: string[]; // next 6 months
  };
}

export class PredictiveAnalyticsService {
  private prisma: PrismaClient;
  private openRouterClient: OpenRouterClient;

  constructor(prisma: PrismaClient, openRouterClient: OpenRouterClient) {
    this.prisma = prisma;
    this.openRouterClient = openRouterClient;
  }

  async forecastEmailVolume(
    organizationId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<EmailForecast> {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalEmailData(organizationId, 90); // 90 days of history
      
      // Analyze patterns and trends
      const patterns = await this.analyzeEmailPatterns(historicalData);
      
      // Use AI to generate predictions
      const forecast = await this.generateVolumeForecast(patterns, period);
      
      // Calculate confidence based on data quality and pattern consistency
      const confidence = this.calculateForecastConfidence(historicalData, patterns);
      
      // Generate recommendations
      const recommendations = await this.generateVolumeRecommendations(forecast, patterns);
      
      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(forecast, patterns);

      return {
        period,
        predictedVolume: forecast,
        confidence,
        factors: patterns.keyFactors,
        trends: patterns.trends,
        recommendations,
        riskFactors
      };

    } catch (error) {
      console.error('Email volume forecasting error:', error);
      throw error;
    }
  }

  async predictResponseTimes(
    organizationId: string,
    contactIds?: string[]
  ): Promise<ResponseTimePrediction[]> {
    try {
      const predictions: ResponseTimePrediction[] = [];
      
      // Get contacts to analyze
      const contacts = await this.prisma.contact.findMany({
        where: {
          organizationId,
          ...(contactIds && { id: { in: contactIds } })
        },
        include: {
          messages: {
            orderBy: { receivedAt: 'desc' },
            take: 50 // Last 50 messages for analysis
          }
        }
      });

      for (const contact of contacts) {
        // Analyze historical response patterns
        const responsePattern = await this.analyzeResponsePattern(contact.messages);
        
        // Predict future response time
        const predictedTime = await this.predictContactResponseTime(contact, responsePattern);
        
        // Generate optimization suggestions
        const suggestions = await this.generateResponseOptimization(contact, responsePattern);
        
        // Determine best time to send
        const bestTime = this.calculateOptimalSendTime(contact, responsePattern);
        
        // Calculate urgency score
        const urgencyScore = this.calculateUrgencyScore(contact, responsePattern);

        predictions.push({
          contactId: contact.id,
          contactEmail: contact.email,
          predictedResponseTime: predictedTime,
          confidence: responsePattern.confidence,
          factors: responsePattern.factors,
          optimizationSuggestions: suggestions,
          bestTimeToSend: bestTime,
          urgencyScore
        });
      }

      return predictions;

    } catch (error) {
      console.error('Response time prediction error:', error);
      throw error;
    }
  }

  async predictWorkload(
    organizationId: string,
    timeHorizon: number = 30 // days
  ): Promise<WorkloadPrediction[]> {
    try {
      const predictions: WorkloadPrediction[] = [];
      
      // Get users and their historical workload
      const users = await this.prisma.user.findMany({
        where: { organizationId },
        include: {
          mailboxes: {
            include: {
              messages: {
                where: {
                  receivedAt: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                  }
                }
              }
            }
          }
        }
      });

      for (const user of users) {
        const allMessages = user.mailboxes.flatMap(mb => mb.messages);
        
        // Analyze workload patterns
        const workloadPattern = await this.analyzeWorkloadPattern(allMessages, user);
        
        // Predict future workload
        const predictedWorkload = await this.predictFutureWorkload(workloadPattern, timeHorizon);
        
        // Calculate capacity utilization
        const capacityUtilization = this.calculateCapacityUtilization(user, predictedWorkload);
        
        // Assess burnout risk
        const burnoutRisk = this.assessBurnoutRisk(user, workloadPattern, predictedWorkload);
        
        // Generate recommendations
        const recommendations = await this.generateWorkloadRecommendations(user, workloadPattern, predictedWorkload);
        
        // Suggest delegation opportunities
        const suggestedDelegation = await this.suggestDelegation(user, workloadPattern);
        
        // Calculate optimal schedule
        const optimalSchedule = await this.calculateOptimalSchedule(user, workloadPattern);

        predictions.push({
          userId: user.id,
          userName: user.name || user.email,
          predictedWorkload,
          capacityUtilization,
          burnoutRisk,
          recommendations,
          suggestedDelegation,
          optimalSchedule
        });
      }

      return predictions;

    } catch (error) {
      console.error('Workload prediction error:', error);
      throw error;
    }
  }

  async analyzeClientCommunicationPatterns(
    organizationId: string,
    clientIds?: string[]
  ): Promise<ClientCommunicationPattern[]> {
    try {
      const patterns: ClientCommunicationPattern[] = [];
      
      // Get clients to analyze
      const clients = await this.prisma.contact.findMany({
        where: {
          organizationId,
          ...(clientIds && { id: { in: clientIds } })
        },
        include: {
          messages: {
            orderBy: { receivedAt: 'desc' },
            take: 100 // Last 100 messages for analysis
          }
        }
      });

      for (const client of clients) {
        // Analyze communication frequency
        const frequency = await this.analyzeCommunicationFrequency(client.messages);
        
        // Determine preferred timing
        const preferredTiming = await this.analyzePreferredTiming(client.messages);
        
        // Analyze response patterns
        const responsePattern = await this.analyzeClientResponsePattern(client.messages);
        
        // Calculate engagement score
        const engagementScore = this.calculateEngagementScore(client, responsePattern);
        
        // Assess churn risk
        const churnRisk = this.assessChurnRisk(client, responsePattern);
        
        // Predict next optimal contact
        const nextOptimalContact = this.predictNextOptimalContact(client, responsePattern);
        
        // Generate personalized strategy
        const personalizedStrategy = await this.generatePersonalizedStrategy(client, responsePattern);

        patterns.push({
          clientId: client.id,
          clientEmail: client.email,
          communicationFrequency: frequency,
          preferredTiming,
          responsePattern,
          engagementScore,
          churnRisk,
          nextOptimalContact,
          personalizedStrategy
        });
      }

      return patterns;

    } catch (error) {
      console.error('Client communication pattern analysis error:', error);
      throw error;
    }
  }

  async generateCapacityPlanning(
    organizationId: string,
    growthRate: number = 0.15 // 15% annual growth
  ): Promise<CapacityPlanning> {
    try {
      // Analyze current capacity
      const currentCapacity = await this.analyzeCurrentCapacity(organizationId);
      
      // Predict future needs
      const futureNeeds = await this.predictFutureNeeds(organizationId, growthRate);
      
      // Generate recommendations
      const recommendations = await this.generateCapacityRecommendations(currentCapacity, futureNeeds);
      
      // Create timeline
      const timeline = await this.createImplementationTimeline(recommendations);

      return {
        organizationId,
        currentCapacity,
        futureNeeds,
        recommendations,
        timeline
      };

    } catch (error) {
      console.error('Capacity planning error:', error);
      throw error;
    }
  }

  private async getHistoricalEmailData(organizationId: string, days: number): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await this.prisma.message.findMany({
      where: {
        organization: { id: organizationId },
        receivedAt: { gte: startDate }
      },
      orderBy: { receivedAt: 'asc' },
      select: {
        id: true,
        receivedAt: true,
        isOutbound: true,
        fromEmail: true,
        toEmails: true,
        subject: true,
        threadId: true,
        labels: true,
        isImportant: true
      }
    });
  }

  private async analyzeEmailPatterns(historicalData: any[]): Promise<any> {
    // Group by day and analyze patterns
    const dailyVolumes = new Map<string, { received: number; sent: number }>();
    
    historicalData.forEach(message => {
      const date = message.receivedAt.toISOString().split('T')[0];
      if (!dailyVolumes.has(date)) {
        dailyVolumes.set(date, { received: 0, sent: 0 });
      }
      
      if (message.isOutbound) {
        dailyVolumes.get(date)!.sent++;
      } else {
        dailyVolumes.get(date)!.received++;
      }
    });

    // Calculate trends
    const volumes = Array.from(dailyVolumes.values());
    const avgReceived = volumes.reduce((sum, v) => sum + v.received, 0) / volumes.length;
    const avgSent = volumes.reduce((sum, v) => sum + v.sent, 0) / volumes.length;

    // Simple trend analysis
    const recentVolumes = volumes.slice(-7); // Last 7 days
    const earlierVolumes = volumes.slice(-14, -7); // Previous 7 days
    
    const recentAvg = recentVolumes.reduce((sum, v) => sum + v.received + v.sent, 0) / recentVolumes.length;
    const earlierAvg = earlierVolumes.reduce((sum, v) => sum + v.received + v.sent, 0) / earlierVolumes.length;
    
    const trend = recentAvg > earlierAvg ? 'increasing' : 
                  recentAvg < earlierAvg ? 'decreasing' : 'stable';

    return {
      dailyVolumes: Array.from(dailyVolumes.entries()),
      averageReceived: avgReceived,
      averageSent: avgSent,
      trends: {
        volume: trend,
        responseTime: 'stable', // Would be calculated from actual response times
        workload: trend
      },
      keyFactors: [
        'Historical volume patterns',
        'Day of week variations',
        'Seasonal trends'
      ]
    };
  }

  private async generateVolumeForecast(patterns: any, period: string): Promise<any> {
    // Use AI to generate intelligent forecasts
    const forecastPrompt = `Based on historical email patterns, predict future email volume:

Historical Data:
- Average received per day: ${patterns.averageReceived.toFixed(1)}
- Average sent per day: ${patterns.averageSent.toFixed(1)}
- Trend: ${patterns.trends.volume}
- Key factors: ${patterns.keyFactors.join(', ')}

Predict for ${period} period:
1. Total received emails
2. Total sent emails
3. Daily averages
4. Peak days/times

Consider seasonal variations, business growth, and historical trends.

Respond with JSON: {
  "received": number,
  "sent": number,
  "total": number,
  "dailyAverage": number,
  "peakDays": string[],
  "reasoning": "explanation"
}`;

    try {
      const response = await this.openRouterClient.generateText(forecastPrompt, {
        temperature: 0.3,
        max_tokens: 400
      });

      const forecast = JSON.parse(response);
      
      // Apply some basic mathematical forecasting as backup
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const growthFactor = patterns.trends.volume === 'increasing' ? 1.1 : 
                          patterns.trends.volume === 'decreasing' ? 0.9 : 1.0;
      
      return {
        received: Math.round(patterns.averageReceived * days * growthFactor),
        sent: Math.round(patterns.averageSent * days * growthFactor),
        total: Math.round((patterns.averageReceived + patterns.averageSent) * days * growthFactor)
      };
    } catch (error) {
      console.error('AI forecast generation error:', error);
      // Fallback to mathematical forecasting
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const growthFactor = patterns.trends.volume === 'increasing' ? 1.1 : 
                          patterns.trends.volume === 'decreasing' ? 0.9 : 1.0;
      
      return {
        received: Math.round(patterns.averageReceived * days * growthFactor),
        sent: Math.round(patterns.averageSent * days * growthFactor),
        total: Math.round((patterns.averageReceived + patterns.averageSent) * days * growthFactor)
      };
    }
  }

  private calculateForecastConfidence(historicalData: any[], patterns: any): number {
    // Calculate confidence based on data consistency and volume
    const dataPoints = historicalData.length;
    const consistency = this.calculateDataConsistency(patterns.dailyVolumes);
    
    // More data points and consistent patterns = higher confidence
    let confidence = Math.min(0.9, dataPoints / 1000); // Max 90% confidence
    confidence *= consistency;
    
    return Math.max(0.3, confidence); // Min 30% confidence
  }

  private calculateDataConsistency(volumes: any[]): number {
    if (volumes.length < 2) return 0.3;
    
    const values = volumes.map(([_, data]) => data.received + data.sent);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    const coefficientOfVariation = stdDev / mean;
    return Math.max(0.3, 1 - coefficientOfVariation);
  }

  private async generateVolumeRecommendations(forecast: any, patterns: any): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (forecast.total > patterns.averageReceived + patterns.averageSent) {
      recommendations.push('Prepare for increased email volume');
      recommendations.push('Consider additional staffing during peak periods');
      recommendations.push('Review email automation and templates');
    }
    
    if (patterns.trends.volume === 'increasing') {
      recommendations.push('Monitor capacity utilization closely');
      recommendations.push('Plan for scaling email infrastructure');
    }
    
    recommendations.push('Implement email prioritization system');
    recommendations.push('Set up automated responses for common queries');
    
    return recommendations;
  }

  private identifyRiskFactors(forecast: any, patterns: any): string[] {
    const risks: string[] = [];
    
    if (forecast.total > (patterns.averageReceived + patterns.averageSent) * 1.5) {
      risks.push('Potential email overload risk');
    }
    
    if (patterns.trends.volume === 'increasing') {
      risks.push('Sustained growth may strain resources');
    }
    
    return risks;
  }

  private async analyzeResponsePattern(messages: any[]): Promise<any> {
    // Analyze response time patterns from message threads
    const responseTimes: number[] = [];
    const factors: string[] = [];
    
    // Group messages by thread
    const threads = new Map<string, any[]>();
    messages.forEach(msg => {
      if (!threads.has(msg.threadId)) {
        threads.set(msg.threadId, []);
      }
      threads.get(msg.threadId)!.push(msg);
    });
    
    // Calculate response times for each thread
    threads.forEach(threadMessages => {
      const sorted = threadMessages.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
      
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        
        // Check if this is a response (different sender)
        if (current.fromEmail !== next.fromEmail) {
          const responseTime = (next.receivedAt.getTime() - current.receivedAt.getTime()) / (1000 * 60 * 60); // hours
          responseTimes.push(responseTime);
        }
      }
    });
    
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 24; // Default 24 hours
    
    // Determine confidence based on data quality
    const confidence = Math.min(0.9, responseTimes.length / 20); // More data = higher confidence
    
    // Identify factors
    if (avgResponseTime < 2) factors.push('Very responsive');
    else if (avgResponseTime > 48) factors.push('Slow responder');
    
    if (responseTimes.length < 5) factors.push('Limited interaction history');
    
    return {
      averageResponseTime: avgResponseTime,
      responseTimes,
      confidence,
      factors
    };
  }

  private async predictContactResponseTime(contact: any, responsePattern: any): Promise<number> {
    // Use AI to predict response time based on patterns
    const predictionPrompt = `Predict response time for this contact:

Contact: ${contact.email}
Historical average response time: ${responsePattern.averageResponseTime.toFixed(1)} hours
Factors: ${responsePattern.factors.join(', ')}
Confidence: ${responsePattern.confidence.toFixed(2)}

Consider:
1. Historical patterns
2. Contact importance
3. Communication frequency
4. Time of day/week patterns

Predict response time in hours:`;

    try {
      const response = await this.openRouterClient.generateText(predictionPrompt, {
        temperature: 0.2,
        max_tokens: 100
      });
      
      const predictedTime = parseFloat(response.trim());
      return isNaN(predictedTime) ? responsePattern.averageResponseTime : predictedTime;
    } catch (error) {
      console.error('Response time prediction error:', error);
      return responsePattern.averageResponseTime;
    }
  }

  private async generateResponseOptimization(contact: any, responsePattern: any): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (responsePattern.averageResponseTime > 24) {
      suggestions.push('Follow up within 24 hours if no response');
      suggestions.push('Use more urgent subject lines');
    }
    
    if (responsePattern.confidence < 0.5) {
      suggestions.push('Increase communication frequency to establish patterns');
    }
    
    suggestions.push('Send emails during business hours');
    suggestions.push('Keep messages concise and actionable');
    
    return suggestions;
  }

  private calculateOptimalSendTime(contact: any, responsePattern: any): Date {
    // Simple optimal time calculation (10 AM on weekdays)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(10, 0, 0, 0);
    
    // Adjust for weekends
    const dayOfWeek = tomorrow.getDay();
    if (dayOfWeek === 0) { // Sunday
      tomorrow.setDate(tomorrow.getDate() + 1); // Move to Monday
    } else if (dayOfWeek === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2); // Move to Monday
    }
    
    return tomorrow;
  }

  private calculateUrgencyScore(contact: any, responsePattern: any): number {
    // Calculate urgency score based on response time and importance
    let score = 50; // Base score
    
    if (responsePattern.averageResponseTime < 2) {
      score += 30; // Very responsive
    } else if (responsePattern.averageResponseTime > 48) {
      score -= 30; // Slow responder
    }
    
    // Adjust based on contact labels
    if (contact.labels.includes('VIP')) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private async analyzeWorkloadPattern(messages: any[], user: any): Promise<any> {
    // Analyze workload patterns
    const dailyWorkload = new Map<string, number>();
    
    messages.forEach(message => {
      const date = message.receivedAt.toISOString().split('T')[0];
      dailyWorkload.set(date, (dailyWorkload.get(date) || 0) + 1);
    });
    
    const workloads = Array.from(dailyWorkload.values());
    const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    
    return {
      dailyWorkloads: Array.from(dailyWorkload.entries()),
      averageWorkload: avgWorkload,
      peakWorkload: Math.max(...workloads),
      workloadVariation: this.calculateStandardDeviation(workloads)
    };
  }

  private async predictFutureWorkload(workloadPattern: any, timeHorizon: number): Promise<number> {
    // Predict future workload based on patterns
    const growthRate = 0.05; // 5% monthly growth
    const months = timeHorizon / 30;
    return Math.round(workloadPattern.averageWorkload * Math.pow(1 + growthRate, months));
  }

  private calculateCapacityUtilization(user: any, predictedWorkload: number): number {
    // Assume 50 emails per day is 100% capacity
    const maxCapacity = 50;
    return Math.min(100, (predictedWorkload / maxCapacity) * 100);
  }

  private assessBurnoutRisk(user: any, workloadPattern: any, predictedWorkload: number): 'low' | 'medium' | 'high' | 'critical' {
    const capacityUtilization = this.calculateCapacityUtilization(user, predictedWorkload);
    
    if (capacityUtilization > 90) return 'critical';
    if (capacityUtilization > 75) return 'high';
    if (capacityUtilization > 60) return 'medium';
    return 'low';
  }

  private async generateWorkloadRecommendations(user: any, workloadPattern: any, predictedWorkload: number): Promise<string[]> {
    const recommendations: string[] = [];
    const capacityUtilization = this.calculateCapacityUtilization(user, predictedWorkload);
    
    if (capacityUtilization > 80) {
      recommendations.push('Consider delegating some emails');
      recommendations.push('Implement email automation');
      recommendations.push('Schedule regular breaks');
    }
    
    if (workloadPattern.workloadVariation > 20) {
      recommendations.push('Stabilize workload distribution');
      recommendations.push('Plan for peak periods');
    }
    
    recommendations.push('Use email templates for common responses');
    recommendations.push('Set up email prioritization');
    
    return recommendations;
  }

  private async suggestDelegation(user: any, workloadPattern: any): Promise<string[]> {
    // Simple delegation suggestions
    return [
      'Delegate routine emails to junior staff',
      'Use automated responses for common queries',
      'Create email templates for frequent requests'
    ];
  }

  private async calculateOptimalSchedule(user: any, workloadPattern: any): Promise<any> {
    return {
      bestResponseTimes: ['9:00 AM', '2:00 PM', '4:00 PM'],
      avoidTimes: ['12:00 PM - 1:00 PM', 'After 6:00 PM'],
      breakRecommendations: [
        'Take 15-minute breaks every 2 hours',
        'Schedule lunch break away from email',
        'End email work 1 hour before leaving'
      ]
    };
  }

  private async analyzeCommunicationFrequency(messages: any[]): Promise<number> {
    if (messages.length === 0) return 0;
    
    const firstMessage = messages[messages.length - 1];
    const lastMessage = messages[0];
    const daysDiff = (lastMessage.receivedAt.getTime() - firstMessage.receivedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff > 0 ? (messages.length / daysDiff) * 7 : 0; // emails per week
  }

  private async analyzePreferredTiming(messages: any[]): Promise<any> {
    const dayCounts = new Map<string, number>();
    const hourCounts = new Map<number, number>();
    
    messages.forEach(message => {
      const dayOfWeek = message.receivedAt.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = message.receivedAt.getHours();
      
      dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + 1);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    // Find best days and hours
    const bestDays = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
    
    const bestHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    
    return {
      bestDays,
      bestHours,
      avoidDays: ['Sunday', 'Saturday'],
      avoidHours: ['22:00', '23:00', '0:00', '1:00', '2:00', '3:00', '4:00', '5:00']
    };
  }

  private async analyzeClientResponsePattern(messages: any[]): Promise<any> {
    // Similar to analyzeResponsePattern but focused on client behavior
    const responseTimes: number[] = [];
    
    // Calculate response times
    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];
      
      if (current.fromEmail !== next.fromEmail) {
        const responseTime = (next.receivedAt.getTime() - current.receivedAt.getTime()) / (1000 * 60 * 60);
        responseTimes.push(responseTime);
      }
    }
    
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 24;
    
    const responseRate = responseTimes.length / Math.max(1, messages.length / 2); // Rough estimate
    
    return {
      averageResponseTime: avgResponseTime,
      responseRate: Math.min(1, responseRate),
      preferredChannel: 'email' // Default, could be determined from analysis
    };
  }

  private calculateEngagementScore(client: any, responsePattern: any): number {
    let score = 50; // Base score
    
    // Adjust based on response rate
    score += responsePattern.responseRate * 30;
    
    // Adjust based on response time
    if (responsePattern.averageResponseTime < 4) {
      score += 20; // Very responsive
    } else if (responsePattern.averageResponseTime > 24) {
      score -= 20; // Slow responder
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private assessChurnRisk(client: any, responsePattern: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    if (responsePattern.responseRate < 0.3) riskScore += 40;
    if (responsePattern.averageResponseTime > 48) riskScore += 30;
    
    // Check for decreasing communication
    // This would require more sophisticated analysis
    
    if (riskScore > 60) return 'high';
    if (riskScore > 30) return 'medium';
    return 'low';
  }

  private predictNextOptimalContact(client: any, responsePattern: any): Date {
    // Predict next optimal contact time based on patterns
    const now = new Date();
    const avgResponseTime = responsePattern.averageResponseTime;
    
    // Add average response time plus some buffer
    const nextContact = new Date(now.getTime() + (avgResponseTime + 24) * 60 * 60 * 1000);
    
    // Adjust to business hours
    nextContact.setHours(10, 0, 0, 0);
    
    return nextContact;
  }

  private async generatePersonalizedStrategy(client: any, responsePattern: any): Promise<string[]> {
    const strategy: string[] = [];
    
    if (responsePattern.responseRate < 0.5) {
      strategy.push('Increase communication frequency');
      strategy.push('Use more engaging subject lines');
    }
    
    if (responsePattern.averageResponseTime > 24) {
      strategy.push('Follow up more frequently');
      strategy.push('Use multiple communication channels');
    }
    
    strategy.push('Personalize email content');
    strategy.push('Provide clear call-to-actions');
    
    return strategy;
  }

  private async analyzeCurrentCapacity(organizationId: string): Promise<any> {
    const users = await this.prisma.user.findMany({
      where: { organizationId }
    });
    
    const messages = await this.prisma.message.findMany({
      where: {
        organization: { id: organizationId },
        receivedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    return {
      totalUsers: users.length,
      activeUsers: users.length, // Simplified
      averageEmailsPerUser: messages.length / users.length,
      peakLoad: Math.max(...Array.from({ length: 30 }, (_, i) => {
        const dayStart = new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        return messages.filter(m => m.receivedAt >= dayStart && m.receivedAt < dayEnd).length;
      }))
    };
  }

  private async predictFutureNeeds(organizationId: string, growthRate: number): Promise<any> {
    const currentCapacity = await this.analyzeCurrentCapacity(organizationId);
    
    return {
      predictedGrowth: growthRate * 100, // percentage
      requiredStaffing: Math.ceil(currentCapacity.totalUsers * (1 + growthRate)),
      trainingNeeds: [
        'Email productivity training',
        'Advanced analytics usage',
        'Customer service excellence'
      ],
      technologyUpgrades: [
        'Enhanced email automation',
        'Advanced analytics dashboard',
        'Mobile email management'
      ]
    };
  }

  private async generateCapacityRecommendations(currentCapacity: any, futureNeeds: any): Promise<any> {
    return {
      hiring: [
        'Hire additional customer service representatives',
        'Consider remote workers for flexibility',
        'Plan for seasonal staffing needs'
      ],
      training: [
        'Implement ongoing productivity training',
        'Cross-train team members',
        'Develop leadership capabilities'
      ],
      automation: [
        'Implement advanced email automation',
        'Set up intelligent routing',
        'Create response templates'
      ],
      process: [
        'Streamline email workflows',
        'Implement quality assurance',
        'Establish performance metrics'
      ]
    };
  }

  private async createImplementationTimeline(recommendations: any): Promise<any> {
    return {
      immediate: [
        'Implement email templates',
        'Set up basic automation',
        'Train team on new tools'
      ],
      shortTerm: [
        'Hire additional staff',
        'Implement advanced analytics',
        'Optimize workflows'
      ],
      longTerm: [
        'Scale infrastructure',
        'Develop custom solutions',
        'Expand to new markets'
      ]
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
