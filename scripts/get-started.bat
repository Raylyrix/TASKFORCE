@echo off
echo 🚀 Taskforce Mailer - Quick Start Setup
echo =====================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env file created successfully!
    ) else (
        echo ⚠️  .env.example not found. Please create .env manually.
    )
) else (
    echo ✅ .env file already exists
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    pnpm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed successfully!
    ) else (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🗄️  Database Setup
echo ==================
echo 🔄 Running database migrations...
pnpm --filter @taskforce/backend prisma migrate dev --name init
if %errorlevel% equ 0 (
    echo ✅ Database migrations completed!
    echo 🌱 Seeding demo data...
    pnpm --filter @taskforce/backend prisma db seed
    if %errorlevel% equ 0 (
        echo ✅ Demo data seeded successfully!
    ) else (
        echo ⚠️  Demo data seeding failed
    )
) else (
    echo ⚠️  Database setup failed
    echo    Make sure PostgreSQL is running and DATABASE_URL is correct
)

echo.
echo 🔨 Build Check
echo ===============
echo 🔄 Building all packages...
pnpm build
if %errorlevel% equ 0 (
    echo ✅ All packages built successfully!
) else (
    echo ⚠️  Build failed - some packages may have issues
)

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo 📋 Next Steps:
echo 1. Start the application:
echo    pnpm dev
echo.
echo 2. Open your browser:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:4000
echo    AI Service: http://localhost:4001
echo.
echo 3. Connect your email:
echo    - Click "Connect Gmail" or "Connect Outlook"
echo    - Complete OAuth flow
echo    - Start exploring your email analytics!
echo.
echo 4. Try the AI Console:
echo    - Ask: "What's my busiest day this week?"
echo    - Ask: "Show me contacts I haven't replied to recently"
echo    - Generate your first report
echo.
echo 📚 Documentation:
echo    - Quick Start: QUICK_START_GUIDE.md
echo    - Full Guide: USER_GUIDE.md
echo    - Features: FEATURES_SHOWCASE.md
echo.
echo 🚀 Happy analyzing!
echo.
pause
