# Taskforce Mailer - Production Startup Script
# This script starts all services for production use

Write-Host "🚀 Taskforce Mailer - Production Startup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([string]$Url, [string]$ServiceName, [int]$TimeoutSeconds = 30)
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName is ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            # Service not ready yet
        }
        
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "⏳ Waiting for $ServiceName... ($elapsed/$TimeoutSeconds)" -ForegroundColor Yellow
    }
    
    Write-Host "❌ $ServiceName failed to start within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Check environment
Write-Host "`n🔍 Checking Environment..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env" -Force
}

# Check PostgreSQL
Write-Host "`n🗄️ Checking PostgreSQL..." -ForegroundColor Cyan
try {
    $pgService = Get-Service -Name "*postgres*" -ErrorAction Stop
    if ($pgService.Status -ne "Running") {
        Write-Host "🔄 Starting PostgreSQL..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Start-Sleep -Seconds 5
    }
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Check Redis
Write-Host "`n🗄️ Checking Redis..." -ForegroundColor Cyan
if (-not (Test-Port 6379)) {
    Write-Host "⚠️ Redis not running on port 6379. Checking Docker containers..." -ForegroundColor Yellow
    
    # Check if Docker is available and Redis container exists
    $dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerCheck) {
        # Check if Redis container exists
        try {
            $redisContainer = docker ps -a --filter "name=redis" --format "{{.Names}}" | Where-Object { $_ -match "redis" }
            
            if ($redisContainer) {
                Write-Host "🐳 Found Redis container: $redisContainer" -ForegroundColor Cyan
                Write-Host "🔄 Starting Redis container..." -ForegroundColor Yellow
                docker start $redisContainer
                Start-Sleep -Seconds 3
                
                if (Test-Port 6379) {
                    Write-Host "✅ Redis container started successfully" -ForegroundColor Green
                } else {
                    Write-Host "❌ Failed to start Redis container" -ForegroundColor Red
                    Write-Host "   Try: docker run -d --name my-redis -p 6379:6379 redis:alpine" -ForegroundColor Yellow
                }
            } else {
                Write-Host "🐳 No Redis container found. Creating new one..." -ForegroundColor Cyan
                docker run -d --name my-redis -p 6379:6379 redis:alpine
                Start-Sleep -Seconds 5
                
                if (Test-Port 6379) {
                    Write-Host "✅ Redis container created and started" -ForegroundColor Green
                } else {
                    Write-Host "❌ Failed to create Redis container" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "❌ Docker command failed. Please check Docker installation" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Docker not available. Please install Docker or start Redis manually" -ForegroundColor Red
        Write-Host "   Docker: https://docs.docker.com/get-docker/" -ForegroundColor Yellow
        Write-Host "   Manual: redis-server" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Redis is running" -ForegroundColor Green
}

# Setup database
Write-Host "`n🗄️ Setting up database..." -ForegroundColor Cyan
Set-Location "apps/backend"
try {
    npx prisma db push --accept-data-loss
    Write-Host "✅ Database schema updated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database setup failed, but continuing..." -ForegroundColor Yellow
}
Set-Location "../.."

# Build all packages
Write-Host "`n🔨 Building all packages..." -ForegroundColor Cyan
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ All packages built successfully" -ForegroundColor Green

# Start services in order
Write-Host "`n🚀 Starting Services..." -ForegroundColor Cyan

# 1. Start AI Service
Write-Host "`n🤖 Starting AI Service..." -ForegroundColor Cyan
$aiServiceProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd services/ai-service && npm run dev" -WindowStyle Minimized -PassThru

if (Wait-ForService -Url "http://localhost:4001/health" -ServiceName "AI Service" -TimeoutSeconds 20) {
    Write-Host "✅ AI Service started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ AI Service failed to start" -ForegroundColor Red
}

# 2. Start Backend Service
Write-Host "`n🔧 Starting Backend Service..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd apps/backend && npm run dev" -WindowStyle Minimized -PassThru

if (Wait-ForService -Url "http://localhost:4000/health" -ServiceName "Backend API" -TimeoutSeconds 30) {
    Write-Host "✅ Backend API started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Backend API failed to start" -ForegroundColor Red
}

# 3. Start Frontend Service
Write-Host "`n🌐 Starting Frontend Service..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd apps/frontend && npm run dev" -WindowStyle Minimized -PassThru

if (Wait-ForService -Url "http://localhost:3000" -ServiceName "Frontend" -TimeoutSeconds 30) {
    Write-Host "✅ Frontend started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend failed to start" -ForegroundColor Red
}

# 4. Start Worker Service (optional)
Write-Host "`n⚙️ Starting Worker Service..." -ForegroundColor Cyan
$workerProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd services/worker && npm run dev" -WindowStyle Minimized -PassThru

# Test all services
Write-Host "`n🏥 Testing All Services..." -ForegroundColor Cyan

$services = @(
    @{ Name = "Frontend"; Url = "http://localhost:3000" },
    @{ Name = "Backend API"; Url = "http://localhost:4000/health" },
    @{ Name = "AI Service"; Url = "http://localhost:4001/health" }
)

$allHealthy = $true
foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $($service.Name) returned status $($response.StatusCode)" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } catch {
        Write-Host "❌ $($service.Name) is not responding" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host "`n🎉 Production Startup Complete!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

if ($allHealthy) {
    Write-Host "`n✅ All services are running and healthy!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some services may have issues. Check the logs above." -ForegroundColor Yellow
}

Write-Host "`n📋 Service URLs:" -ForegroundColor Cyan
Write-Host "• 🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "• 🔧 Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "• 🤖 AI Service: http://localhost:4001" -ForegroundColor White

Write-Host "`n🔧 Authentication Test:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000" -ForegroundColor White
Write-Host "2. Click 'Connect Gmail' button" -ForegroundColor White
Write-Host "3. Complete OAuth flow" -ForegroundColor White
Write-Host "4. Access Analytics Dashboard" -ForegroundColor White

Write-Host "`n📊 Analytics Dashboard:" -ForegroundColor Cyan
Write-Host "• Real-time email analytics" -ForegroundColor White
Write-Host "• AI-powered insights" -ForegroundColor White
Write-Host "• Professional reports" -ForegroundColor White
Write-Host "• Predictive analytics" -ForegroundColor White

Write-Host "`n⏹️ To stop all services:" -ForegroundColor Yellow
Write-Host "• Close the terminal windows" -ForegroundColor White
Write-Host "• Or press Ctrl+C in each service terminal" -ForegroundColor White

Write-Host "`n🔍 Process IDs (for monitoring):" -ForegroundColor Cyan
Write-Host "• AI Service: $($aiServiceProcess.Id)" -ForegroundColor White
Write-Host "• Backend: $($backendProcess.Id)" -ForegroundColor White
Write-Host "• Frontend: $($frontendProcess.Id)" -ForegroundColor White
Write-Host "• Worker: $($workerProcess.Id)" -ForegroundColor White

# Keep script running to monitor services
Write-Host "`n⏳ Press Ctrl+C to stop all services..." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep -Seconds 30
        
        # Check if processes are still running
        $processes = @($aiServiceProcess, $backendProcess, $frontendProcess, $workerProcess)
        $running = 0
        
        foreach ($proc in $processes) {
            if ($proc -and !$proc.HasExited) {
                $running++
            }
        }
        
        if ($running -lt $processes.Count) {
            Write-Host "⚠️ Some services have stopped. Running: $running/$($processes.Count)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "`n🛑 Stopping all services..." -ForegroundColor Red
    
    # Terminate all processes
    $processes = @($aiServiceProcess, $backendProcess, $frontendProcess, $workerProcess)
    foreach ($proc in $processes) {
        if ($proc -and !$proc.HasExited) {
            try {
                $proc.Kill()
                Write-Host "✅ Stopped process $($proc.Id)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Could not stop process $($proc.Id)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n👋 All services stopped. Goodbye!" -ForegroundColor Green
}
