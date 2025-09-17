require('dotenv').config();
const SimpleEmailService = require('./simple-email-service');

async function testEmailService() {
  console.log('🧪 Testing Simple Email Service...\n');

  const emailService = new SimpleEmailService();

  // Test 1: Verify SMTP connection
  console.log('1. Testing SMTP connection...');
  const connectionOk = await emailService.verifyConnection();
  
  if (!connectionOk) {
    console.log('❌ SMTP connection failed. Please check your SMTP settings in .env');
    console.log('Required environment variables:');
    console.log('- SMTP_HOST (e.g., smtp.gmail.com)');
    console.log('- SMTP_PORT (e.g., 587)');
    console.log('- SMTP_USER (your email)');
    console.log('- SMTP_PASS (your app password)');
    console.log('- SMTP_FROM_NAME (optional)');
    return;
  }

  // Test 2: Send test email
  console.log('\n2. Sending test email...');
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  console.log(`Sending to: ${testEmail}`);
  
  const result = await emailService.sendTestEmail(testEmail);
  
  if (result.success) {
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
  } else {
    console.log('❌ Test email failed:', result.error);
  }

  console.log('\n🎉 Email service test completed!');
}

testEmailService().catch(console.error);
