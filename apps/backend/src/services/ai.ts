import axios from 'axios';
import { createApiResponse } from '@taskforce/shared';

export class AIService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:4001';
  }

  async processNaturalLanguageQuery(
    query: string,
    organizationId: string,
    context?: any
  ): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/query`, {
        query,
        context
      });

      return response.data;
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('AI service unavailable');
    }
  }

  async summarizeThread(threadId: string, mailboxId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/summarize`, {
        threadId,
        mailboxId
      });

      return response.data;
    } catch (error) {
      console.error('AI summarization error:', error);
      throw new Error('AI summarization failed');
    }
  }

  async analyzeMessage(messageId: string, analysisTypes: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/analyze`, {
        messageId,
        analysisTypes
      });

      return response.data;
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('AI analysis failed');
    }
  }

  async generateSmartReply(messageId: string, options?: any): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/draft`, {
        messageId,
        ...options
      });

      return response.data;
    } catch (error) {
      console.error('AI draft generation error:', error);
      throw new Error('AI draft generation failed');
    }
  }

  async predictPriorities(messageIds: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/priority`, {
        messageIds
      });

      return response.data;
    } catch (error) {
      console.error('AI priority prediction error:', error);
      throw new Error('AI priority prediction failed');
    }
  }

  async extractTasks(messageId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/extract-tasks`, {
        messageId
      });

      return response.data;
    } catch (error) {
      console.error('AI task extraction error:', error);
      throw new Error('AI task extraction failed');
    }
  }

  async analyzeSentiment(messageIds: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/sentiment`, {
        messageIds
      });

      return response.data;
    } catch (error) {
      console.error('AI sentiment analysis error:', error);
      throw new Error('AI sentiment analysis failed');
    }
  }

  async categorizeMessages(messageIds: string[], categories?: string[]): Promise<any> {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/categorize`, {
        messageIds,
        categories
      });

      return response.data;
    } catch (error) {
      console.error('AI categorization error:', error);
      throw new Error('AI categorization failed');
    }
  }
}
