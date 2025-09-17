const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Taskforce Mailer (Working Version)...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('⚠️  .env file not found. Creating from env.example...');
  if (fs.existsSync('env.example')) {
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created. Please configure your settings.');
  } else {
    console.log('❌ env.example not found. Please create .env manually.');
    process.exit(1);
  }
}

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

// Function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

async function startApplication() {
  try {
    // Check ports
    console.log('🔍 Checking ports...');
    const port3000 = await checkPort(3000);
    const port4000 = await checkPort(4000);
    
    if (!port3000) {
      console.log('⚠️  Port 3000 is in use. Frontend may not start.');
    }
    if (!port4000) {
      console.log('⚠️  Port 4000 is in use. Backend may not start.');
    }

    const services = [];

    // Start Backend
    console.log('🔧 Starting Backend...');
    const backend = startService('Backend', 'npx', ['tsx', 'src/simple-server.ts'], path.join(__dirname, 'apps/backend'));
    services.push(backend);

    // Wait for backend to start
    console.log('⏳ Waiting for backend to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start Frontend
    console.log('🎨 Starting Frontend...');
    const frontend = startService('Frontend', 'pnpm', ['dev'], path.join(__dirname, 'apps/frontend'));
    services.push(frontend);

    // Show access information
    setTimeout(() => {
      console.log('\n🎉 Application started successfully!');
      console.log('📱 Access points:');
      console.log('   Frontend: http://localhost:3000');
      console.log('   Backend API: http://localhost:4000');
      console.log('   Health Check: http://localhost:4000/health');
      console.log('\n📧 Email Testing:');
      console.log('   Run: node test-simple-email.js');
      console.log('\n🛑 To stop: Press Ctrl+C');
    }, 10000);

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
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();
