const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://mcyiohpzduyqmjsepedo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk';

// Your access token
const accessToken = 'sbp_bbe0bbe003f8ae1f2821ce8991a8f89df824a693';

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }
});

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('scheduled_emails').select('count').limit(1);
    
    if (error) {
      console.log('❌ Basic connection failed:', error.message);
      
      // Try to create the table
      console.log('2. Attempting to create tables...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS scheduled_emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        `
      });
      
      if (createError) {
        console.log('❌ Table creation failed:', createError.message);
        console.log('💡 You may need to run the SQL schema manually in Supabase dashboard');
      } else {
        console.log('✅ Tables created successfully');
      }
    } else {
      console.log('✅ Basic connection successful');
    }

    // Test 2: Test insert (if table exists)
    console.log('\n3. Testing insert operation...');
    const testEmail = {
      user_id: 'test-user-123',
      organization_id: 'test-org-456',
      recipients: ['test@example.com'],
      subject: 'Test Email',
      body: 'This is a test email',
      scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      metadata: { test: true }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('scheduled_emails')
      .insert([testEmail])
      .select();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
    } else {
      console.log('✅ Insert successful:', insertData[0].id);
      
      // Clean up test data
      await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test data cleaned up');
    }

    // Test 3: Test RPC functions
    console.log('\n4. Testing RPC functions...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_emails');
    
    if (rpcError) {
      console.log('❌ RPC function failed:', rpcError.message);
      console.log('💡 RPC functions may need to be created manually');
    } else {
      console.log('✅ RPC functions working');
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testSupabaseConnection();
