const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Taskforce Mailer - Production Mode');
console.log('================================================\n');

// Ensure .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📋 Copying env.example to .env...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Environment file created');
}

// Test Supabase connection first
console.log('🔍 Testing Supabase connection...');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mcyiohpzduyqmjsepedo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA4ODk1NywiZXhwIjoyMDczNjY0OTU3fQ.VmgFAJdPH2CIqGvjg6QnkG11WjbEMoGq_y62SGSbhJE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabase() {
  try {
    const { data, error } = await supabaseAdmin
      .from('scheduled_emails')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Supabase connection issue:', error.message);
      console.log('💡 Please run the setup-supabase-database.sql script in your Supabase dashboard');
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.log('⚠️  Supabase test failed:', err.message);
  }
}

// Start the application
async function startApp() {
  await testSupabase();
  
  console.log('\n🔧 Starting Backend...');
  const backendProcess = spawn('npx', ['tsx', 'apps/backend/src/simple-server.ts'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  backendProcess.on('error', (error) => {
    console.error(`❌ Backend failed to start: ${error}`);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`⚠️  Backend exited with code ${code}`);
    }
  });

  // Wait a moment for backend to start
  setTimeout(() => {
    console.log('\n🎨 Starting Frontend...');
    const frontendProcess = spawn('pnpm', ['--filter=./apps/frontend', 'dev'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });

    frontendProcess.on('error', (error) => {
      console.error(`❌ Frontend failed to start: ${error}`);
    });

    frontendProcess.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`⚠️  Frontend exited with code ${code}`);
      }
    });
  }, 3000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    backendProcess.kill();
    process.exit(0);
  });
}

startApp().catch(console.error);
