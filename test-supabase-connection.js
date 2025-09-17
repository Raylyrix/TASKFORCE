const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Your Supabase credentials
const supabaseUrl = 'https://mcyiohpzduyqmjsepedo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA4ODk1NywiZXhwIjoyMDczNjY0OTU3fQ.VmgFAJdPH2CIqGvjg6QnkG11WjbEMoGq_y62SGSbhJE';

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection with Your API Keys...\n');

  try {
    // Test 1: Basic connection with anon key
    console.log('1. Testing basic connection with anon key...');
    const { data: anonData, error: anonError } = await supabase
      .from('scheduled_emails')
      .select('count')
      .limit(1);
    
    if (anonError) {
      console.log('❌ Anon key connection failed:', anonError.message);
    } else {
      console.log('✅ Anon key connection successful');
    }

    // Test 2: Service key connection
    console.log('\n2. Testing service key connection...');
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from('scheduled_emails')
      .select('count')
      .limit(1);
    
    if (serviceError) {
      console.log('❌ Service key connection failed:', serviceError.message);
      console.log('💡 This might be because the tables don\'t exist yet.');
      console.log('   Please run the setup-supabase-database.sql script in your Supabase dashboard.');
    } else {
      console.log('✅ Service key connection successful');
    }

    // Test 3: Try to create a test record with service key
    console.log('\n3. Testing record creation with service key...');
    const testEmail = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      organization_id: '550e8400-e29b-41d4-a716-446655440001',
      recipients: ['test@example.com'],
      subject: 'Test Email from Connection Test',
      body: 'This is a test email to verify the connection works.',
      scheduled_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      metadata: { test: true, timestamp: new Date().toISOString() }
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('scheduled_emails')
      .insert([testEmail])
      .select();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('💡 This confirms the tables need to be created.');
    } else {
      console.log('✅ Insert successful:', insertData[0].id);
      
      // Clean up test data
      await supabaseAdmin
        .from('scheduled_emails')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test data cleaned up');
    }

    // Test 4: Test RPC functions
    console.log('\n4. Testing RPC functions...');
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_pending_emails');
    
    if (rpcError) {
      console.log('❌ RPC function failed:', rpcError.message);
      console.log('💡 RPC functions need to be created via the SQL script.');
    } else {
      console.log('✅ RPC functions working');
      console.log('📊 Pending emails found:', rpcData.length);
    }

    console.log('\n🎉 Supabase connection test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of setup-supabase-database.sql');
    console.log('4. Execute the SQL to create tables and functions');
    console.log('5. Run this test again to verify everything works');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testSupabaseConnection();
