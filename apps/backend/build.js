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

  if (isCI) {
    // In CI, avoid DB auth issues by generating client using a temporary SQLite schema
    const sourceSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const ciSchemaDir = path.join(__dirname, 'prisma');
    const ciSchemaPath = path.join(ciSchemaDir, 'schema.ci.generated.prisma');

    if (!fs.existsSync(sourceSchemaPath)) {
      throw new Error(`Prisma schema not found at ${sourceSchemaPath}`);
    }

    const original = fs.readFileSync(sourceSchemaPath, 'utf8');

    // Replace datasource to use SQLite while keeping all models/enums identical
    const ciSchema = original
      .replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"')
      .replace(/url\s*=\s*env\("DATABASE_URL"\).*\n/g, 'url      = "file:./dev.db"\n');

    fs.writeFileSync(ciSchemaPath, ciSchema, 'utf8');

    console.log('🔧 Generating Prisma client (CI mode, SQLite schema)...');
    execSync(`npx prisma generate --schema ${ciSchemaPath}`, { stdio: 'inherit', cwd: __dirname });
  } else {
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  }

  console.log('🏗️ Compiling TypeScript...');
  execSync('npx tsc --skipLibCheck', { stdio: 'inherit', cwd: __dirname });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
