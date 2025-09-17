@echo off
echo 🚀 Starting Taskforce Mailer...
echo.
echo 📋 Prerequisites:
echo   1. Install Node.js (v18 or higher)
echo   2. Install pnpm: npm install -g pnpm
echo   3. Install Redis: https://redis.io/download
echo   4. Copy env.example to .env and configure
echo   5. Run the Supabase schema in your Supabase dashboard
echo.
echo Press any key to continue...
pause > nul
echo.
echo 🔧 Installing dependencies...
pnpm install
echo.
echo 🚀 Starting application...
node start-app.js
