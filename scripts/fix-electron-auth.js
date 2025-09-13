#!/usr/bin/env node

/**
 * Electron Authentication Fix Script
 * 
 * This script helps fix OAuth authentication issues in the Electron app
 * by providing fresh tokens and proper configuration.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_BASE = 'http://localhost:4000';

console.log('🔧 Taskforce Analytics - Electron Authentication Fix Tool');
console.log('========================================================\n');

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            hostname: 'localhost',
            port: 4000,
            path: url,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ success: false, error: 'Invalid JSON response' });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function checkBackendHealth() {
    console.log('1. Checking backend health...');
    try {
        const response = await makeRequest('/health');
        if (response.success) {
            console.log('   ✅ Backend is running and healthy');
            return true;
        } else {
            console.log('   ❌ Backend health check failed');
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Backend connection failed: ${error.message}`);
        console.log('   💡 Make sure to run: pnpm dev (in the backend directory)');
        return false;
    }
}

async function getAuthorizationUrl() {
    console.log('\n2. Getting authorization URL...');
    try {
        const response = await makeRequest('/auth/electron/authorize');
        if (response.success) {
            console.log('   ✅ Authorization URL generated');
            console.log(`   📋 URL: ${response.data.authUrl}`);
            return response.data.authUrl;
        } else {
            console.log(`   ❌ Failed to get authorization URL: ${response.error}`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Error getting authorization URL: ${error.message}`);
        return null;
    }
}

function openUrl(url) {
    const { exec } = require('child_process');
    const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${start} ${url}`);
}

async function exchangeCodeForTokens(code) {
    console.log('\n3. Exchanging authorization code for tokens...');
    try {
        const response = await makeRequest('/auth/electron/token-exchange', {
            method: 'POST',
            body: { code }
        });
        
        if (response.success) {
            console.log('   ✅ Tokens exchanged successfully!');
            console.log(`   👤 User: ${response.data.user.email}`);
            console.log(`   📧 Mailbox: ${response.data.mailbox.email}`);
            return response.data;
        } else {
            console.log(`   ❌ Token exchange failed: ${response.error}`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Error exchanging tokens: ${error.message}`);
        return null;
    }
}

async function main() {
    // Check if backend is running
    const backendHealthy = await checkBackendHealth();
    if (!backendHealthy) {
        console.log('\n🚨 Please start the backend first:');
        console.log('   cd apps/backend');
        console.log('   pnpm dev');
        process.exit(1);
    }

    // Get authorization URL
    const authUrl = await getAuthorizationUrl();
    if (!authUrl) {
        process.exit(1);
    }

    // Open browser for authorization
    console.log('\n4. Opening browser for authorization...');
    console.log('   🌐 Opening browser...');
    openUrl(authUrl);
    
    console.log('\n📋 Instructions:');
    console.log('   1. Complete the Google OAuth flow in the browser');
    console.log('   2. Copy the authorization code from the URL or page');
    console.log('   3. Paste it below and press Enter');
    console.log('   4. Your Electron app should work after this!');

    // Get authorization code from user
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('\n🔑 Paste your authorization code here: ', async (code) => {
        rl.close();
        
        if (!code.trim()) {
            console.log('❌ No authorization code provided');
            process.exit(1);
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code.trim());
        
        if (tokens) {
            console.log('\n🎉 SUCCESS! Your authentication is now fixed!');
            console.log('\n📋 Next steps:');
            console.log('   1. Go back to your Electron app');
            console.log('   2. Try logging in again');
            console.log('   3. The authentication should work now');
            
            // Save tokens to a file for reference
            const tokenFile = path.join(__dirname, '..', 'electron-tokens.json');
            fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
            console.log(`\n💾 Tokens saved to: ${tokenFile}`);
            
            console.log('\n🔧 If you still have issues:');
            console.log('   - Check your .env file has correct GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET');
            console.log('   - Make sure your Google Cloud Console OAuth app is configured for desktop');
            console.log('   - Verify the redirect URI is set to "urn:ietf:wg:oauth:2.0:oob"');
        } else {
            console.log('\n❌ Authentication fix failed');
            console.log('\n🔧 Troubleshooting:');
            console.log('   1. Make sure your authorization code is correct');
            console.log('   2. Check that your OAuth credentials are valid');
            console.log('   3. Verify your Google Cloud Console configuration');
        }
    });
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n❌ Unhandled rejection:', reason);
    process.exit(1);
});

// Run the main function
main().catch(console.error);
