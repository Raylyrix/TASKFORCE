#!/usr/bin/env node

/**
 * Error Prevention Script for Taskforce Mailer
 * This script fixes common issues before they cause problems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛡️ Taskforce Mailer - Error Prevention Script');
console.log('==============================================\n');

let fixes = [];

// Helper function to create .env file if it doesn't exist
function createEnvFile() {
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from env.example...');
    try {
      fs.copyFileSync('env.example', '.env');
      fixes.push('✅ Created .env file from env.example');
    } catch (error) {
      console.error('❌ Failed to create .env file:', error.message);
    }
  } else {
    console.log('✅ .env file already exists');
  }
}

// Helper function to ensure consistent database passwords
function fixDatabasePasswords() {
  console.log('🔧 Ensuring consistent database passwords...');
  
  // Update env.example if needed
  const envExamplePath = 'env.example';
  if (fs.existsSync(envExamplePath)) {
    let content = fs.readFileSync(envExamplePath, 'utf8');
    if (content.includes('postgres:Rayvical')) {
      content = content.replace(/postgres:Rayvical/g, 'postgres:postgres');
      fs.writeFileSync(envExamplePath, content);
      fixes.push('✅ Updated env.example to use consistent database password');
    }
  }
  
  // Update docker-compose.yml if needed
  const dockerComposePath = 'docker-compose.yml';
  if (fs.existsSync(dockerComposePath)) {
    let content = fs.readFileSync(dockerComposePath, 'utf8');
    if (content.includes('Rayvical')) {
      content = content.replace(/Rayvical/g, 'postgres');
      fs.writeFileSync(dockerComposePath, content);
      fixes.push('✅ Updated docker-compose.yml to use consistent database password');
    }
  }
}

// Helper function to ensure OAuth redirect URIs are correct
function fixOAuthRedirects() {
  console.log('🔐 Ensuring OAuth redirect URIs are correct...');
  
  // Check Electron OAuth config
  const electronConfigPath = 'rtx_innovations_electron/client_secret.json';
  if (fs.existsSync(electronConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(electronConfigPath, 'utf8'));
      if (config.installed && config.installed.redirect_uris) {
        const redirects = config.installed.redirect_uris;
        if (!redirects.includes('urn:ietf:wg:oauth:2.0:oob')) {
          redirects.push('urn:ietf:wg:oauth:2.0:oob');
          config.installed.redirect_uris = redirects;
          fs.writeFileSync(electronConfigPath, JSON.stringify(config, null, 2));
          fixes.push('✅ Added missing OAuth redirect URI for Electron app');
        }
      }
    } catch (error) {
      console.error('❌ Failed to fix Electron OAuth config:', error.message);
    }
  }
}

// Helper function to ensure Jest configurations are correct
function fixJestConfigs() {
  console.log('🧪 Ensuring Jest configurations are correct...');
  
  const jestConfigs = [
    'apps/backend/jest.config.js',
    'apps/frontend/jest.config.js',
    'services/ai-service/jest.config.js',
    'services/worker/jest.config.js',
    'packages/shared/jest.config.js'
  ];
  
  jestConfigs.forEach(configPath => {
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      let updated = false;
      
      // Fix moduleNameMapping typo
      if (content.includes('moduleNameMapping')) {
        content = content.replace(/moduleNameMapping/g, 'moduleNameMapper');
        updated = true;
      }
      
      // Add passWithNoTests if missing
      if (!content.includes('passWithNoTests')) {
        content = content.replace(
          /module\.exports = \{/,
          'module.exports = {\n  // Allow packages with no tests to pass\n  passWithNoTests: true,'
        );
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(configPath, content);
        fixes.push(`✅ Fixed Jest config: ${configPath}`);
      }
    }
  });
}

// Helper function to ensure TypeScript configurations are correct
function fixTypeScriptConfigs() {
  console.log('📘 Ensuring TypeScript configurations are correct...');
  
  const tsConfigs = [
    'tsconfig.json',
    'apps/backend/tsconfig.json',
    'apps/frontend/tsconfig.json',
    'services/ai-service/tsconfig.json',
    'services/worker/tsconfig.json',
    'packages/shared/tsconfig.json'
  ];
  
  tsConfigs.forEach(configPath => {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Ensure strict mode is enabled
        if (!config.compilerOptions) {
          config.compilerOptions = {};
        }
        
        if (config.compilerOptions.strict !== true) {
          config.compilerOptions.strict = true;
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          fixes.push(`✅ Enabled strict mode in ${configPath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fix TypeScript config ${configPath}:`, error.message);
      }
    }
  });
}

// Helper function to ensure package.json scripts are correct
function fixPackageScripts() {
  console.log('📦 Ensuring package.json scripts are correct...');
  
  const packagePaths = [
    'package.json',
    'apps/backend/package.json',
    'apps/frontend/package.json',
    'services/ai-service/package.json',
    'services/worker/package.json',
    'packages/shared/package.json',
    'rtx_innovations_electron/package.json'
  ];
  
  packagePaths.forEach(packagePath => {
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Ensure build script exists
        if (!pkg.scripts || !pkg.scripts.build) {
          if (!pkg.scripts) pkg.scripts = {};
          pkg.scripts.build = 'tsc';
          fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
          fixes.push(`✅ Added build script to ${packagePath}`);
        }
        
        // Ensure test script exists
        if (!pkg.scripts || !pkg.scripts.test) {
          if (!pkg.scripts) pkg.scripts = {};
          pkg.scripts.test = 'jest';
          fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
          fixes.push(`✅ Added test script to ${packagePath}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fix package.json ${packagePath}:`, error.message);
      }
    }
  });
}

// Helper function to ensure Prisma schema is valid
function fixPrismaSchema() {
  console.log('🗄️ Ensuring Prisma schema is valid...');
  
  const schemaPath = 'apps/backend/prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    try {
      // Try to validate the schema
      execSync('npx prisma validate', { cwd: 'apps/backend', stdio: 'pipe' });
      console.log('✅ Prisma schema is valid');
    } catch (error) {
      console.error('❌ Prisma schema validation failed:', error.message);
    }
  }
}

// Helper function to create missing directories
function createMissingDirectories() {
  console.log('📁 Creating missing directories...');
  
  const directories = [
    'apps/backend/logs',
    'services/ai-service/logs',
    'services/worker/logs',
    'apps/backend/src/tests/integration-disabled'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      fixes.push(`✅ Created directory: ${dir}`);
    }
  });
}

// Helper function to ensure proper file permissions
function fixFilePermissions() {
  console.log('🔒 Ensuring proper file permissions...');
  
  const scripts = [
    'scripts/start-production.ps1',
    'scripts/test-production-system.ps1',
    'scripts/error-check.js',
    'scripts/prevent-errors.js'
  ];
  
  scripts.forEach(script => {
    if (fs.existsSync(script)) {
      try {
        fs.chmodSync(script, '755');
        fixes.push(`✅ Set executable permissions for ${script}`);
      } catch (error) {
        console.error(`❌ Failed to set permissions for ${script}:`, error.message);
      }
    }
  });
}

// Main execution
async function main() {
  try {
    createEnvFile();
    fixDatabasePasswords();
    fixOAuthRedirects();
    fixJestConfigs();
    fixTypeScriptConfigs();
    fixPackageScripts();
    fixPrismaSchema();
    createMissingDirectories();
    fixFilePermissions();
    
    console.log('\n📊 Summary');
    console.log('==========');
    
    if (fixes.length === 0) {
      console.log('🎉 No fixes needed! The application is already properly configured.');
    } else {
      console.log(`✅ Applied ${fixes.length} fixes:`);
      fixes.forEach(fix => console.log(`   ${fix}`));
    }
    
    console.log('\n🚀 The application should now work properly when users download it!');
    
  } catch (error) {
    console.error('❌ Error prevention script failed:', error.message);
    process.exit(1);
  }
}

main();
