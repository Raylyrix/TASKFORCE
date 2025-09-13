import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from '../clients/openrouter';
import { hashString } from '@taskforce/shared';

export interface NLQContext {
  dateRange?: { start: string; end: string };
  mailboxIds?: string[];
  includeCharts?: boolean;
}

export interface AIAnalysisResult {
  response: string;
  charts?: Array<{
    type: string;
    data: any;
    title: string;
  }>;
  sources?: string[];
  confidence?: number;
}

export class AIAnalysisService {
  private prisma: PrismaClient;
  private openRouterClient: OpenRouterClient;

  constructor(prisma: PrismaClient, openRouterClient: OpenRouterClient) {
    this.prisma = prisma;
    this.openRouterClient = openRouterClient;
  }

  async processNaturalLanguageQuery(
    query: string,
    organizationId: string,
    context?: NLQContext
  ): Promise<AIAnalysisResult> {
    try {
      // First, try to understand what the user is asking for
      const intent = await this.analyzeQueryIntent(query);
      
      // Get relevant data based on the intent
      const data = await this.getRelevantData(intent, organizationId, context);
      
      // Generate response using AI
      const response = await this.generateNLQResponse(query, intent, data);
      
      // Generate charts if requested
      let charts = undefined;
      if (context?.includeCharts && intent.requiresVisualization) {
        charts = await this.generateChartsForQuery(query, data);
      }

      return {
        response,
        charts,
        sources: ['analytics_aggregates', 'messages', 'contacts'],
        confidence: intent.confidence
      };

    } catch (error) {
      console.error('NLQ processing error:', error);
      return {
        response: "I'm sorry, I encountered an error processing your query. Please try rephrasing your question.",
        confidence: 0
      };
    }
  }

  async summarizeThread(
    threadId: string,
    mailboxId: string,
    organizationId: string
  ): Promise<{ summary: string; keyPoints: string[]; actionItems: string[] }> {
    try {
      // Get thread messages
      const thread = await this.prisma.thread.findUnique({
        where: {
          threadId_mailboxId: {
            threadId,
            mailboxId
          }
        },
        include: {
          messages: {
            orderBy: { receivedAt: 'asc' },
            select: {
              subject: true,
              fromEmail: true,
              fromName: true,
              snippet: true,
              receivedAt: true,
              hasAttachments: true
            }
          }
        }
      });

      if (!thread || !thread.messages.length) {
        throw new Error('Thread not found or has no messages');
      }

      // Prepare content for AI analysis
      const threadContent = thread.messages.map((msg, index) => 
        `Message ${index + 1} (${msg.receivedAt.toISOString()}):
From: ${msg.fromName || msg.fromEmail}
Subject: ${msg.subject || 'No subject'}
Content: ${msg.snippet}
${msg.hasAttachments ? '[Has attachments]' : ''}`
      ).join('\n\n');

      // Generate summary using AI
      const summaryResult = await this.openRouterClient.analyzeWithContext(
        threadContent,
        'summary'
      );

      return {
        summary: summaryResult.result.summary || 'No summary available',
        keyPoints: summaryResult.result.actionItems || [],
        actionItems: summaryResult.result.nextSteps || []
      };

    } catch (error) {
      console.error('Thread summarization error:', error);
      throw error;
    }
  }

  async analyzeMessage(
    messageId: string,
    analysisTypes: string[],
    organizationId: string
  ): Promise<Record<string, any>> {
    try {
      // Get message details
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: { mailbox: true }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      const results: Record<string, any> = {};

      // Prepare content for analysis
      const content = `Subject: ${message.subject || 'No subject'}
From: ${message.fromName || message.fromEmail}
Snippet: ${message.snippet || 'No content available'}
Labels: ${message.labels.join(', ')}
Received: ${message.receivedAt.toISOString()}
Important: ${message.isImportant ? 'Yes' : 'No'}`;

      // Perform each requested analysis
      for (const analysisType of analysisTypes) {
        try {
          const result = await this.openRouterClient.analyzeWithContext(
            content,
            analysisType
          );

          results[analysisType] = result.result;

          // Store analysis result in database
          await this.storeAnalysisResult(messageId, analysisType, result, organizationId);

        } catch (error) {
          console.error(`Analysis error for ${analysisType}:`, error);
          results[analysisType] = { error: 'Analysis failed' };
        }
      }

      return results;

    } catch (error) {
      console.error('Message analysis error:', error);
      throw error;
    }
  }

  async generateSmartReply(
    messageId: string,
    organizationId: string,
    options: { tone?: string; length?: string } = {}
  ): Promise<{ draft: string; suggestions: string[] }> {
    try {
      // Get the original message
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: { mailbox: true }
      });

      if (!message) {
        throw new Error('Message not found');
      }

      // Get recent conversation context
      const contextMessages = await this.prisma.message.findMany({
        where: {
          threadId: message.threadId,
          receivedAt: { lte: message.receivedAt }
        },
        orderBy: { receivedAt: 'desc' },
        take: 5,
        select: {
          fromEmail: true,
          fromName: true,
          subject: true,
          snippet: true,
          receivedAt: true
        }
      });

      // Prepare context for AI
      const context = contextMessages.reverse().map(msg => 
        `${msg.fromName || msg.fromEmail}: ${msg.snippet}`
      ).join('\n');

      // Generate smart reply
      const replyResult = await this.openRouterClient.analyzeWithContext(
        context,
        'smart_reply'
      );

      return {
        draft: replyResult.result.draft || 'No reply generated',
        suggestions: replyResult.result.suggestions || []
      };

    } catch (error) {
      console.error('Smart reply generation error:', error);
      throw error;
    }
  }

  async predictPriorities(
    messageIds: string[],
    organizationId: string
  ): Promise<Record<string, { priority: string; confidence: number; reasoning: string }>> {
    const results: Record<string, any> = {};

    for (const messageId of messageIds) {
      try {
        const analysis = await this.analyzeMessage(messageId, ['priority'], organizationId);
        results[messageId] = analysis.priority || {
          priority: 'medium',
          confidence: 0.5,
          reasoning: 'Unable to determine priority'
        };
      } catch (error) {
        results[messageId] = {
          priority: 'medium',
          confidence: 0.1,
          reasoning: 'Analysis failed'
        };
      }
    }

    return results;
  }

  async extractTasks(
    messageId: string,
    organizationId: string
  ): Promise<{ tasks: any[]; deadlines: string[]; assignments: string[] }> {
    try {
      const analysis = await this.analyzeMessage(messageId, ['task_extraction'], organizationId);
      return analysis.task_extraction || {
        tasks: [],
        deadlines: [],
        assignments: []
      };
    } catch (error) {
      console.error('Task extraction error:', error);
      throw error;
    }
  }

  async analyzeSentiment(
    messageIds: string[],
    organizationId: string
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const messageId of messageIds) {
      try {
        const analysis = await this.analyzeMessage(messageId, ['sentiment'], organizationId);
        results[messageId] = analysis.sentiment || {
          sentiment: 'neutral',
          confidence: 0.5
        };
      } catch (error) {
        results[messageId] = {
          sentiment: 'neutral',
          confidence: 0.1,
          error: 'Analysis failed'
        };
      }
    }

    return results;
  }

  async categorizeMessages(
    messageIds: string[],
    organizationId: string,
    customCategories?: string[]
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const messageId of messageIds) {
      try {
        const analysis = await this.analyzeMessage(messageId, ['categorization'], organizationId);
        results[messageId] = analysis.categorization || {
          category: 'general',
          confidence: 0.5
        };
      } catch (error) {
        results[messageId] = {
          category: 'general',
          confidence: 0.1,
          error: 'Analysis failed'
        };
      }
    }

    return results;
  }

  private async analyzeQueryIntent(query: string): Promise<{
    type: string;
    requiresVisualization: boolean;
    confidence: number;
    parameters: Record<string, any>;
  }> {
    const intentAnalysisPrompt = `Analyze this natural language query about email analytics and determine:
1. What type of analysis is being requested
2. Whether it requires data visualization
3. Confidence level (0-1)
4. Key parameters extracted

Query: "${query}"

Return JSON: {"type": "volume|response_time|contacts|sentiment|priority", "requiresVisualization": true/false, "confidence": 0.0-1.0, "parameters": {"timeframe": "7d|30d|90d", "metric": "specific_metric"}}`;

    try {
      const response = await this.openRouterClient.generateText(intentAnalysisPrompt, {
        temperature: 0.2,
        max_tokens: 300
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Intent analysis error:', error);
      return {
        type: 'general',
        requiresVisualization: false,
        confidence: 0.5,
        parameters: {}
      };
    }
  }

  private async getRelevantData(
    intent: any,
    organizationId: string,
    context?: NLQContext
  ): Promise<any> {
    // This would fetch relevant data based on the intent
    // For now, return mock data structure
    return {
      volume: { data: [], summary: {} },
      contacts: { data: [], summary: {} },
      responseTimes: { data: [], summary: {} }
    };
  }

  private async generateNLQResponse(
    query: string,
    intent: any,
    data: any
  ): Promise<string> {
    const systemPrompt = `You are an email analytics assistant. Provide clear, actionable insights based on the user's query and available data.

Be conversational but professional. Include specific numbers and trends when available. If the data is limited, explain what insights can be provided and suggest how to get better data.

Focus on business value and actionable recommendations.`;

    const userPrompt = `User Query: "${query}"

Intent: ${JSON.stringify(intent, null, 2)}

Available Data: ${JSON.stringify(data, null, 2)}

Provide a comprehensive response that answers the user's question with specific insights and recommendations.`;

    return await this.openRouterClient.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.7,
      max_tokens: 800
    });
  }

  private async generateChartsForQuery(
    query: string,
    data: any
  ): Promise<Array<{ type: string; data: any; title: string }> | undefined> {
    try {
      const chartData = await this.openRouterClient.generateChartData(query, data);
      return chartData ? [chartData] : undefined;
    } catch (error) {
      console.error('Chart generation error:', error);
      return undefined;
    }
  }

  private async storeAnalysisResult(
    messageId: string,
    analysisType: string,
    result: any,
    organizationId: string
  ): Promise<void> {
    try {
      const promptHash = await hashString(JSON.stringify(result));
      
      await this.prisma.aIAnalysis.create({
        data: {
          messageId,
          analysisType: analysisType as any,
          result: result.result,
          confidence: result.confidence,
          model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-nano-9b-v2:free',
          promptHash,
          processingTime: 0, // Would be calculated from actual timing
          message: {
            connect: { id: messageId }
          }
        }
      });

      // Also log the AI request
      await this.openRouterClient.logRequest(
        promptHash,
        process.env.OPENROUTER_MODEL || 'nvidia/nemotron-nano-9b-v2:free',
        result.tokensUsed || 0,
        result.cost || 0,
        result.responseTime || 0,
        true,
        organizationId
      );

    } catch (error) {
      console.error('Failed to store analysis result:', error);
    }
  }
}
