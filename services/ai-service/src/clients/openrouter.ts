import axios from 'axios';
import { hashString } from '@taskforce/shared';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-nano-9b-v2:free';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not found. AI features will be limited.');
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }

  async chatCompletion(
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
    } = {}
  ): Promise<OpenRouterResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const {
      model = this.defaultModel,
      temperature = 0.7,
      max_tokens = 1000,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0
    } = options;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens,
          top_p,
          frequency_penalty,
          presence_penalty,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://taskforce-analytics.com',
            'X-Title': 'Taskforce Analytics Platform'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(`OpenRouter API call failed: ${error}`);
    }
  }

  async generateText(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    const { systemPrompt, ...chatOptions } = options;
    
    const messages: OpenRouterMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.chatCompletion(messages, chatOptions);
    
    return response.choices[0]?.message?.content || '';
  }

  async analyzeWithContext(
    content: string,
    analysisType: string,
    context?: string
  ): Promise<{
    result: any;
    confidence: number;
    reasoning: string;
  }> {
    const systemPrompt = this.getSystemPromptForAnalysis(analysisType);
    
    const userPrompt = context 
      ? `Context: ${context}\n\nContent to analyze: ${content}`
      : `Content to analyze: ${content}`;

    const response = await this.generateText(userPrompt, {
      systemPrompt,
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 500
    });

    // Parse the response to extract structured data
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return {
        result: parsed,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || response
      };
    } catch {
      // If not JSON, return as text analysis
      return {
        result: { analysis: response },
        confidence: 0.7,
        reasoning: response
      };
    }
  }

  async generateChartData(
    query: string,
    context: any
  ): Promise<{
    chartType: string;
    data: any;
    title: string;
    description: string;
  } | null> {
    const systemPrompt = `You are a data visualization expert. Given a natural language query about email analytics, generate appropriate chart data.

Return a JSON response with:
- chartType: "line", "bar", "pie", "scatter", or "area"
- data: the data array for the chart
- title: descriptive title for the chart
- description: brief explanation of what the chart shows

Available data context: ${JSON.stringify(context, null, 2)}

Focus on creating meaningful visualizations that answer the user's question.`;

    try {
      const response = await this.generateText(query, {
        systemPrompt,
        temperature: 0.2,
        max_tokens: 800
      });

      const parsed = JSON.parse(response);
      
      if (parsed.chartType && parsed.data && parsed.title) {
        return parsed;
      }
    } catch (error) {
      console.error('Failed to generate chart data:', error);
    }

    return null;
  }

  private getSystemPromptForAnalysis(analysisType: string): string {
    const prompts = {
      priority: `You are an email prioritization expert. Analyze emails and assign priority levels (high, medium, low) based on:
- Sender importance and relationship
- Subject urgency indicators
- Content urgency and deadlines
- Action items and requests

Return JSON: {"priority": "high|medium|low", "confidence": 0.0-1.0, "reasoning": "explanation", "factors": ["factor1", "factor2"]}`,

      sentiment: `You are a sentiment analysis expert. Analyze email tone and sentiment:
- Overall sentiment: positive, negative, neutral
- Emotional indicators
- Urgency level
- Professional vs casual tone

Return JSON: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "emotions": ["emotion1"], "urgency": "high|medium|low", "tone": "professional|casual|formal"}`,

      summary: `You are an email summarization expert. Create concise, actionable summaries:
- Key points and main topics
- Action items and deadlines
- Decisions made
- Next steps

Return JSON: {"summary": "main points", "actionItems": ["item1"], "deadlines": ["deadline1"], "decisions": ["decision1"], "nextSteps": ["step1"]}`,

      categorization: `You are an email categorization expert. Classify emails into business categories:
- Finance, HR, Legal, Sales, Marketing, Support, Operations, etc.
- Project-specific categories
- Urgency levels
- Action required

Return JSON: {"category": "primary_category", "subcategories": ["sub1"], "urgency": "high|medium|low", "actionRequired": true/false, "confidence": 0.0-1.0}`,

      task_extraction: `You are a task extraction expert. Identify actionable items from emails:
- Specific tasks and assignments
- Deadlines and due dates
- Dependencies
- Responsible parties
- Priority levels

Return JSON: {"tasks": [{"description": "task", "assignee": "person", "deadline": "date", "priority": "high|medium|low", "dependencies": ["task2"]}], "deadlines": ["date1"], "assignments": ["person1"]}`,

      smart_reply: `You are a professional email assistant. Generate appropriate email replies:
- Professional and courteous tone
- Address all points in original email
- Suggest next steps
- Maintain business relationships

Return JSON: {"draft": "reply content", "tone": "professional|friendly|formal", "keyPoints": ["point1"], "suggestions": ["suggestion1"]}`
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.summary;
  }

  async logRequest(
    promptHash: string,
    model: string,
    tokensUsed: number,
    cost: number,
    responseTime: number,
    success: boolean,
    organizationId: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      // This would typically save to a database
      // For now, we'll just log it
      console.log('📊 AI Request Logged:', {
        promptHash,
        model,
        tokensUsed,
        cost,
        responseTime,
        success,
        organizationId,
        errorMessage
      });
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }
  }

  calculateCost(tokensUsed: number, model: string): number {
    // Simplified cost calculation - in production, you'd use actual pricing
    const pricing = {
      'nvidia/nemotron-nano-9b-v2:free': 0, // Free model
      'openai/gpt-4': 0.03, // $0.03 per 1K tokens
      'anthropic/claude-3-sonnet': 0.015,
      'meta-llama/llama-2-70b-chat': 0.0009
    };

    const pricePer1K = pricing[model as keyof typeof pricing] || 0.001;
    return (tokensUsed / 1000) * pricePer1K;
  }
}
