#!/usr/bin/env node

/**
 * Environment configuration checker
 * Run with: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n🔍 Checking Environment Configuration...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found', 'red');
    
    if (fs.existsSync(envExamplePath)) {
      log('📋 Creating .env from template...', 'yellow');
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ .env file created from template', 'green');
    } else {
      log('❌ env.example template not found', 'red');
      return false;
    }
  } else {
    log('✅ .env file exists', 'green');
  }
  
  return true;
}

function checkRequiredVariables() {
  log('\n🔍 Checking Required Environment Variables...', 'blue');
  
  // Load .env file
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET', 
    'GMAIL_REDIRECT_URI',
    'FRONTEND_URL',
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1] && match[1].trim() !== '') {
      log(`✅ ${varName} is configured`, 'green');
    } else {
      log(`❌ ${varName} is missing or empty`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

function checkGoogleCredentials() {
  log('\n🔍 Checking Google OAuth Credentials...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check Gmail Client ID
  const clientIdMatch = envContent.match(/^GMAIL_CLIENT_ID=(.+)$/m);
  if (clientIdMatch && clientIdMatch[1].includes('apps.googleusercontent.com')) {
    log('✅ Gmail Client ID format looks correct', 'green');
  } else {
    log('❌ Gmail Client ID format looks incorrect', 'red');
    log('   Expected format: xxx.apps.googleusercontent.com', 'yellow');
  }
  
  // Check Gmail Client Secret
  const clientSecretMatch = envContent.match(/^GMAIL_CLIENT_SECRET=(.+)$/m);
  if (clientSecretMatch && clientSecretMatch[1].startsWith('GOCSPX-')) {
    log('✅ Gmail Client Secret format looks correct', 'green');
  } else {
    log('❌ Gmail Client Secret format looks incorrect', 'red');
    log('   Expected format: GOCSPX-...', 'yellow');
  }
  
  // Check Redirect URI
  const redirectMatch = envContent.match(/^GMAIL_REDIRECT_URI=(.+)$/m);
  if (redirectMatch && redirectMatch[1].includes('/auth/google/callback')) {
    log('✅ Gmail Redirect URI looks correct', 'green');
  } else {
    log('❌ Gmail Redirect URI looks incorrect', 'red');
    log('   Expected format: http://localhost:4000/auth/google/callback', 'yellow');
  }
}

function checkDatabaseConfig() {
  log('\n🔍 Checking Database Configuration...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const dbMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (dbMatch && dbMatch[1].includes('postgresql://')) {
    log('✅ Database URL format looks correct', 'green');
    
    // Extract database name
    const dbNameMatch = dbMatch[1].match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    if (dbNameMatch) {
      const [, username, password, host, port, database] = dbNameMatch;
      log(`   Database: ${database}`, 'blue');
      log(`   Host: ${host}:${port}`, 'blue');
      log(`   User: ${username}`, 'blue');
    }
  } else {
    log('❌ Database URL format looks incorrect', 'red');
    log('   Expected format: postgresql://user:password@host:port/database', 'yellow');
  }
}

function main() {
  log('🔧 Environment Configuration Checker', 'bold');
  log('=====================================', 'bold');
  
  try {
    const envFileOk = checkEnvFile();
    
    if (envFileOk) {
      const varsOk = checkRequiredVariables();
      checkGoogleCredentials();
      checkDatabaseConfig();
      
      log('\n📊 Summary:', 'bold');
      log('===========', 'bold');
      
      if (varsOk) {
        log('✅ Environment configuration looks good!', 'green');
        log('\n🚀 Next steps:', 'blue');
        log('1. Run: pnpm install', 'yellow');
        log('2. Run: pnpm dev', 'yellow');
        log('3. Visit: http://localhost:3000', 'yellow');
      } else {
        log('❌ Some environment variables need attention', 'red');
        log('\n🔧 Please check the issues above and update your .env file', 'yellow');
      }
    }
  } catch (error) {
    log(`❌ Error checking environment: ${error.message}`, 'red');
  }
}

// Run the check
main();
