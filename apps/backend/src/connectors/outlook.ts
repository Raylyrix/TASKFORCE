import axios from 'axios';
import { BaseConnector, EmailMessage, SyncResult, ConnectorConfig } from './base';
import { getPrismaClient, type PrismaClient, type Mailbox, type Message, type Contact, type Thread, type User, type Organization, type Analytics, type Report } from '../lib/prisma';

// Types: Mailbox

interface OutlookMessage {
  id: string;
  subject: string;
  from: { emailAddress: { address: string; name?: string } };
  toRecipients: Array<{ emailAddress: { address: string; name?: string } }>;
  ccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  bccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
  receivedDateTime: string;
  sentDateTime?: string;
  size: number;
  hasAttachments: boolean;
  isRead: boolean;
  importance: string;
  bodyPreview: string;
  internetMessageId?: string;
  conversationId?: string;
}

export class OutlookConnector extends BaseConnector {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(config: ConnectorConfig, mailbox: Mailbox) {
    super(config, mailbox);
  }

  async authenticate(): Promise<string> {
    try {
      // Get stored token from mailbox settings
      const token = (this.mailbox.settings as any)?.token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.accessToken = token;

      // Test authentication by getting user profile
      const response = await axios.get(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        return 'authenticated';
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Outlook authentication failed:', error);
      throw new Error('Outlook authentication failed');
    }
  }

  async initialBackfill(cursor?: string): Promise<SyncResult> {
    try {
      await this.authenticate();
      
      const result: SyncResult = {
        success: true,
        messagesProcessed: 0,
        messagesAdded: 0,
        messagesUpdated: 0,
        errors: []
      };

      let nextLink = cursor;
      const pageSize = 100;

      while (nextLink && result.messagesProcessed < 1000) { // Limit initial sync
        try {
          const url = nextLink || `${this.baseUrl}/me/messages?$top=${pageSize}&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,size,hasAttachments,isRead,importance,bodyPreview,internetMessageId,conversationId`;
          
          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          const messages = response.data.value || [];
          
          for (const message of messages) {
            try {
              const emailMessage = this.parseOutlookMessage(message);
              if (emailMessage && this.validateMessage(emailMessage)) {
                result.messagesProcessed++;
                // Message will be processed by the ingestion service
              }
            } catch (error) {
              result.errors.push(`Failed to parse message ${message.id}: ${error}`);
            }
          }

          nextLink = response.data['@odata.nextLink'];

        } catch (error) {
          result.errors.push(`Failed to fetch messages: ${error}`);
          nextLink = null;
        }
      }

      result.nextCursor = nextLink;
      return result;

    } catch (error) {
      console.error('Outlook initial backfill failed:', error);
      return {
        success: false,
        messagesProcessed: 0,
        messagesAdded: 0,
        messagesUpdated: 0,
        errors: [`Initial backfill failed: ${error}`]
      };
    }
  }

  async incrementalSync(cursor: string): Promise<SyncResult> {
    try {
      await this.authenticate();
      
      const result: SyncResult = {
        success: true,
        messagesProcessed: 0,
        messagesAdded: 0,
        messagesUpdated: 0,
        errors: []
      };

      // Get messages since last sync (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const filterDate = yesterday.toISOString();

      const url = `${this.baseUrl}/me/messages?$filter=receivedDateTime ge ${filterDate}&$top=100&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,size,hasAttachments,isRead,importance,bodyPreview,internetMessageId,conversationId`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const messages = response.data.value || [];
      
      for (const message of messages) {
        try {
          const emailMessage = this.parseOutlookMessage(message);
          if (emailMessage && this.validateMessage(emailMessage)) {
            result.messagesProcessed++;
            // Message will be processed by the ingestion service
          }
        } catch (error) {
          result.errors.push(`Failed to parse message ${message.id}: ${error}`);
        }
      }

      result.nextCursor = response.data['@odata.nextLink'];
      return result;

    } catch (error) {
      console.error('Outlook incremental sync failed:', error);
      return {
        success: false,
        messagesProcessed: 0,
        messagesAdded: 0,
        messagesUpdated: 0,
        errors: [`Incremental sync failed: ${error}`]
      };
    }
  }

  async subscribeWebhook(webhookUrl: string): Promise<boolean> {
    try {
      await this.authenticate();
      
      // Subscribe to Microsoft Graph webhooks
      const subscription = {
        changeType: 'created,updated,deleted',
        notificationUrl: webhookUrl,
        resource: 'me/messages',
        expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        clientState: this.mailbox.id
      };

      const response = await axios.post(`${this.baseUrl}/subscriptions`, subscription, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.status === 201;
    } catch (error) {
      console.error('Failed to subscribe to Outlook webhooks:', error);
      return false;
    }
  }

  async unsubscribeWebhook(): Promise<boolean> {
    try {
      await this.authenticate();
      
      // Get existing subscriptions
      const response = await axios.get(`${this.baseUrl}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const subscriptions = response.data.value || [];
      
      // Delete subscriptions for this mailbox
      for (const subscription of subscriptions) {
        if (subscription.clientState === this.mailbox.id) {
          await axios.delete(`${this.baseUrl}/subscriptions/${subscription.id}`, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from Outlook webhooks:', error);
      return false;
    }
  }

  private parseOutlookMessage(outlookMessage: OutlookMessage): EmailMessage | null {
    try {
      const fromEmail = outlookMessage.from?.emailAddress?.address || '';
      const fromName = outlookMessage.from?.emailAddress?.name;
      
      const toEmails = outlookMessage.toRecipients?.map(r => r.emailAddress.address) || [];
      const ccEmails = outlookMessage.ccRecipients?.map(r => r.emailAddress.address) || [];
      const bccEmails = outlookMessage.bccRecipients?.map(r => r.emailAddress.address) || [];

      const receivedAt = new Date(outlookMessage.receivedDateTime);
      const sentAt = outlookMessage.sentDateTime ? new Date(outlookMessage.sentDateTime) : undefined;

      return {
        messageId: outlookMessage.internetMessageId || outlookMessage.id,
        threadId: outlookMessage.conversationId,
        subject: outlookMessage.subject,
        fromEmail: this.sanitizeEmail(fromEmail),
        fromName,
        toEmails: toEmails.map(this.sanitizeEmail),
        ccEmails: ccEmails.map(this.sanitizeEmail),
        bccEmails: bccEmails.map(this.sanitizeEmail),
        receivedAt,
        sentAt,
        size: outlookMessage.size,
        hasAttachments: outlookMessage.hasAttachments,
        isRead: outlookMessage.isRead,
        isImportant: outlookMessage.importance === 'high',
        snippet: outlookMessage.bodyPreview,
        bodyHash: this.generateBodyHash(outlookMessage)
      };

    } catch (error) {
      console.error('Failed to parse Outlook message:', error);
      return null;
    }
  }

  private generateBodyHash(message: OutlookMessage): string {
    // Generate a hash based on message structure for deduplication
    const content = JSON.stringify({
      id: message.id,
      subject: message.subject,
      bodyPreview: message.bodyPreview
    });
    return Buffer.from(content).toString('base64').slice(0, 32);
  }
}
