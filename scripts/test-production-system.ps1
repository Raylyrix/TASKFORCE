# Taskforce Mailer - Production System Test
# Comprehensive testing of all features

Write-Host "🧪 Taskforce Mailer - Production System Test" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Test results tracking
$testResults = @{
    "Database Connection" = $false
    "AI Service" = $false
    "Backend API" = $false
    "Frontend" = $false
    "Authentication" = $false
    "Analytics Dashboard" = $false
    "Data Extraction" = $false
    "Error Handling" = $false
}

function Test-Service {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "`n🔍 Testing $Name..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ $Name is working correctly" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ $Name returned status $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $Name failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-Database {
    Write-Host "`n🗄️ Testing Database Connection..." -ForegroundColor Cyan
    
    try {
        Set-Location "apps/backend"
        $result = npx prisma db push --accept-data-loss 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database connection successful" -ForegroundColor Green
            $testResults["Database Connection"] = $true
        } else {
            Write-Host "❌ Database connection failed" -ForegroundColor Red
            Write-Host "Error: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Database test failed: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        Set-Location "../.."
    }
}

function Test-AI-Service {
    Write-Host "`n🤖 Testing AI Service..." -ForegroundColor Cyan
    
    # Test OpenRouter API key
    if ($env:OPENROUTER_API_KEY) {
        Write-Host "✅ OpenRouter API key is configured" -ForegroundColor Green
        
        # Test AI service endpoint
        if (Test-Service -Name "AI Service Health" -Url "http://localhost:4001/health") {
            $testResults["AI Service"] = $true
        }
        
        # Test AI query endpoint
        try {
            $body = @{
                query = "What's my email volume today?"
                context = "test"
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri "http://localhost:4001/api/ai/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ AI query processing works" -ForegroundColor Green
            } else {
                Write-Host "⚠️ AI query returned status $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ AI query test failed (service may not be running): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ OpenRouter API key not configured" -ForegroundColor Red
        Write-Host "Please set OPENROUTER_API_KEY in .env file" -ForegroundColor Yellow
    }
}

function Test-Authentication {
    Write-Host "`n🔐 Testing Authentication System..." -ForegroundColor Cyan
    
    # Test OAuth endpoints
    $oauthEndpoints = @(
        @{ Name = "OAuth Init"; Url = "http://localhost:4000/auth/google" },
        @{ Name = "OAuth Status"; Url = "http://localhost:4000/auth/status" }
    )
    
    $authWorking = $true
    foreach ($endpoint in $oauthEndpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ $($endpoint.Name) endpoint accessible" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ $($endpoint.Name) endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
            $authWorking = $false
        }
    }
    
    if ($authWorking) {
        $testResults["Authentication"] = $true
    }
}

function Test-Analytics-Dashboard {
    Write-Host "`n📊 Testing Analytics Dashboard..." -ForegroundColor Cyan
    
    # Test frontend
    if (Test-Service -Name "Frontend" -Url "http://localhost:3000") {
        $testResults["Frontend"] = $true
        
        # Test analytics endpoints
        $analyticsEndpoints = @(
            @{ Name = "Analytics Metrics"; Url = "http://localhost:4000/api/analytics/metrics" },
            @{ Name = "Analytics Insights"; Url = "http://localhost:4000/api/analytics/insights" },
            @{ Name = "Analytics Relationships"; Url = "http://localhost:4000/api/analytics/relationships" }
        )
        
        $analyticsWorking = $true
        foreach ($endpoint in $analyticsEndpoints) {
            try {
                $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                Write-Host "✅ $($endpoint.Name) endpoint working" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ $($endpoint.Name) endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
                $analyticsWorking = $false
            }
        }
        
        if ($analyticsWorking) {
            $testResults["Analytics Dashboard"] = $true
        }
    }
}

function Test-Data-Extraction {
    Write-Host "`n📧 Testing Data Extraction..." -ForegroundColor Cyan
    
    # Test Gmail connector
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/connectors/gmail/test" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Gmail connector accessible" -ForegroundColor Green
        $testResults["Data Extraction"] = $true
    } catch {
        Write-Host "⚠️ Gmail connector not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

function Test-Error-Handling {
    Write-Host "`n🛡️ Testing Error Handling..." -ForegroundColor Cyan
    
    # Test invalid endpoints
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/nonexistent" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "⚠️ Invalid endpoint returned status $($response.StatusCode)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Error handling working (404 for invalid endpoint)" -ForegroundColor Green
            $testResults["Error Handling"] = $true
        } else {
            Write-Host "⚠️ Unexpected error handling: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Main test execution
Write-Host "`n🚀 Starting Production System Tests..." -ForegroundColor Green

# Test database
Test-Database

# Test services (only if they're running)
$services = @(
    @{ Name = "AI Service"; Url = "http://localhost:4001/health" },
    @{ Name = "Backend API"; Url = "http://localhost:4000/health" },
    @{ Name = "Frontend"; Url = "http://localhost:3000" }
)

foreach ($service in $services) {
    if (Test-Service -Name $service.Name -Url $service.Url) {
        switch ($service.Name) {
            "AI Service" { $testResults["AI Service"] = $true }
            "Backend API" { $testResults["Backend API"] = $true }
            "Frontend" { $testResults["Frontend"] = $true }
        }
    }
}

# Test AI service features
Test-AI-Service

# Test authentication
Test-Authentication

# Test analytics dashboard
Test-Analytics-Dashboard

# Test data extraction
Test-Data-Extraction

# Test error handling
Test-Error-Handling

# Generate test report
Write-Host "`n📋 Test Results Summary:" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

$totalTests = $testResults.Count
$passedTests = ($testResults.Values | Where-Object { $_ -eq $true }).Count
$failedTests = $totalTests - $passedTests

foreach ($test in $testResults.GetEnumerator()) {
    $status = if ($test.Value) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "$status $($test.Key)" -ForegroundColor $color
}

Write-Host "`n📊 Overall Results:" -ForegroundColor Cyan
Write-Host "• Total Tests: $totalTests" -ForegroundColor White
Write-Host "• Passed: $passedTests" -ForegroundColor Green
Write-Host "• Failed: $failedTests" -ForegroundColor Red
Write-Host "• Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor White

if ($passedTests -eq $totalTests) {
    Write-Host "`n🎉 ALL TESTS PASSED! System is production-ready!" -ForegroundColor Green
} elseif ($passedTests -gt ($totalTests / 2)) {
    Write-Host "`n⚠️ Most tests passed. Some services may need attention." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Many tests failed. System needs significant work." -ForegroundColor Red
}

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start all services using: PowerShell -ExecutionPolicy Bypass -File start-production.ps1" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 to test the frontend" -ForegroundColor White
Write-Host "3. Test authentication flow with Google Sign-in" -ForegroundColor White
Write-Host "4. Access Analytics Dashboard through Electron app" -ForegroundColor White
Write-Host "5. Test AI features with natural language queries" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "• Production Status: PRODUCTION_STATUS.md" -ForegroundColor White
Write-Host "• User Guide: USER_GUIDE.md" -ForegroundColor White
Write-Host "• Quick Start: QUICK_START_GUIDE.md" -ForegroundColor White
Write-Host "• Features Showcase: FEATURES_SHOWCASE.md" -ForegroundColor White
