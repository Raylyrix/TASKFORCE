#!/usr/bin/env node

/**
 * Comprehensive OAuth Integration Test
 * Tests the complete Gmail OAuth flow
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

async function testEnvironmentConfiguration() {
  log('\n🔍 Testing Environment Configuration...', 'blue');
  
  const requiredVars = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REDIRECT_URI',
    'FRONTEND_URL',
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENROUTER_API_KEY'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName} is configured`, 'green');
    } else {
      log(`❌ ${varName} is missing`, 'red');
      allPresent = false;
    }
  }
  
  // Check OAuth credentials format
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_ID.includes('dd7o4v4jh01b1pcar6a681hj6pmjdsnp')) {
    log('✅ Updated OAuth Client ID detected', 'green');
  } else {
    log('❌ OAuth Client ID not updated to new credentials', 'red');
    allPresent = false;
  }
  
  return allPresent;
}

async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:4000/health');
    
    if (response.statusCode === 200) {
      log('✅ Backend is running and healthy', 'green');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend is not running: ${error.message}`, 'red');
    log('   Start with: pnpm dev', 'yellow');
    return false;
  }
}

async function testOAuthEndpoints() {
  log('\n🔍 Testing OAuth Endpoints...', 'blue');
  
  const endpoints = [
    { path: '/auth/google', expectedStatus: 302, description: 'OAuth initiation' },
    { path: '/auth/status', expectedStatus: 401, description: 'Auth status check' },
    { path: '/auth/test-gmail', expectedStatus: 401, description: 'Gmail connection test' }
  ];
  
  let allWorking = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`http://localhost:4000${endpoint.path}`);
      
      if (response.statusCode === endpoint.expectedStatus) {
        log(`✅ ${endpoint.description} endpoint working`, 'green');
      } else {
        log(`❌ ${endpoint.description} endpoint failed: ${response.statusCode}`, 'red');
        allWorking = false;
      }
    } catch (error) {
      log(`❌ ${endpoint.description} endpoint error: ${error.message}`, 'red');
      allWorking = false;
    }
  }
  
  return allWorking;
}

async function testOAuthRedirect() {
  log('\n🔍 Testing OAuth Redirect...', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:4000/auth/google');
    
    if (response.statusCode === 302) {
      const location = response.headers.location;
      
      if (location && location.includes('accounts.google.com')) {
        log('✅ OAuth redirect to Google working', 'green');
        
        // Check if it contains our client ID
        if (location.includes('dd7o4v4jh01b1pcar6a681hj6pmjdsnp')) {
          log('✅ Updated OAuth Client ID in redirect URL', 'green');
          return true;
        } else {
          log('❌ OAuth Client ID not updated in redirect URL', 'red');
          return false;
        }
      } else {
        log('❌ OAuth redirect URL incorrect', 'red');
        return false;
      }
    } else {
      log(`❌ OAuth redirect failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ OAuth redirect error: ${error.message}`, 'red');
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
    log('   Start with: pnpm dev', 'yellow');
    return false;
  }
}

async function testAnalyticsEndpoints() {
  log('\n🔍 Testing Analytics Endpoints...', 'blue');
  
  const endpoints = [
    { path: '/api/v1/analytics/overview', description: 'Analytics overview' },
    { path: '/api/v1/analytics/volume', description: 'Volume analytics' },
    { path: '/api/v1/analytics/contacts', description: 'Contact analytics' }
  ];
  
  let allWorking = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`http://localhost:4000${endpoint.path}`);
      
      // These should return 401 without auth, which is expected
      if (response.statusCode === 401) {
        log(`✅ ${endpoint.description} endpoint protected`, 'green');
      } else if (response.statusCode === 200) {
        log(`✅ ${endpoint.description} endpoint working`, 'green');
      } else {
        log(`❌ ${endpoint.description} endpoint failed: ${response.statusCode}`, 'red');
        allWorking = false;
      }
    } catch (error) {
      log(`❌ ${endpoint.description} endpoint error: ${error.message}`, 'red');
      allWorking = false;
    }
  }
  
  return allWorking;
}

async function testAIService() {
  log('\n🔍 Testing AI Service...', 'blue');
  
  try {
    const response = await makeRequest('http://localhost:4001/health');
    
    if (response.statusCode === 200) {
      log('✅ AI Service is running', 'green');
      return true;
    } else {
      log(`❌ AI Service health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ AI Service is not running: ${error.message}`, 'red');
    log('   AI Service should start with: pnpm dev', 'yellow');
    return false;
  }
}

async function generateOAuthTestURL() {
  log('\n🔍 Generating OAuth Test URL...', 'blue');
  
  const clientId = process.env.GMAIL_CLIENT_ID;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;
  
  if (clientId && redirectUri) {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');
    
    const state = 'test-taskforce-analytics';
    
    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;
    
    log('🔗 OAuth Test URL Generated:', 'cyan');
    log(authUrl, 'yellow');
    log('\n📋 Test Instructions:', 'blue');
    log('1. Copy the URL above', 'yellow');
    log('2. Paste it in your browser', 'yellow');
    log('3. Sign in with your Google account', 'yellow');
    log('4. Grant permissions', 'yellow');
    log('5. You should be redirected back to your app', 'yellow');
    
    return true;
  } else {
    log('❌ Cannot generate OAuth URL - missing credentials', 'red');
    return false;
  }
}

async function main() {
  log('🧪 Taskforce Analytics OAuth Integration Test', 'bold');
  log('============================================', 'bold');
  
  // Load environment variables
  require('dotenv').config();
  
  // Run all tests
  const envOk = await testEnvironmentConfiguration();
  const backendOk = await testBackendHealth();
  const frontendOk = await testFrontendHealth();
  const oauthOk = backendOk ? await testOAuthEndpoints() : false;
  const redirectOk = backendOk ? await testOAuthRedirect() : false;
  const analyticsOk = backendOk ? await testAnalyticsEndpoints() : false;
  const aiOk = await testAIService();
  const urlGenerated = await generateOAuthTestURL();
  
  // Summary
  log('\n📊 Test Results Summary:', 'bold');
  log('========================', 'bold');
  
  log(`Environment Configuration: ${envOk ? '✅' : '❌'}`, envOk ? 'green' : 'red');
  log(`Backend Health: ${backendOk ? '✅' : '❌'}`, backendOk ? 'green' : 'red');
  log(`Frontend Health: ${frontendOk ? '✅' : '❌'}`, frontendOk ? 'green' : 'red');
  log(`OAuth Endpoints: ${oauthOk ? '✅' : '❌'}`, oauthOk ? 'green' : 'red');
  log(`OAuth Redirect: ${redirectOk ? '✅' : '❌'}`, redirectOk ? 'green' : 'red');
  log(`Analytics Endpoints: ${analyticsOk ? '✅' : '❌'}`, analyticsOk ? 'green' : 'red');
  log(`AI Service: ${aiOk ? '✅' : '❌'}`, aiOk ? 'green' : 'red');
  log(`OAuth URL Generated: ${urlGenerated ? '✅' : '❌'}`, urlGenerated ? 'green' : 'red');
  
  const totalTests = 8;
  const passedTests = [envOk, backendOk, frontendOk, oauthOk, redirectOk, analyticsOk, aiOk, urlGenerated].filter(Boolean).length;
  
  log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Your Gmail OAuth integration is ready for testing.', 'green');
    log('\n🌐 Next Steps:', 'blue');
    log('1. Visit: http://localhost:3000', 'yellow');
    log('2. Click "Continue with Gmail"', 'yellow');
    log('3. Or use the OAuth URL generated above', 'yellow');
    log('4. Sign in and grant permissions', 'yellow');
    log('5. Explore your email analytics!', 'yellow');
  } else {
    log('\n❌ Some tests failed. Please check the issues above.', 'red');
    log('\n🔧 Common fixes:', 'blue');
    log('1. Make sure .env file has correct OAuth credentials', 'yellow');
    log('2. Run: pnpm install && pnpm build', 'yellow');
    log('3. Run: pnpm dev', 'yellow');
    log('4. Check Google Cloud Console OAuth settings', 'yellow');
  }
}

// Run the test
main().catch(console.error);
