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

try {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Skip Prisma generation in CI to avoid permission issues
  if (!isCI) {
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit', 
        cwd: __dirname,
        windowsHide: true
      });
    } catch (prismaError) {
      console.log('⚠️  Prisma generation failed, but continuing with build...');
      console.log('⚠️  This is expected in some environments');
    }
  } else {
    console.log('🔄 Skipping Prisma generation in CI environment...');
  }

  console.log('🏗️ Compiling TypeScript...');
  execSync('npx tsc --skipLibCheck', { 
    stdio: 'inherit', 
    cwd: __dirname,
    windowsHide: true
  });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
