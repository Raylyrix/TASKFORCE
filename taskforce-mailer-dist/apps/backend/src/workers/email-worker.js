const { EmailScheduler } = require('../services/email-scheduler');

// Create and start the email scheduler
const scheduler = new EmailScheduler();

console.log('🚀 Email worker started');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down email worker...');
  await scheduler.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down email worker...');
  await scheduler.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
