@echo off
setlocal enabledelayedexpansion

echo 🚀 Taskforce Analytics Quick Start
echo ================================

echo.
echo 📋 Step 1: Environment Setup
echo ============================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy env.example .env
    echo ✅ .env file created
) else (
    echo ✅ .env file exists
)

echo.
echo 📋 Step 2: Install Dependencies
echo ==============================
echo.
pnpm install

echo.
echo 📋 Step 3: Build Application
echo ===========================
echo.
pnpm build

echo.
echo 📋 Step 4: Start Services
echo ========================
echo.
echo Starting all services...
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:4000
echo 🤖 AI Service: http://localhost:4001
echo.
echo Press Ctrl+C to stop all services
echo.

pnpm dev
