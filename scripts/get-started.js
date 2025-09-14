#!/usr/bin/env node

/**
 * Taskforce Mailer - Quick Start Script
 * This script helps users get started quickly with the application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Taskforce Mailer - Quick Start Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
  } else {
    console.log('⚠️  .env.example not found. Please create .env manually.');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check if database is set up
console.log('\n🗄️  Database Setup');
console.log('==================');

try {
  // Check if Prisma schema exists
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    console.log('✅ Prisma schema found');
    
    // Run database migrations
    console.log('🔄 Running database migrations...');
    execSync('pnpm --filter @taskforce/backend prisma migrate dev --name init', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:Rayvical@localhost:5432/TASKFORCE' }
    });
    console.log('✅ Database migrations completed!');
    
    // Seed demo data
    console.log('🌱 Seeding demo data...');
    execSync('pnpm --filter @taskforce/backend prisma db seed', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:Rayvical@localhost:5432/TASKFORCE' }
    });
    console.log('✅ Demo data seeded successfully!');
  } else {
    console.log('⚠️  Prisma schema not found. Please check your setup.');
  }
} catch (error) {
  console.log('⚠️  Database setup failed:', error.message);
  console.log('   Make sure PostgreSQL is running and DATABASE_URL is correct');
}

// Check Redis connection
console.log('\n🔴 Redis Check');
console.log('===============');
try {
  execSync('redis-cli ping', { stdio: 'pipe' });
  console.log('✅ Redis is running and accessible');
} catch (error) {
  console.log('⚠️  Redis connection failed:', error.message);
  console.log('   Make sure Redis is running on localhost:6379');
}

// Build check
console.log('\n🔨 Build Check');
console.log('===============');
try {
  console.log('🔄 Building all packages...');
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('✅ All packages built successfully!');
} catch (error) {
  console.log('⚠️  Build failed:', error.message);
  console.log('   Some packages may have build issues');
}

// Display next steps
console.log('\n🎉 Setup Complete!');
console.log('==================');
console.log('\n📋 Next Steps:');
console.log('1. Start the application:');
console.log('   pnpm dev');
console.log('\n2. Open your browser:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend:  http://localhost:4000');
console.log('   AI Service: http://localhost:4001');
console.log('\n3. Connect your email:');
console.log('   - Click "Connect Gmail" or "Connect Outlook"');
console.log('   - Complete OAuth flow');
console.log('   - Start exploring your email analytics!');
console.log('\n4. Try the AI Console:');
console.log('   - Ask: "What\'s my busiest day this week?"');
console.log('   - Ask: "Show me contacts I haven\'t replied to recently"');
console.log('   - Generate your first report');
console.log('\n📚 Documentation:');
console.log('   - Quick Start: QUICK_START_GUIDE.md');
console.log('   - Full Guide: USER_GUIDE.md');
console.log('   - Features: FEATURES_SHOWCASE.md');
console.log('\n🚀 Happy analyzing!');

// Check environment variables
console.log('\n⚙️  Environment Check');
console.log('=====================');

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'OPENROUTER_API_KEY'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please add these to your .env file');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n🎯 Ready to transform your email productivity!');
