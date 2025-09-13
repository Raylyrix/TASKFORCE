@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up Taskforce Analytics Platform...

REM Check prerequisites
echo 📋 Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed.
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ pnpm is required but not installed.
    echo Installing pnpm...
    npm install -g pnpm
)

where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL client not found. Please ensure PostgreSQL is installed.
)

where redis-cli >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Redis client not found. Please ensure Redis is installed.
)

echo ✅ Prerequisites check complete

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Setup environment
if not exist .env (
    echo ⚙️  Setting up environment configuration...
    copy env.example .env
    echo ✅ Created .env file from template
    echo 📝 Please edit .env file with your configuration
) else (
    echo ✅ Environment file already exists
)

REM Setup database
echo 🗄️  Setting up database...

REM Check if PostgreSQL is available
where psql >nul 2>nul
if %errorlevel% equ 0 (
    echo Creating database if it doesn't exist...
    psql -U postgres -c "CREATE DATABASE TASKFORCE;" 2>nul || echo Database already exists
    
    echo Running database migrations...
    pnpm --filter backend prisma migrate dev --name init
    
    echo Seeding demo data...
    pnpm --filter backend prisma db seed
) else (
    echo ⚠️  PostgreSQL not available. Please install and start PostgreSQL.
    echo Then run: pnpm --filter backend prisma migrate dev
)

REM Build shared packages
echo 🔨 Building shared packages...
pnpm --filter @taskforce/shared build

echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your API keys and configuration
echo 2. Ensure PostgreSQL and Redis are running
echo 3. Run 'pnpm dev' to start development servers
echo.
echo 🔑 Demo credentials:
echo Admin: admin@taskforce-demo.com / demo123
echo Analyst: analyst@taskforce-demo.com / demo123
echo.
echo 🌐 URLs:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:4000
echo Health: http://localhost:4000/health

pause
