@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up GitHub Repository for Taskforce Analytics
echo =====================================================

echo.
echo 📋 Step 1: Create GitHub Repository
echo ==================================
echo.
echo 1. Go to: https://github.com/new
echo 2. Repository name: taskforce-analytics
echo 3. Description: Professional Email Analytics Platform with Gmail OAuth and AI Insights
echo 4. Set to: Public (or Private if preferred)
echo 5. DO NOT initialize with README, .gitignore, or license
echo 6. Click "Create repository"
echo.

pause

echo.
echo 📋 Step 2: Add Remote Origin
echo ============================
echo.

REM Get the repository URL from user
set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/taskforce-analytics.git): "

if "%REPO_URL%"=="" (
    echo ❌ Repository URL is required
    pause
    exit /b 1
)

echo Adding remote origin...
git remote add origin %REPO_URL%

echo.
echo 📋 Step 3: Push to GitHub
echo =========================
echo.

echo Pushing to main branch...
git branch -M main
git push -u origin main

echo.
echo 🎉 Repository Setup Complete!
echo =============================
echo.
echo Your Taskforce Analytics platform is now on GitHub!
echo.
echo 📊 What happens next:
echo 1. GitHub Actions will automatically run the CI/CD pipeline
echo 2. Tests will be executed automatically
echo 3. Security scans will be performed
echo 4. Docker images will be built
echo 5. Deployment artifacts will be created
echo.
echo 🔗 View your repository: %REPO_URL%
echo 🔗 View Actions: %REPO_URL%/actions
echo.

pause
