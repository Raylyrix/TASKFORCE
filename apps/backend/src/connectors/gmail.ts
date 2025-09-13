import { google } from 'googleapis';
import { BaseConnector, EmailMessage, SyncResult, ConnectorConfig } from './base';
import { Mailbox } from '@prisma/client';

export class GmailConnector extends BaseConnector {
  private gmail: any;
  private auth: any;

  constructor(config: ConnectorConfig, mailbox: Mailbox) {
    super(config, mailbox);
  }

  async authenticate(): Promise<string> {
    try {
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      // Get stored token from mailbox settings
      const token = this.mailbox.settings?.token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      oauth2Client.setCredentials(token);
      
      // Test authentication
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      this.auth = oauth2Client;

      // Verify token is still valid
      await this.gmail.users.getProfile({ userId: 'me' });
      
      return 'authenticated';
    } catch (error) {
      console.error('Gmail authentication failed:', error);
      throw new Error('Gmail authentication failed');
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

      let pageToken = cursor;
      let hasMore = true;
      const maxResults = 100;

      while (hasMore && result.messagesProcessed < 1000) { // Limit initial sync
        try {
          const listResponse = await this.gmail.users.messages.list({
            userId: 'me',
            maxResults,
            pageToken,
            q: 'in:inbox OR in:sent'
          });

          const messages = listResponse.data.messages || [];
          
          for (const messageRef of messages) {
            try {
              const messageDetail = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageRef.id,
                format: 'metadata',
                metadataHeaders: [
                  'From', 'To', 'Cc', 'Bcc', 'Subject', 'Date', 'Message-ID'
                ]
              });

              const emailMessage = this.parseGmailMessage(messageDetail.data);
              if (emailMessage && this.validateMessage(emailMessage)) {
                result.messagesProcessed++;
                // Message will be processed by the ingestion service
              }
            } catch (error) {
              result.errors.push(`Failed to fetch message ${messageRef.id}: ${error}`);
            }
          }

          pageToken = listResponse.data.nextPageToken;
          hasMore = !!pageToken;

        } catch (error) {
          result.errors.push(`Failed to list messages: ${error}`);
          hasMore = false;
        }
      }

      result.nextCursor = pageToken;
      return result;

    } catch (error) {
      console.error('Gmail initial backfill failed:', error);
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

      // Get messages since last sync
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        pageToken: cursor,
        q: `newer_than:1d` // Messages from last day
      });

      const messages = listResponse.data.messages || [];
      
      for (const messageRef of messages) {
        try {
          const messageDetail = await this.gmail.users.messages.get({
            userId: 'me',
            id: messageRef.id,
            format: 'metadata',
            metadataHeaders: [
              'From', 'To', 'Cc', 'Bcc', 'Subject', 'Date', 'Message-ID'
            ]
          });

          const emailMessage = this.parseGmailMessage(messageDetail.data);
          if (emailMessage && this.validateMessage(emailMessage)) {
            result.messagesProcessed++;
            // Message will be processed by the ingestion service
          }
        } catch (error) {
          result.errors.push(`Failed to fetch message ${messageRef.id}: ${error}`);
        }
      }

      result.nextCursor = listResponse.data.nextPageToken;
      return result;

    } catch (error) {
      console.error('Gmail incremental sync failed:', error);
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
      
      // Subscribe to Gmail push notifications
      await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: `projects/${this.config.clientId}/topics/gmail-push`,
          labelIds: ['INBOX', 'SENT'],
          labelFilterBehavior: 'include'
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe to Gmail webhooks:', error);
      return false;
    }
  }

  async unsubscribeWebhook(): Promise<boolean> {
    try {
      await this.authenticate();
      
      // Stop watching Gmail
      await this.gmail.users.stop({
        userId: 'me'
      });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from Gmail webhooks:', error);
      return false;
    }
  }

  private parseGmailMessage(gmailMessage: any): EmailMessage | null {
    try {
      const headers = gmailMessage.payload?.headers || [];
      const headerMap = new Map();
      
      headers.forEach((header: any) => {
        headerMap.set(header.name.toLowerCase(), header.value);
      });

      const from = headerMap.get('from') || '';
      const to = headerMap.get('to') || '';
      const cc = headerMap.get('cc') || '';
      const bcc = headerMap.get('bcc') || '';
      const subject = headerMap.get('subject') || '';
      const date = headerMap.get('date') || '';
      const messageId = headerMap.get('message-id') || '';

      // Parse date
      let receivedAt = new Date();
      try {
        receivedAt = new Date(date);
      } catch (error) {
        receivedAt = new Date(gmailMessage.internalDate);
      }

      // Extract email addresses
      const fromEmail = this.extractEmailAddress(from);
      const toEmails = this.parseEmailList(to);
      const ccEmails = cc ? this.parseEmailList(cc) : [];
      const bccEmails = bcc ? this.parseEmailList(bcc) : [];

      // Extract name from from field
      const fromName = this.extractNameFromField(from);

      // Check for attachments
      const hasAttachments = this.hasAttachments(gmailMessage.payload);
      const attachmentCount = this.countAttachments(gmailMessage.payload);

      // Get snippet
      const snippet = gmailMessage.snippet || '';

      // Check labels
      const labels = gmailMessage.labelIds || [];

      return {
        messageId: messageId.replace(/[<>]/g, ''),
        threadId: gmailMessage.threadId,
        subject,
        fromEmail: this.sanitizeEmail(fromEmail),
        fromName,
        toEmails: toEmails.map(this.sanitizeEmail),
        ccEmails: ccEmails.map(this.sanitizeEmail),
        bccEmails: bccEmails.map(this.sanitizeEmail),
        receivedAt,
        size: parseInt(gmailMessage.sizeEstimate) || 0,
        hasAttachments,
        attachmentCount,
        isRead: !labels.includes('UNREAD'),
        isImportant: labels.includes('IMPORTANT'),
        labels,
        snippet,
        bodyHash: this.generateBodyHash(gmailMessage.payload)
      };

    } catch (error) {
      console.error('Failed to parse Gmail message:', error);
      return null;
    }
  }

  private extractEmailAddress(field: string): string {
    const emailMatch = field.match(/<(.+?)>/) || field.match(/([^\s<>]+@[^\s<>]+)/);
    return emailMatch ? emailMatch[1] : field.trim();
  }

  private parseEmailList(field: string): string[] {
    if (!field) return [];
    
    // Split by comma and extract emails
    return field.split(',')
      .map(email => this.extractEmailAddress(email.trim()))
      .filter(email => email.includes('@'));
  }

  private extractNameFromField(field: string): string | undefined {
    const nameMatch = field.match(/^(.+?)\s*<.+>$/);
    return nameMatch ? nameMatch[1].trim().replace(/"/g, '') : undefined;
  }

  private hasAttachments(payload: any): boolean {
    if (!payload.parts) return false;
    
    return payload.parts.some((part: any) => 
      part.filename || 
      part.mimeType?.includes('attachment') ||
      part.headers?.some((h: any) => h.name?.toLowerCase() === 'content-disposition')
    );
  }

  private countAttachments(payload: any): number {
    if (!payload.parts) return 0;
    
    return payload.parts.filter((part: any) => 
      part.filename || 
      part.mimeType?.includes('attachment') ||
      part.headers?.some((h: any) => h.name?.toLowerCase() === 'content-disposition')
    ).length;
  }

  private generateBodyHash(payload: any): string {
    // Generate a hash based on payload structure for deduplication
    const bodyContent = JSON.stringify(payload.body);
    // In a real implementation, you'd use crypto.createHash
    return Buffer.from(bodyContent).toString('base64').slice(0, 32);
  }
}
