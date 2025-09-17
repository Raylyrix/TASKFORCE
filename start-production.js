const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Taskforce Mailer Production Environment...\n');

// Function to start a service
function startService(name, command, args, cwd, env = {}) {
  console.log(`📦 Starting ${name}...`);
  
  const child = spawn(command, args, {
    cwd: cwd,
    env: { ...process.env, ...env },
    stdio: 'pipe',
    shell: true
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.trim()) {
      console.log(`[${name}] ${output.trim()}`);
    }
  });

  child.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.trim() && !output.includes('EADDRINUSE')) {
      console.log(`[${name}] ${output.trim()}`);
    }
  });

  child.on('error', (error) => {
    console.error(`❌ Failed to start ${name}:`, error.message);
  });

  return child;
}

// Start services in order
const services = [];

// 1. Start Backend
console.log('🔧 Starting Backend Service...');
const backend = startService('Backend', 'npx', ['tsx', 'src/index.ts'], path.join(__dirname, 'apps/backend'), {
  PORT: '4000',
  NODE_ENV: 'production'
});
services.push(backend);

// Wait a bit for backend to start
setTimeout(() => {
  // 2. Start Worker Service
  console.log('🔧 Starting Worker Service...');
  const worker = startService('Worker', 'npx', ['tsx', 'src/index.ts'], path.join(__dirname, 'services/worker'), {
    PORT: '4002',
    NODE_ENV: 'production'
  });
  services.push(worker);

  // 3. Start AI Service
  console.log('🔧 Starting AI Service...');
  const aiService = startService('AI Service', 'npx', ['tsx', 'src/index.ts'], path.join(__dirname, 'services/ai-service'), {
    PORT: '4001',
    NODE_ENV: 'production'
  });
  services.push(aiService);

  // 4. Start Frontend
  setTimeout(() => {
    console.log('🔧 Starting Frontend Service...');
    const frontend = startService('Frontend', 'pnpm', ['dev'], path.join(__dirname, 'apps/frontend'), {
      PORT: '3000',
      NODE_ENV: 'production'
    });
    services.push(frontend);
  }, 2000);

}, 3000);

// Handle graceful shutdown
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

console.log('✅ All services starting...');
console.log('🌐 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:4000');
console.log('🤖 AI Service: http://localhost:4001');
console.log('⚙️ Worker Service: http://localhost:4002');
console.log('\nPress Ctrl+C to stop all services');