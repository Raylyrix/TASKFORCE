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

  // Ensure DATABASE_URL exists (Prisma generate reads schema and env but should not connect)
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
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });

  console.log('🏗️ Compiling TypeScript...');
  execSync('npx tsc --skipLibCheck', { stdio: 'inherit', cwd: __dirname });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
