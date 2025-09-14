# Taskforce Mailer - Project Startup Script
# This script will diagnose and fix issues, then start all services

Write-Host "🚀 Taskforce Mailer - Starting Project..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Check PostgreSQL
Write-Host "`n🗄️ Checking PostgreSQL..." -ForegroundColor Cyan
try {
    $pgService = Get-Service -Name "*postgres*" -ErrorAction Stop
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ PostgreSQL service found but not running" -ForegroundColor Yellow
        Start-Service $pgService.Name
        Write-Host "✅ PostgreSQL started" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Check Redis (optional for now)
Write-Host "`n🔴 Checking Redis..." -ForegroundColor Cyan
try {
    $redisService = Get-Service -Name "*redis*" -ErrorAction Stop
    if ($redisService.Status -eq "Running") {
        Write-Host "✅ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis not running (optional for basic functionality)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Redis not installed (optional for basic functionality)" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build all packages
Write-Host "`n🔨 Building all packages..." -ForegroundColor Cyan
pnpm build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All packages built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Setup database
Write-Host "`n🗄️ Setting up database..." -ForegroundColor Cyan
Set-Location "apps/backend"
try {
    npx prisma db push
    Write-Host "✅ Database schema updated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database setup failed, but continuing..." -ForegroundColor Yellow
}
Set-Location "../.."

# Start backend service
Write-Host "`n🚀 Starting Backend Service..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd apps/backend && npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 3

# Test backend health
Write-Host "`n🏥 Testing Backend Health..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is healthy and running!" -ForegroundColor Green
        Write-Host "Backend URL: http://localhost:4000" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    Write-Host "Backend may still be starting up..." -ForegroundColor Yellow
}

# Start frontend service
Write-Host "`n🌐 Starting Frontend Service..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd apps/frontend && npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 5

# Test frontend
Write-Host "`n🏥 Testing Frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running!" -ForegroundColor Green
        Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Frontend health check failed" -ForegroundColor Red
    Write-Host "Frontend may still be starting up..." -ForegroundColor Yellow
}

# Start AI service
Write-Host "`n🤖 Starting AI Service..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "cd services/ai-service && npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 3

# Test AI service
Write-Host "`n🏥 Testing AI Service..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ AI Service is running!" -ForegroundColor Green
        Write-Host "AI Service URL: http://localhost:4001" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ AI Service health check failed" -ForegroundColor Red
    Write-Host "AI Service may still be starting up..." -ForegroundColor Yellow
}

Write-Host "`n🎉 Project Startup Complete!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "`n📋 Service URLs:" -ForegroundColor Cyan
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "• Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "• AI Service: http://localhost:4001" -ForegroundColor White
Write-Host "`n🔧 To test authentication:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000" -ForegroundColor White
Write-Host "2. Click 'Connect Gmail' button" -ForegroundColor White
Write-Host "3. Complete OAuth flow" -ForegroundColor White
Write-Host "4. Access Analytics Dashboard" -ForegroundColor White
Write-Host "`n📊 To test Analytics Dashboard:" -ForegroundColor Cyan
Write-Host "1. Open the demo: test-seamless-ux.html" -ForegroundColor White
Write-Host "2. Click 'Analytics Dashboard' button" -ForegroundColor White
Write-Host "3. Experience the seamless integration" -ForegroundColor White

Write-Host "`n⏹️ To stop all services, press Ctrl+C in each terminal window" -ForegroundColor Yellow

