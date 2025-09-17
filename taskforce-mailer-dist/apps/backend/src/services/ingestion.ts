import { PrismaClient, Mailbox, Message, Contact, Thread } from '@prisma/client';
import { GmailConnector } from '../connectors/gmail';
import { OutlookConnector } from '../connectors/outlook';
import { BaseConnector, EmailMessage } from '../connectors/base';
// import { hashString, extractDomain, isInternalDomain } from '@taskforce/shared';
// Temporary local implementations
function hashString(str: string) { return str; }
function extractDomain(email: string) { return email.split('@')[1] || null; }
function isInternalDomain(email: string, domains: string[]) { return domains.includes(extractDomain(email) || ''); }

export class IngestionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async syncMailbox(mailboxId: string, isInitial = false): Promise<void> {
    try {
      const mailbox = await this.prisma.mailbox.findUnique({
        where: { id: mailboxId },
        include: { organization: true }
      });

      if (!mailbox) {
        throw new Error(`Mailbox ${mailboxId} not found`);
      }

      const connector = this.createConnector(mailbox);
      if (!connector) {
        throw new Error(`Unsupported email provider: ${mailbox.provider}`);
      }

      // Authenticate with the provider
      await connector.authenticate();

      let syncResult;
      if (isInitial) {
        syncResult = await connector.initialBackfill(mailbox.syncCursor || undefined);
      } else {
        syncResult = await connector.incrementalSync(mailbox.syncCursor || '');
      }

      if (syncResult.success) {
        // Process messages
        const processedMessages = await this.processMessages(syncResult.messages, mailbox);
        
        // Update mailbox sync cursor
        await this.prisma.mailbox.update({
          where: { id: mailboxId },
          data: {
            lastSyncAt: new Date(),
            syncCursor: syncResult.nextCursor
          }
        });

        console.log(`✅ Synced mailbox ${mailbox.email}: ${processedMessages.length} messages processed`);
      } else {
        console.error(`❌ Failed to sync mailbox ${mailbox.email}:`, syncResult.errors);
      }

    } catch (error) {
      console.error(`❌ Error syncing mailbox ${mailboxId}:`, error);
      throw error;
    }
  }

  async processMessages(messages: EmailMessage[], mailbox: Mailbox): Promise<Message[]> {
    const processedMessages: Message[] = [];

    for (const messageData of messages) {
      try {
        // Upsert message
        const message = await this.upsertMessage(messageData, mailbox);
        processedMessages.push(message);

        // Upsert contacts
        await this.upsertContacts(messageData, mailbox);

        // Upsert thread
        if (messageData.threadId) {
          await this.upsertThread(messageData, mailbox);
        }

      } catch (error) {
        console.error(`Failed to process message ${messageData.messageId}:`, error);
      }
    }

    return processedMessages;
  }

  private async upsertMessage(messageData: EmailMessage, mailbox: Mailbox): Promise<Message> {
    const existingMessage = await this.prisma.message.findUnique({
      where: {
        messageId_mailboxId: {
          messageId: messageData.messageId,
          mailboxId: mailbox.id
        }
      }
    });

    const messagePayload = {
      messageId: messageData.messageId,
      threadId: messageData.threadId,
      subject: messageData.subject,
      fromEmail: messageData.fromEmail,
      fromName: messageData.fromName,
      toEmails: messageData.toEmails,
      ccEmails: messageData.ccEmails || [],
      bccEmails: messageData.bccEmails || [],
      receivedAt: messageData.receivedAt,
      sentAt: messageData.sentAt,
      size: messageData.size,
      hasAttachments: messageData.hasAttachments || false,
      attachmentCount: messageData.attachmentCount || 0,
      isRead: messageData.isRead || false,
      isImportant: messageData.isImportant || false,
      labels: messageData.labels || [],
      snippet: messageData.snippet,
      bodyHash: messageData.bodyHash,
      mailboxId: mailbox.id
    };

    if (existingMessage) {
      return await this.prisma.message.update({
        where: { id: existingMessage.id },
        data: {
          ...messagePayload,
          updatedAt: new Date()
        }
      });
    } else {
      return await this.prisma.message.create({
        data: messagePayload
      });
    }
  }

  private async upsertContacts(messageData: EmailMessage, mailbox: Mailbox): Promise<void> {
    const allEmails = [
      messageData.fromEmail,
      ...messageData.toEmails,
      ...(messageData.ccEmails || []),
      ...(messageData.bccEmails || [])
    ].filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates

    const organization = await this.prisma.organization.findUnique({
      where: { id: mailbox.organizationId }
    });

    const internalDomains = (organization?.settings as any)?.internalDomains as string[] || [];

    for (const email of allEmails) {
      try {
        const domain = extractDomain(email);
        const isInternal = isInternalDomain(email, internalDomains);

        await this.prisma.contact.upsert({
          where: {
            email_mailboxId: {
              email,
              mailboxId: mailbox.id
            }
          },
          update: {
            lastContactAt: messageData.receivedAt,
            contactCount: {
              increment: 1
            }
          },
          create: {
            email,
            name: email === messageData.fromEmail ? messageData.fromName : undefined,
            domain,
            isInternal,
            lastContactAt: messageData.receivedAt,
            contactCount: 1,
            mailboxId: mailbox.id
          }
        });
      } catch (error) {
        console.error(`Failed to upsert contact ${email}:`, error);
      }
    }
  }

  private async upsertThread(messageData: EmailMessage, mailbox: Mailbox): Promise<void> {
    if (!messageData.threadId) return;

    try {
      const existingThread = await this.prisma.thread.findUnique({
        where: {
          threadId_mailboxId: {
            threadId: messageData.threadId,
            mailboxId: mailbox.id
          }
        }
      });

      const threadPayload = {
        threadId: messageData.threadId,
        subject: messageData.subject,
        lastMessageAt: messageData.receivedAt,
        mailboxId: mailbox.id
      };

      if (existingThread) {
        await this.prisma.thread.update({
          where: { id: existingThread.id },
          data: {
            ...threadPayload,
            messageCount: {
              increment: 1
            },
            updatedAt: new Date()
          }
        });
      } else {
        await this.prisma.thread.create({
          data: {
            ...threadPayload,
            messageCount: 1
          }
        });
      }
    } catch (error) {
      console.error(`Failed to upsert thread ${messageData.threadId}:`, error);
    }
  }

  private createConnector(mailbox: Mailbox): BaseConnector | null {
    const config = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || '',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    };

    switch (mailbox.provider) {
      case 'GMAIL':
        return new GmailConnector(config, mailbox);
      case 'OUTLOOK':
        return new OutlookConnector(config, mailbox);
      default:
        return null;
    }
  }

  async handleWebhook(provider: string, payload: any): Promise<void> {
    try {
      // Process webhook based on provider
      switch (provider) {
        case 'gmail':
          await this.handleGmailWebhook(payload);
          break;
        case 'outlook':
          await this.handleOutlookWebhook(payload);
          break;
        default:
          console.warn(`Unknown webhook provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to handle ${provider} webhook:`, error);
      throw error;
    }
  }

  private async handleGmailWebhook(payload: any): Promise<void> {
    // Gmail push notifications contain mailbox info
    // Trigger incremental sync for the affected mailbox
    const mailboxId = payload.mailboxId; // This would be extracted from the webhook
    if (mailboxId) {
      await this.syncMailbox(mailboxId, false);
    }
  }

  private async handleOutlookWebhook(payload: any): Promise<void> {
    // Microsoft Graph webhooks contain subscription info
    // Trigger incremental sync for the affected mailbox
    const subscriptionId = payload.subscriptionId;
    if (subscriptionId) {
      // Find mailbox by subscription ID and sync
      const mailbox = await this.prisma.mailbox.findFirst({
        where: {
          settings: {
            path: ['subscriptionId'],
            equals: subscriptionId
          }
        }
      });

      if (mailbox) {
        await this.syncMailbox(mailbox.id, false);
      }
    }
  }

  async calculateResponseTimes(mailboxId: string): Promise<void> {
    try {
      // Get all threads for the mailbox
      const threads = await this.prisma.thread.findMany({
        where: { mailboxId },
        include: {
          messages: {
            orderBy: { receivedAt: 'asc' }
          }
        }
      });

      for (const thread of threads) {
        if (thread.messages.length < 2) continue;

        let responseTimeSum = 0;
        let responseCount = 0;

        for (let i = 1; i < thread.messages.length; i++) {
          const prevMessage = thread.messages[i - 1];
          const currentMessage = thread.messages[i];

          // Calculate response time if this looks like a reply
          if (this.isReply(prevMessage, currentMessage)) {
            const responseTime = Math.floor(
              (currentMessage.receivedAt.getTime() - prevMessage.receivedAt.getTime()) / (1000 * 60)
            );
            responseTimeSum += responseTime;
            responseCount++;
          }
        }

        if (responseCount > 0) {
          const avgResponseTime = Math.floor(responseTimeSum / responseCount);
          
          await this.prisma.thread.update({
            where: { id: thread.id },
            data: { responseTime: avgResponseTime }
          });
        }
      }

      console.log(`✅ Calculated response times for ${threads.length} threads in mailbox ${mailboxId}`);
    } catch (error) {
      console.error(`Failed to calculate response times for mailbox ${mailboxId}:`, error);
    }
  }

  private isReply(prevMessage: Message, currentMessage: Message): boolean {
    // Simple heuristic: if the sender changed, it's likely a reply
    return prevMessage.fromEmail !== currentMessage.fromEmail;
  }
}
