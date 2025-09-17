const { EmailScheduler } = require('./apps/backend/src/services/email-scheduler');

async function testScheduling() {
  console.log('🧪 Testing Email Scheduling Service...\n');

  const scheduler = new EmailScheduler();

  try {
    // Test 1: Schedule an email for 2 minutes from now
    const scheduledTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    
    console.log('📧 Scheduling test email...');
    const emailId = await scheduler.scheduleEmail({
      user_id: 'test-user-123',
      organization_id: 'test-org-456',
      recipients: ['test@example.com'],
      subject: 'Test Scheduled Email',
      body: 'This is a test email scheduled for 2 minutes from now.',
      html_body: '<h1>Test Email</h1><p>This is a test email scheduled for 2 minutes from now.</p>',
      scheduled_at: scheduledTime.toISOString(),
      max_retries: 3,
      metadata: { test: true }
    });

    console.log(`✅ Email scheduled with ID: ${emailId}`);
    console.log(`⏰ Scheduled for: ${scheduledTime.toISOString()}\n`);

    // Test 2: Check email status
    console.log('📊 Checking email status...');
    const status = await scheduler.getEmailStatus(emailId);
    console.log('📋 Email Status:', status);
    console.log('');

    // Test 3: Get queue statistics
    console.log('📈 Getting queue statistics...');
    const stats = await scheduler.getQueueStats();
    console.log('📊 Queue Stats:', stats);
    console.log('');

    // Test 4: Wait and monitor
    console.log('⏳ Waiting for email to be processed...');
    console.log('💡 You can shut down this script and the email will still be sent!');
    console.log('💡 The backend service will continue processing emails even if this client is offline.\n');

    // Monitor status for 5 minutes
    const startTime = Date.now();
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes

    while (Date.now() - startTime < maxWaitTime) {
      const currentStatus = await scheduler.getEmailStatus(emailId);
      console.log(`⏰ ${new Date().toISOString()} - Status: ${currentStatus?.status}`);
      
      if (currentStatus?.status === 'sent' || currentStatus?.status === 'failed') {
        console.log(`\n🎉 Email processing completed with status: ${currentStatus.status}`);
        if (currentStatus.sent_at) {
          console.log(`📤 Sent at: ${currentStatus.sent_at}`);
        }
        if (currentStatus.error_message) {
          console.log(`❌ Error: ${currentStatus.error_message}`);
        }
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    }

    // Test 5: Cancel email (if still pending)
    const finalStatus = await scheduler.getEmailStatus(emailId);
    if (finalStatus?.status === 'pending') {
      console.log('\n🚫 Cancelling email...');
      const cancelled = await scheduler.cancelEmail(emailId);
      console.log(`✅ Email cancelled: ${cancelled}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🛑 Shutting down scheduler...');
    await scheduler.shutdown();
    console.log('✅ Test completed!');
  }
}

// Run the test
testScheduling().catch(console.error);
