import { getPrismaClient, type PrismaClient, type Mailbox, type Message, type Contact, type Thread, type User, type Organization, type Analytics, type Report } from '../lib/prisma';

// Types: Mailbox

export interface EmailMessage {
  messageId: string;
  threadId?: string;
  subject?: string;
  fromEmail: string;
  fromName?: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  receivedAt: Date;
  sentAt?: Date;
  size?: number;
  hasAttachments?: boolean;
  attachmentCount?: number;
  isRead?: boolean;
  isImportant?: boolean;
  labels?: string[];
  snippet?: string;
  bodyHash?: string;
}

export interface SyncResult {
  success: boolean;
  messagesProcessed: number;
  messagesAdded: number;
  messagesUpdated: number;
  errors: string[];
  nextCursor?: string;
}

export interface ConnectorConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected mailbox: Mailbox;

  constructor(config: ConnectorConfig, mailbox: Mailbox) {
    this.config = config;
    this.mailbox = mailbox;
  }

  abstract authenticate(): Promise<string>;
  abstract initialBackfill(cursor?: string): Promise<SyncResult>;
  abstract incrementalSync(cursor: string): Promise<SyncResult>;
  abstract subscribeWebhook(webhookUrl: string): Promise<boolean>;
  abstract unsubscribeWebhook(): Promise<boolean>;

  protected validateMessage(message: EmailMessage): boolean {
    return !!(
      message.messageId &&
      message.fromEmail &&
      message.toEmails.length > 0 &&
      message.receivedAt
    );
  }

  protected sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  protected extractDomain(email: string): string | null {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  }
}
