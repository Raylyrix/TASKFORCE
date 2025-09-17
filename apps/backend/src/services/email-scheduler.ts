import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { supabase, ScheduledEmail } from '../config/supabase';
import { EmailService } from './email-service';
import crypto from 'crypto-js';

export class EmailScheduler {
  private queue: Queue;
  private worker: Worker;
  private redis: IORedis;
  private emailService: EmailService;

  constructor() {
    // Redis connection
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // BullMQ Queue
    this.queue = new Queue('email-scheduler', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Email service
    this.emailService = new EmailService();

    // Worker to process jobs
    this.worker = new Worker(
      'email-scheduler',
      this.processEmailJob.bind(this),
      {
        connection: this.redis,
        concurrency: 10,
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`✅ Email job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Email job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('❌ Email worker error:', err);
    });

    this.queue.on('error', (err) => {
      console.error('❌ Email queue error:', err);
    });
  }

  /**
   * Schedule an email for future delivery
   */
  async scheduleEmail(emailData: Omit<ScheduledEmail, 'id' | 'created_at' | 'updated_at' | 'status' | 'retry_count'>): Promise<string> {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('scheduled_emails')
        .insert([{
          ...emailData,
          status: 'pending',
          retry_count: 0,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create scheduled email: ${error.message}`);
      }

      const emailId = data.id;

      // Calculate delay until scheduled time
      const scheduledAt = new Date(emailData.scheduled_at);
      const now = new Date();
      const delay = Math.max(0, scheduledAt.getTime() - now.getTime());

      // Add job to BullMQ queue
      const job = await this.queue.add(
        'send-email',
        {
          emailId,
          userId: emailData.user_id,
          organizationId: emailData.organization_id,
        },
        {
          delay,
          jobId: emailId, // Use email ID as job ID for idempotency
        }
      );

      console.log(`📧 Email scheduled for ${scheduledAt.toISOString()}, job ID: ${job.id}`);

      return emailId;
    } catch (error) {
      console.error('❌ Failed to schedule email:', error);
      throw error;
    }
  }

  /**
   * Process email job
   */
  private async processEmailJob(job: Job) {
    const { emailId, userId, organizationId } = job.data;

    try {
      // Get email data from Supabase
      const { data: emailData, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (error || !emailData) {
        throw new Error(`Email not found: ${error?.message || 'Unknown error'}`);
      }

      // Check if email is still pending
      if (emailData.status !== 'pending') {
        console.log(`⚠️ Email ${emailId} is no longer pending (status: ${emailData.status})`);
        return;
      }

      // Update status to processing
      await this.updateEmailStatus(emailId, 'processing');

      // Send the email
      const result = await this.emailService.sendEmail({
        to: emailData.recipients,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.html_body,
        attachments: emailData.attachments,
        metadata: emailData.metadata,
      });

      // Update status to sent
      await this.updateEmailStatus(emailId, 'sent', null, new Date().toISOString());

      console.log(`✅ Email ${emailId} sent successfully`);

    } catch (error) {
      console.error(`❌ Failed to process email ${emailId}:`, error);

      // Update retry count
      const { data: emailData } = await supabase
        .from('scheduled_emails')
        .select('retry_count, max_retries')
        .eq('id', emailId)
        .single();

      if (emailData) {
        const newRetryCount = (emailData.retry_count || 0) + 1;
        
        if (newRetryCount >= (emailData.max_retries || 3)) {
          // Max retries reached, mark as failed
          await this.updateEmailStatus(
            emailId, 
            'failed', 
            error instanceof Error ? error.message : 'Unknown error'
          );
        } else {
          // Update retry count and reschedule
          await supabase
            .from('scheduled_emails')
            .update({ 
              retry_count: newRetryCount,
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', emailId);

          // Reschedule with exponential backoff
          const delay = Math.pow(2, newRetryCount) * 60000; // 2^n minutes
          await this.queue.add(
            'send-email',
            { emailId, userId, organizationId },
            {
              delay,
              jobId: `${emailId}-retry-${newRetryCount}`,
            }
          );
        }
      }
    }
  }

  /**
   * Update email status in Supabase
   */
  private async updateEmailStatus(
    emailId: string, 
    status: string, 
    errorMessage?: string | null, 
    sentAt?: string | null
  ) {
    const { error } = await supabase
      .from('scheduled_emails')
      .update({
        status,
        error_message: errorMessage,
        sent_at: sentAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    if (error) {
      console.error(`❌ Failed to update email status: ${error.message}`);
    }
  }

  /**
   * Get email status
   */
  async getEmailStatus(emailId: string): Promise<ScheduledEmail | null> {
    const { data, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (error) {
      console.error(`❌ Failed to get email status: ${error.message}`);
      return null;
    }

    return data;
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<boolean> {
    try {
      // Update status in Supabase
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailId)
        .eq('status', 'pending'); // Only cancel pending emails

      if (updateError) {
        throw new Error(`Failed to cancel email: ${updateError.message}`);
      }

      // Remove job from queue
      const jobs = await this.queue.getJobs(['waiting', 'delayed', 'active']);
      for (const job of jobs) {
        if (job.data.emailId === emailId) {
          await job.remove();
        }
      }

      console.log(`✅ Email ${emailId} cancelled successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to cancel email ${emailId}:`, error);
      return false;
    }
  }

  /**
   * Get pending emails for processing (for manual processing if needed)
   */
  async getPendingEmails(): Promise<ScheduledEmail[]> {
    const { data, error } = await supabase
      .rpc('get_pending_emails');

    if (error) {
      console.error(`❌ Failed to get pending emails: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs() {
    try {
      // Remove completed jobs older than 7 days
      await this.queue.clean(7 * 24 * 60 * 60 * 1000, 100, 'completed');
      
      // Remove failed jobs older than 30 days
      await this.queue.clean(30 * 24 * 60 * 60 * 1000, 50, 'failed');
      
      console.log('✅ Cleaned up old jobs');
    } catch (error) {
      console.error('❌ Failed to cleanup old jobs:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down email scheduler...');
    
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
    
    console.log('✅ Email scheduler shutdown complete');
  }
}
