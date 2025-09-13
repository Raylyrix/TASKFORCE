#!/usr/bin/env node

/**
 * Test script to verify Gmail OAuth setup
 * Run with: node scripts/test-oauth-setup.js
 */

const https = require('https');
const http = require('http');

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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:4000/health');
    
    if (response.statusCode === 200) {
      log('✅ Backend is running', 'green');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend is not running: ${error.message}`, 'red');
    log('   Make sure to run: pnpm dev', 'yellow');
    return false;
  }
}

async function testFrontendHealth() {
  log('\n🔍 Testing Frontend Health...', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:3000');
    
    if (response.statusCode === 200) {
      log('✅ Frontend is running', 'green');
      return true;
    } else {
      log(`❌ Frontend health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend is not running: ${error.message}`, 'red');
    log('   Make sure to run: pnpm dev', 'yellow');
    return false;
  }
}

async function testOAuthEndpoint() {
  log('\n🔍 Testing OAuth Endpoint...', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:4000/auth/google');
    
    if (response.statusCode === 302) {
      log('✅ OAuth endpoint is working', 'green');
      
      // Check if redirect URL contains Google OAuth
      const location = response.headers.location;
      if (location && location.includes('accounts.google.com')) {
        log('✅ Redirecting to Google OAuth correctly', 'green');
        return true;
      } else {
        log('❌ OAuth redirect URL looks incorrect', 'red');
        return false;
      }
    } else {
      log(`❌ OAuth endpoint failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ OAuth endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function testEnvironmentVariables() {
  log('\n🔍 Testing Environment Variables...', 'blue');
  
  const requiredVars = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REDIRECT_URI',
    'FRONTEND_URL'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName} is set`, 'green');
    } else {
      log(`❌ ${varName} is missing`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function main() {
  log('🚀 Gmail OAuth Setup Test', 'bold');
  log('========================', 'bold');
  
  // Test environment variables
  const envOk = await testEnvironmentVariables();
  
  // Test backend
  const backendOk = await testBackendHealth();
  
  // Test frontend
  const frontendOk = await testFrontendHealth();
  
  // Test OAuth endpoint
  const oauthOk = backendOk ? await testOAuthEndpoint() : false;
  
  // Summary
  log('\n📊 Test Results:', 'bold');
  log('================', 'bold');
  
  log(`Environment Variables: ${envOk ? '✅' : '❌'}`, envOk ? 'green' : 'red');
  log(`Backend Health: ${backendOk ? '✅' : '❌'}`, backendOk ? 'green' : 'red');
  log(`Frontend Health: ${frontendOk ? '✅' : '❌'}`, frontendOk ? 'green' : 'red');
  log(`OAuth Endpoint: ${oauthOk ? '✅' : '❌'}`, oauthOk ? 'green' : 'red');
  
  if (envOk && backendOk && frontendOk && oauthOk) {
    log('\n🎉 All tests passed! Your Gmail OAuth setup is ready.', 'green');
    log('\n🌐 Next steps:', 'blue');
    log('1. Visit: http://localhost:3000', 'yellow');
    log('2. Click "Continue with Gmail"', 'yellow');
    log('3. Sign in with your Google account', 'yellow');
    log('4. Grant permissions', 'yellow');
    log('5. Explore your email analytics!', 'yellow');
  } else {
    log('\n❌ Some tests failed. Please check the issues above.', 'red');
    log('\n🔧 Common fixes:', 'blue');
    log('1. Make sure .env file exists and has correct values', 'yellow');
    log('2. Run: pnpm install', 'yellow');
    log('3. Run: pnpm dev', 'yellow');
    log('4. Check Google Cloud Console OAuth settings', 'yellow');
  }
}

// Run the test
main().catch(console.error);
