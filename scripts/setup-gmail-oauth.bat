@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up Gmail OAuth Integration...

echo.
echo 📋 Step 1: Google Cloud Console Configuration
echo ===============================================
echo.
echo 1. Go to: https://console.cloud.google.com/
echo 2. Select your project: taskforce-mailer-v2
echo 3. Go to APIs & Services ^> Library
echo 4. Enable these APIs:
echo    - Gmail API (already enabled)
echo    - Google People API (for user info)
echo.
echo 5. Go to APIs & Services ^> OAuth consent screen
echo    - Make sure it's configured for External users
echo    - Add these scopes:
echo      * https://www.googleapis.com/auth/gmail.readonly
echo      * https://www.googleapis.com/auth/gmail.metadata
echo      * https://www.googleapis.com/auth/userinfo.email
echo      * https://www.googleapis.com/auth/userinfo.profile
echo.
echo 6. Go to APIs & Services ^> Credentials
echo    - Edit your OAuth 2.0 Client ID
echo    - Add these Authorized redirect URIs:
echo      * http://localhost:4000/auth/google/callback
echo      * http://localhost:3000/auth/callback
echo.

pause

echo.
echo 📋 Step 2: Environment Configuration
echo =====================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy env.example .env
    echo ✅ Created .env file
) else (
    echo .env file already exists
)

echo.
echo Please verify these settings in your .env file:
echo.
echo GMAIL_CLIENT_ID="1007595181381-n1ildiigmoupnn78n8ekkhlulsfigbfk.apps.googleusercontent.com"
echo GMAIL_CLIENT_SECRET="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"
echo GMAIL_REDIRECT_URI="http://localhost:4000/auth/google/callback"
echo FRONTEND_URL="http://localhost:3000"
echo.

pause

echo.
echo 📋 Step 3: Database Setup
echo ==========================
echo.

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

echo.
echo 📋 Step 4: Start the Application
echo =================================
echo.

echo Starting all services...
echo.
echo Backend API: http://localhost:4000
echo AI Service: http://localhost:4001
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop all services
echo.

pnpm dev

pause
