import * as nodemailer from 'nodemailer';
import crypto from 'crypto-js';

export interface EmailOptions {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
  metadata?: any;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private smtpConfig: SMTPConfig;

  constructor() {
    this.smtpConfig = this.getSMTPConfig();
    this.transporter = this.createTransporter();
  }

  private getSMTPConfig(): SMTPConfig {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      ...this.smtpConfig,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000,
      rateLimit: 5,
    });
  }

  /**
   * Send email with retry logic
   */
  async sendEmail(options: EmailOptions, maxRetries: number = 3): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Sending email attempt ${attempt}/${maxRetries} to ${options.to.join(', ')}`);

        const mailOptions = {
          from: {
            name: process.env.SMTP_FROM_NAME || 'Taskforce Mailer',
            address: this.smtpConfig.auth.user,
          },
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: this.processAttachments(options.attachments || []),
          headers: {
            'X-Mailer': 'Taskforce-Mailer/1.0',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'X-Organization': 'Taskforce',
            'X-Email-ID': this.generateEmailId(),
          },
        };

        const result = await this.transporter.sendMail(mailOptions);
        
        console.log(`✅ Email sent successfully: ${result.messageId}`);
        return true;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Email send attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(`❌ All email send attempts failed. Last error:`, lastError);
    throw lastError || new Error('Email sending failed after all retries');
  }

  /**
   * Process and validate attachments
   */
  private processAttachments(attachments: any[]): nodemailer.Attachment[] {
    return attachments.map((attachment, index) => {
      if (typeof attachment === 'string') {
        // File path
        return {
          filename: `attachment-${index + 1}`,
          path: attachment,
        };
      } else if (attachment.buffer) {
        // Buffer
        return {
          filename: attachment.filename || `attachment-${index + 1}`,
          content: attachment.buffer,
        };
      } else if (attachment.content) {
        // Content
        return {
          filename: attachment.filename || `attachment-${index + 1}`,
          content: attachment.content,
          contentType: attachment.contentType,
        };
      } else {
        throw new Error(`Invalid attachment format at index ${index}`);
      }
    });
  }

  /**
   * Generate unique email ID
   */
  private generateEmailId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `taskforce-${timestamp}-${random}`;
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const testOptions: EmailOptions = {
        to: [to],
        subject: 'Test Email from Taskforce Mailer',
        text: 'This is a test email to verify the email service is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Test Email from Taskforce Mailer</h2>
            <p>This is a test email to verify the email service is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Service:</strong> Taskforce Mailer Scheduling Service</p>
          </div>
        `,
      };

      return await this.sendEmail(testOptions);
    } catch (error) {
      console.error('❌ Test email failed:', error);
      return false;
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    const secret = process.env.ENCRYPTION_KEY || 'default-secret-key';
    return crypto.AES.encrypt(data, secret).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const secret = process.env.ENCRYPTION_KEY || 'default-secret-key';
    const bytes = crypto.AES.decrypt(encryptedData, secret);
    return bytes.toString(crypto.enc.Utf8);
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(): Promise<any> {
    try {
      // This would typically connect to your email provider's API
      // For now, return basic stats
      return {
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        lastSent: null,
      };
    } catch (error) {
      console.error('❌ Failed to get delivery stats:', error);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close transporter
   */
  async close(): Promise<void> {
    this.transporter.close();
  }
}
