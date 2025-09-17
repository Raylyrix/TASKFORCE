-- Taskforce Mailer - Supabase Database Setup
-- Run this script in your Supabase SQL Editor

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

-- Create email_logs table for audit trail
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES scheduled_emails(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'scheduled', 'processing', 'sent', 'failed', 'retry', 'cancelled')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_organization_id ON scheduled_emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_organization_id ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON email_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_scheduled_emails_updated_at 
    BEFORE UPDATE ON scheduled_emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy for scheduled_emails
CREATE POLICY "Users can view their own scheduled emails" ON scheduled_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled emails" ON scheduled_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled emails" ON scheduled_emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled emails" ON scheduled_emails
    FOR DELETE USING (auth.uid() = user_id);

-- Policy for email_templates
CREATE POLICY "Users can view their own email templates" ON email_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email templates" ON email_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates" ON email_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates" ON email_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Policy for email_logs (read-only for users)
CREATE POLICY "Users can view logs for their emails" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scheduled_emails 
            WHERE scheduled_emails.id = email_logs.email_id 
            AND scheduled_emails.user_id = auth.uid()
        )
    );

-- Create a function to get pending emails for processing
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

-- Create a function to update email status
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
    
    -- Log the status change
    INSERT INTO email_logs (email_id, action, details)
    VALUES (email_id, new_status, jsonb_build_object(
        'status', new_status,
        'error_message', error_msg,
        'sent_at', sent_time
    ));
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some test data
INSERT INTO scheduled_emails (user_id, organization_id, recipients, subject, body, scheduled_at, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 
 ARRAY['test@example.com'], 'Test Email', 'This is a test email', 
 NOW() + INTERVAL '1 minute', 'pending')
ON CONFLICT DO NOTHING;

-- Create a function to test the setup
CREATE OR REPLACE FUNCTION test_email_scheduling()
RETURNS TEXT AS $$
DECLARE
    email_count INTEGER;
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO email_count FROM scheduled_emails;
    SELECT COUNT(*) INTO template_count FROM email_templates;
    
    RETURN 'Setup complete! Tables created successfully. ' || 
           'Scheduled emails: ' || email_count || ', ' ||
           'Templates: ' || template_count;
END;
$$ LANGUAGE plpgsql;

-- Test the setup
SELECT test_email_scheduling();

-- Show table information
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('scheduled_emails', 'email_templates', 'email_logs')
ORDER BY table_name, ordinal_position;
