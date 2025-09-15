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
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  
  console.log('🏗️ Compiling TypeScript...');
  execSync('npx tsc --skipLibCheck', { stdio: 'inherit', cwd: __dirname });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
