const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Copy env.example to .env if .env doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '../../env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📋 Copying env.example to .env for build...');
  fs.copyFileSync(envExamplePath, envPath);
}

async function runWithRetry(command, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(command, options);
      return true;
    } catch (error) {
      console.log(`⚠️  Attempt ${i + 1} failed: ${error.message}`);
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`🔄 Retrying in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function build() {
  try {
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    // Ensure DATABASE_URL exists
    if (isCI && !process.env.DATABASE_URL) {
      const fallbackDbUrl = 'postgresql://postgres:postgres@localhost:5432/taskforce_ci';
      try {
        const currentEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        if (!currentEnv.includes('DATABASE_URL=')) {
          fs.appendFileSync(envPath, `\nDATABASE_URL="${fallbackDbUrl}"\n`);
          console.log('🧩 Added fallback DATABASE_URL for CI generation');
        }
        process.env.DATABASE_URL = fallbackDbUrl;
      } catch (_) {
        // ignore
      }
    }

    console.log('🔧 Generating Prisma client...');
    
    // Try Prisma generation with retry logic
    try {
      await runWithRetry('npx prisma generate', { 
        stdio: 'inherit', 
        cwd: __dirname,
        windowsHide: true
      });
    } catch (prismaError) {
      console.log('⚠️  Prisma generation failed, but continuing with build...');
      if (isCI) {
        console.log('🔄 Continuing build in CI environment...');
      } else {
        throw prismaError;
      }
    }

    console.log('🏗️ Compiling TypeScript...');
    await runWithRetry('npx tsc --skipLibCheck', { 
      stdio: 'inherit', 
      cwd: __dirname,
      windowsHide: true
    });

    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
