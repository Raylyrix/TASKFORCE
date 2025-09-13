@echo off
setlocal enabledelayedexpansion

REM Taskforce Analytics Deployment Script for Windows
REM Usage: scripts\deploy.bat [staging|production]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=staging

echo 🚀 Deploying Taskforce Analytics to %ENVIRONMENT%

REM Check if required tools are installed
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ pnpm is required but not installed. Aborting.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install --frozen-lockfile

REM Build all packages
echo 🔨 Building packages...
pnpm build

REM Run tests
echo 🧪 Running tests...
pnpm test

REM Copy environment file
if "%ENVIRONMENT%"=="production" (
    echo 📋 Setting up production environment...
    copy env.production .env
) else (
    echo 📋 Setting up staging environment...
    copy env.example .env
)

REM Start services
echo 🚀 Starting services...
pnpm dev

echo 🎉 Deployment to %ENVIRONMENT% completed successfully!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:4000
echo 🤖 AI Service: http://localhost:4001
