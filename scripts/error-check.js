#!/usr/bin/env node

/**
 * Comprehensive Error Check Script for Taskforce Mailer
 * This script checks for common issues that could cause problems when users download the app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Taskforce Mailer - Comprehensive Error Check');
console.log('===============================================\n');

let errors = [];
let warnings = [];

// Helper function to check if file exists
function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ Missing ${description}: ${filePath}`);
  } else {
    console.log(`✅ Found ${description}: ${filePath}`);
  }
}

// Helper function to check if directory exists
function checkDir(dirPath, description) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    errors.push(`❌ Missing ${description}: ${dirPath}`);
  } else {
    console.log(`✅ Found ${description}: ${dirPath}`);
  }
}

// Helper function to check if file contains text
function checkFileContains(filePath, text, description) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(text)) {
      console.log(`✅ ${description} found in ${filePath}`);
    } else {
      warnings.push(`⚠️ ${description} not found in ${filePath}`);
    }
  }
}

// Helper function to check JSON validity
function checkJSON(filePath, description) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      console.log(`✅ Valid JSON: ${filePath}`);
    } catch (e) {
      errors.push(`❌ Invalid JSON in ${description}: ${filePath} - ${e.message}`);
    }
  }
}

// 1. Check essential files
console.log('📁 Checking Essential Files...');
checkFile('package.json', 'Root package.json');
checkFile('env.example', 'Environment example file');
checkFile('apps/backend/package.json', 'Backend package.json');
checkFile('apps/frontend/package.json', 'Frontend package.json');
checkFile('services/ai-service/package.json', 'AI Service package.json');
checkFile('services/worker/package.json', 'Worker package.json');
checkFile('packages/shared/package.json', 'Shared package.json');
checkFile('rtx_innovations_electron/package.json', 'Electron package.json');

// 2. Check configuration files
console.log('\n⚙️ Checking Configuration Files...');
checkFile('apps/backend/prisma/schema.prisma', 'Prisma schema');
checkFile('apps/frontend/next.config.js', 'Next.js config');
checkFile('rtx_innovations_electron/client_secret.json', 'Electron OAuth config');
checkFile('docker-compose.yml', 'Docker Compose config');
checkFile('.github/workflows/ci.yml', 'CI workflow');

// 3. Check JSON validity
console.log('\n🔍 Checking JSON Validity...');
checkJSON('package.json', 'Root package.json');
checkJSON('apps/backend/package.json', 'Backend package.json');
checkJSON('apps/frontend/package.json', 'Frontend package.json');
checkJSON('services/ai-service/package.json', 'AI Service package.json');
checkJSON('services/worker/package.json', 'Worker package.json');
checkJSON('packages/shared/package.json', 'Shared package.json');
checkJSON('rtx_innovations_electron/package.json', 'Electron package.json');
checkJSON('rtx_innovations_electron/client_secret.json', 'Electron OAuth config');

// 4. Check OAuth configuration consistency
console.log('\n🔐 Checking OAuth Configuration...');
const envExample = fs.readFileSync('env.example', 'utf8');
const electronConfig = JSON.parse(fs.readFileSync('rtx_innovations_electron/client_secret.json', 'utf8'));

// Check if OAuth client IDs match
const webClientId = envExample.match(/GMAIL_CLIENT_ID="([^"]+)"/)?.[1];
const desktopClientId = electronConfig.installed.client_id;

if (webClientId && desktopClientId && webClientId !== desktopClientId) {
  warnings.push(`⚠️ OAuth Client ID mismatch: Web (${webClientId}) vs Desktop (${desktopClientId})`);
} else {
  console.log('✅ OAuth Client IDs are consistent');
}

// 5. Check database configuration
console.log('\n🗄️ Checking Database Configuration...');
checkFileContains('env.example', 'DATABASE_URL=', 'Database URL');
checkFileContains('env.example', 'POSTGRES_PASSWORD=', 'PostgreSQL password');
checkFileContains('docker-compose.yml', 'POSTGRES_PASSWORD:', 'Docker PostgreSQL password');

// Check for consistent database passwords
const envPassword = envExample.match(/POSTGRES_PASSWORD="([^"]+)"/)?.[1];
const dockerPassword = fs.readFileSync('docker-compose.yml', 'utf8').match(/POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD:-([^}]+)\}/)?.[1];

if (envPassword && dockerPassword && envPassword !== dockerPassword) {
  errors.push(`❌ Database password mismatch: env.example (${envPassword}) vs docker-compose.yml (${dockerPassword})`);
} else {
  console.log('✅ Database passwords are consistent');
}

// 6. Check for missing .env file
console.log('\n📝 Checking Environment Setup...');
if (!fs.existsSync('.env')) {
  warnings.push('⚠️ .env file not found - users will need to create one from env.example');
} else {
  console.log('✅ .env file exists');
}

// 7. Check build scripts
console.log('\n🔨 Checking Build Scripts...');
checkFileContains('package.json', '"build":', 'Build script');
checkFileContains('apps/backend/package.json', '"build":', 'Backend build script');
checkFileContains('apps/frontend/package.json', '"build":', 'Frontend build script');
checkFileContains('rtx_innovations_electron/package.json', '"build":', 'Electron build script');

// 8. Check for TypeScript configuration
console.log('\n📘 Checking TypeScript Configuration...');
checkFile('tsconfig.json', 'Root TypeScript config');
checkFile('apps/backend/tsconfig.json', 'Backend TypeScript config');
checkFile('apps/frontend/tsconfig.json', 'Frontend TypeScript config');
checkFile('services/ai-service/tsconfig.json', 'AI Service TypeScript config');
checkFile('services/worker/tsconfig.json', 'Worker TypeScript config');
checkFile('packages/shared/tsconfig.json', 'Shared TypeScript config');

// 9. Check for Jest configuration
console.log('\n🧪 Checking Test Configuration...');
checkFile('apps/backend/jest.config.js', 'Backend Jest config');
checkFile('apps/frontend/jest.config.js', 'Frontend Jest config');
checkFile('services/ai-service/jest.config.js', 'AI Service Jest config');
checkFile('services/worker/jest.config.js', 'Worker Jest config');
checkFile('packages/shared/jest.config.js', 'Shared Jest config');

// 10. Check for potential port conflicts
console.log('\n🔌 Checking Port Configuration...');
const ports = {
  frontend: 3000,
  backend: 4000,
  aiService: 4001,
  postgres: 5432,
  redis: 6379
};

for (const [service, port] of Object.entries(ports)) {
  try {
    execSync(`netstat -an | findstr :${port}`, { stdio: 'pipe' });
    warnings.push(`⚠️ Port ${port} (${service}) might be in use`);
  } catch (e) {
    console.log(`✅ Port ${port} (${service}) is available`);
  }
}

// 11. Check for missing dependencies
console.log('\n📦 Checking Dependencies...');
try {
  execSync('pnpm list --depth=0', { stdio: 'pipe' });
  console.log('✅ Dependencies are installed');
} catch (e) {
  errors.push('❌ Dependencies not installed - run "pnpm install"');
}

// 12. Check for build errors
console.log('\n🔨 Checking Build Status...');
try {
  execSync('pnpm build', { stdio: 'pipe' });
  console.log('✅ Build completed successfully');
} catch (e) {
  errors.push('❌ Build failed - check build output for errors');
}

// Summary
console.log('\n📊 Summary');
console.log('==========');

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All checks passed! The application should work properly when users download it.');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} Error(s) found:`);
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} Warning(s) found:`);
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log('\n🔧 Please fix the errors before releasing the application.');
}

process.exit(errors.length > 0 ? 1 : 0);
