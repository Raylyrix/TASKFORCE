const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Taskforce Mailer...\n');

// Function to start a service
function startService(name, command, args, cwd) {
  console.log(`📦 Starting ${name}...`);
  
  const process = spawn(command, args, {
    cwd: cwd || process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  process.on('error', (error) => {
    console.error(`❌ Failed to start ${name}:`, error.message);
  });

  process.on('exit', (code) => {
    if (code !== 0) {
      console.log(`⚠️ ${name} exited with code ${code}`);
    }
  });

  return process;
}

// Start services
const services = [];

try {
  // Start Backend
  console.log('🔧 Starting Backend...');
  const backend = startService('Backend', 'npx', ['tsx', 'src/simple-server.ts'], path.join(__dirname, 'apps/backend'));
  services.push(backend);

  // Wait a moment for backend to start
  setTimeout(() => {
    // Start Frontend
    console.log('🎨 Starting Frontend...');
    const frontend = startService('Frontend', 'pnpm', ['dev'], path.join(__dirname, 'apps/frontend'));
    services.push(frontend);
  }, 3000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    services.forEach(service => {
      if (service && !service.killed) {
        service.kill('SIGTERM');
      }
    });
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down services...');
    services.forEach(service => {
      if (service && !service.killed) {
        service.kill('SIGTERM');
      }
    });
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Failed to start services:', error);
  process.exit(1);
}
