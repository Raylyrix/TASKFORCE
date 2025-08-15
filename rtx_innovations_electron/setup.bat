@echo off
echo 🚀 RTX Innovations - Setup Script
echo ===================================
echo.

echo 🧹 Cleaning old app data (if any)...
if exist "%LOCALAPPDATA%\task-force-mailer" rmdir /S /Q "%LOCALAPPDATA%\task-force-mailer"
if exist "%APPDATA%\task-force-mailer" rmdir /S /Q "%APPDATA%\task-force-mailer"
if exist "%USERPROFILE%\Documents\TaskForce\logs" rmdir /S /Q "%USERPROFILE%\Documents\TaskForce\logs"

echo 📦 Installing dependencies...
npm install --no-fund --no-audit

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!
echo.

echo 🔧 Setting up development environment...
echo.

echo 🚀 Starting development server...
echo.
echo 📱 The application will open in a new window
echo 🔧 Developer tools will be available
echo 📝 Make changes to files and see them live!
echo.

npm run dev

pause 