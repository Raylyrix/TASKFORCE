const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Taskforce Mailer Desktop App...\n');

// Step 1: Build the frontend
console.log('📦 Building frontend...');
try {
  execSync('pnpm --filter=./apps/frontend build', { stdio: 'inherit' });
  console.log('✅ Frontend built successfully\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Build the backend
console.log('🔧 Building backend...');
try {
  execSync('pnpm --filter=./apps/backend build', { stdio: 'inherit' });
  console.log('✅ Backend built successfully\n');
} catch (error) {
  console.error('❌ Backend build failed:', error.message);
  process.exit(1);
}

// Step 3: Copy frontend build to electron app
console.log('📁 Copying frontend build to Electron app...');
const frontendBuildPath = path.join(__dirname, 'apps/frontend/out');
const electronRenderPath = path.join(__dirname, 'electron-app/renderer');

// Create renderer directory if it doesn't exist
if (!fs.existsSync(electronRenderPath)) {
  fs.mkdirSync(electronRenderPath, { recursive: true });
}

// Copy frontend build files
try {
  execSync(`xcopy "${frontendBuildPath}\\*" "${electronRenderPath}\\" /E /I /Y`, { stdio: 'inherit' });
  console.log('✅ Frontend files copied to Electron app\n');
} catch (error) {
  console.error('❌ Failed to copy frontend files:', error.message);
  process.exit(1);
}

// Step 4: Install Electron dependencies
console.log('📦 Installing Electron dependencies...');
try {
  execSync('cd electron-app && npm install', { stdio: 'inherit' });
  console.log('✅ Electron dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install Electron dependencies:', error.message);
  process.exit(1);
}

// Step 5: Build Electron app
console.log('🔨 Building Electron app...');
try {
  execSync('cd electron-app && npm run build-win', { stdio: 'inherit' });
  console.log('✅ Electron app built successfully\n');
} catch (error) {
  console.error('❌ Electron build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Build completed successfully!');
console.log('📁 Installer location: electron-app/dist/');
console.log('🚀 Ready for distribution!');
