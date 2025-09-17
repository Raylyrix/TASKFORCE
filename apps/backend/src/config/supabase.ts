import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcyiohpzduyqmjsepedo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk';

// Service role key for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA4ODk1NywiZXhwIjoyMDczNjY0OTU3fQ.VmgFAJdPH2CIqGvjg6QnkG11WjbEMoGq_y62SGSbhJE';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Service client for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ScheduledEmail {
  id: string;
  user_id: string;
  organization_id: string;
  recipients: string[];
  subject: string;
  body: string;
  html_body?: string;
  attachments?: any[];
  scheduled_at: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  retry_count: number;
  max_retries: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  subject: string;
  body: string;
  html_body?: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}
