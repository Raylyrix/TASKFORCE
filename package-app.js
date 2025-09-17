const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging Taskforce Mailer for Distribution...\n');

// Create distribution directory
const distDir = path.join(__dirname, 'dist-package');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy essential files
const filesToCopy = [
  'package.json',
  'pnpm-lock.yaml',
  'env.example',
  'start-app.js',
  'test-scheduling.js',
  'SCHEDULING_SERVICE_README.md',
  'supabase-schema.sql',
  'docker-compose.production.yml'
];

console.log('📋 Copying essential files...');
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️ ${file} not found`);
  }
});

// Copy apps directory
console.log('📁 Copying apps directory...');
copyDir('apps', path.join(distDir, 'apps'));

// Copy packages directory
console.log('📁 Copying packages directory...');
copyDir('packages', path.join(distDir, 'packages'));

// Copy services directory
console.log('📁 Copying services directory...');
copyDir('services', path.join(distDir, 'services'));

// Create startup script
const startupScript = `@echo off
echo 🚀 Starting Taskforce Mailer...
echo.
echo 📋 Prerequisites:
echo   1. Install Node.js (v18 or higher)
echo   2. Install pnpm: npm install -g pnpm
echo   3. Install Redis: https://redis.io/download
echo   4. Copy env.example to .env and configure
echo   5. Run the Supabase schema in your Supabase dashboard
echo.
echo Press any key to continue...
pause > nul
echo.
echo 🔧 Installing dependencies...
pnpm install
echo.
echo 🚀 Starting application...
node start-app.js
`;

fs.writeFileSync(path.join(distDir, 'start.bat'), startupScript);

// Create README for distribution
const distReadme = `# Taskforce Mailer - Distribution Package

## 🚀 Quick Start

1. **Prerequisites:**
   - Node.js v18 or higher
   - pnpm: \`npm install -g pnpm\`
   - Redis server running
   - Supabase account

2. **Setup:**
   \`\`\`bash
   # Copy environment file
   copy env.example .env
   
   # Edit .env with your configuration
   # - Set up SMTP credentials
   # - Configure Supabase settings
   # - Set Redis connection
   
   # Install dependencies
   pnpm install
   
   # Run Supabase schema (in Supabase SQL editor)
   # Copy contents of supabase-schema.sql
   \`\`\`

3. **Start the application:**
   \`\`\`bash
   # Windows
   start.bat
   
   # Or manually
   node start-app.js
   \`\`\`

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Health Check: http://localhost:4000/health

## 📧 Email Scheduling Features

- Schedule emails for future delivery
- Offline resilience (emails sent even if PC is off)
- Retry logic with exponential backoff
- Audit trail and compliance logging
- Supabase integration for data persistence

## 🔧 Configuration

Edit \`.env\` file with your settings:
- SMTP credentials for email sending
- Supabase URL and keys
- Redis connection details
- JWT secret for authentication

## 📚 Documentation

See \`SCHEDULING_SERVICE_README.md\` for detailed API documentation.

## 🐳 Docker Deployment

For production deployment:
\`\`\`bash
docker-compose -f docker-compose.production.yml up -d
\`\`\`

## 🆘 Support

For issues and questions:
1. Check the logs in the terminal
2. Verify all prerequisites are installed
3. Ensure Redis is running
4. Check Supabase connection
`;

fs.writeFileSync(path.join(distDir, 'README.md'), distReadme);

console.log('\n✅ Package created successfully!');
console.log(`📁 Distribution package: ${distDir}`);
console.log('\n📋 Next steps:');
console.log('1. Copy the dist-package folder to your target PC');
console.log('2. Run start.bat or node start-app.js');
console.log('3. Configure .env file with your settings');
console.log('4. Run the Supabase schema in your Supabase dashboard');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠️ ${src} not found`);
    return;
  }
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
