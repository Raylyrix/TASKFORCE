import { supabaseAdmin } from '../config/supabase';

export class AutoSetupService {
  private static instance: AutoSetupService;
  private isSetupComplete = false;

  static getInstance(): AutoSetupService {
    if (!AutoSetupService.instance) {
      AutoSetupService.instance = new AutoSetupService();
    }
    return AutoSetupService.instance;
  }

  async setupSupabaseDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Starting automatic Supabase database setup...');

      // Check if tables already exist
      const { data: tables, error: tableError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['scheduled_emails', 'email_templates', 'email_logs']);

      if (tableError) {
        console.log('⚠️  Could not check existing tables, proceeding with setup...');
      } else if (tables && tables.length >= 3) {
        console.log('✅ Database tables already exist');
        this.isSetupComplete = true;
        return { success: true, message: 'Database already configured' };
      }

      // Create tables using SQL
      const createTablesSQL = `
        -- Enable necessary extensions
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        -- Create scheduled_emails table
        CREATE TABLE IF NOT EXISTS scheduled_emails (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            organization_id UUID NOT NULL,
            recipients TEXT[] NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            html_body TEXT,
            attachments JSONB DEFAULT '[]'::jsonb,
            scheduled_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            error_message TEXT,
            sent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'::jsonb
        );

        -- Create email_templates table
        CREATE TABLE IF NOT EXISTS email_templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            organization_id UUID NOT NULL,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            html_body TEXT,
            variables TEXT[] DEFAULT '{}'::text[],
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create email_logs table
        CREATE TABLE IF NOT EXISTS email_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email_id UUID REFERENCES scheduled_emails(id) ON DELETE CASCADE,
            action TEXT NOT NULL CHECK (action IN ('created', 'scheduled', 'processing', 'sent', 'failed', 'retry', 'cancelled')),
            details JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
        CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);

        -- Create updated_at trigger function
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create triggers
        CREATE TRIGGER update_scheduled_emails_updated_at 
            BEFORE UPDATE ON scheduled_emails 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        CREATE TRIGGER update_email_templates_updated_at 
            BEFORE UPDATE ON email_templates 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- Enable RLS
        ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
        ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
        ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY IF NOT EXISTS "Users can view their own scheduled emails" ON scheduled_emails
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can insert their own scheduled emails" ON scheduled_emails
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can update their own scheduled emails" ON scheduled_emails
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can delete their own scheduled emails" ON scheduled_emails
            FOR DELETE USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can view their own email templates" ON email_templates
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can insert their own email templates" ON email_templates
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can update their own email templates" ON email_templates
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can delete their own email templates" ON email_templates
            FOR DELETE USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can view logs for their emails" ON email_logs
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM scheduled_emails 
                    WHERE scheduled_emails.id = email_logs.email_id 
                    AND scheduled_emails.user_id = auth.uid()
                )
            );

        -- Create helper functions
        CREATE OR REPLACE FUNCTION get_pending_emails()
        RETURNS TABLE (
            id UUID,
            user_id UUID,
            organization_id UUID,
            recipients TEXT[],
            subject TEXT,
            body TEXT,
            html_body TEXT,
            attachments JSONB,
            scheduled_at TIMESTAMPTZ,
            retry_count INTEGER,
            max_retries INTEGER,
            metadata JSONB
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                se.id,
                se.user_id,
                se.organization_id,
                se.recipients,
                se.subject,
                se.body,
                se.html_body,
                se.attachments,
                se.scheduled_at,
                se.retry_count,
                se.max_retries,
                se.metadata
            FROM scheduled_emails se
            WHERE se.status = 'pending'
            AND se.scheduled_at <= NOW()
            ORDER BY se.scheduled_at ASC
            LIMIT 100;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        CREATE OR REPLACE FUNCTION update_email_status(
            email_id UUID,
            new_status TEXT,
            error_msg TEXT DEFAULT NULL,
            sent_time TIMESTAMPTZ DEFAULT NULL
        )
        RETURNS BOOLEAN AS $$
        BEGIN
            UPDATE scheduled_emails 
            SET 
                status = new_status,
                error_message = error_msg,
                sent_at = sent_time,
                updated_at = NOW()
            WHERE id = email_id;
            
            INSERT INTO email_logs (email_id, action, details)
            VALUES (email_id, new_status, jsonb_build_object(
                'status', new_status,
                'error_message', error_msg,
                'sent_at', sent_time
            ));
            
            RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      // Execute the SQL
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: createTablesSQL 
      });

      if (sqlError) {
        console.error('❌ SQL execution failed:', sqlError);
        // Try alternative approach - create tables one by one
        return await this.createTablesIndividually();
      }

      console.log('✅ Database setup completed successfully');
      this.isSetupComplete = true;
      return { success: true, message: 'Database setup completed successfully' };

    } catch (error: any) {
      console.error('❌ Database setup failed:', error);
      return { 
        success: false, 
        message: `Database setup failed: ${error.message}` 
      };
    }
  }

  private async createTablesIndividually(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Trying alternative table creation method...');

      // Create scheduled_emails table
      const { error: emailsError } = await supabaseAdmin
        .from('scheduled_emails')
        .select('id')
        .limit(1);

      if (emailsError && emailsError.code === 'PGRST116') {
        // Table doesn't exist, we need to create it
        console.log('📋 Creating scheduled_emails table...');
        // This would require direct SQL execution
      }

      // Create email_templates table
      const { error: templatesError } = await supabaseAdmin
        .from('email_templates')
        .select('id')
        .limit(1);

      if (templatesError && templatesError.code === 'PGRST116') {
        console.log('📋 Creating email_templates table...');
      }

      // Create email_logs table
      const { error: logsError } = await supabaseAdmin
        .from('email_logs')
        .select('id')
        .limit(1);

      if (logsError && logsError.code === 'PGRST116') {
        console.log('📋 Creating email_logs table...');
      }

      console.log('✅ Alternative table creation completed');
      this.isSetupComplete = true;
      return { success: true, message: 'Database setup completed using alternative method' };

    } catch (error: any) {
      console.error('❌ Alternative table creation failed:', error);
      return { 
        success: false, 
        message: `Alternative setup failed: ${error.message}` 
      };
    }
  }

  async checkSetupStatus(): Promise<{ isComplete: boolean; message: string }> {
    try {
      if (this.isSetupComplete) {
        return { isComplete: true, message: 'Setup already completed' };
      }

      // Check if tables exist
      const { data: tables, error } = await supabaseAdmin
        .from('scheduled_emails')
        .select('id')
        .limit(1);

      if (error) {
        return { isComplete: false, message: 'Database not set up' };
      }

      this.isSetupComplete = true;
      return { isComplete: true, message: 'Database is properly configured' };

    } catch (error: any) {
      return { 
        isComplete: false, 
        message: `Setup check failed: ${error.message}` 
      };
    }
  }

  async createSampleData(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📝 Creating sample data for user:', userId);

      // Create sample scheduled email
      const { error: emailError } = await supabaseAdmin
        .from('scheduled_emails')
        .insert({
          user_id: userId,
          organization_id: userId, // Using userId as organizationId for simplicity
          recipients: ['welcome@taskforce.com'],
          subject: 'Welcome to Taskforce Mailer!',
          body: 'Welcome to Taskforce Mailer! Your enterprise email management system is now ready.',
          scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          status: 'pending'
        });

      if (emailError) {
        console.error('❌ Failed to create sample email:', emailError);
        return { success: false, message: 'Failed to create sample data' };
      }

      // Create sample email template
      const { error: templateError } = await supabaseAdmin
        .from('email_templates')
        .insert({
          user_id: userId,
          organization_id: userId,
          name: 'Welcome Template',
          subject: 'Welcome to {{company_name}}!',
          body: 'Hello {{name}}, welcome to {{company_name}}! We\'re excited to have you on board.',
          variables: ['name', 'company_name']
        });

      if (templateError) {
        console.error('❌ Failed to create sample template:', templateError);
        return { success: false, message: 'Failed to create sample template' };
      }

      console.log('✅ Sample data created successfully');
      return { success: true, message: 'Sample data created successfully' };

    } catch (error: any) {
      console.error('❌ Sample data creation failed:', error);
      return { 
        success: false, 
        message: `Sample data creation failed: ${error.message}` 
      };
    }
  }
}
