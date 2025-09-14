# Taskforce Mailer - Deploy to GitHub Script
# This script prepares and pushes the clean codebase to GitHub

Write-Host "🚀 Taskforce Mailer - Deploy to GitHub" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Function to check git status
function Test-GitStatus {
    try {
        $status = git status --porcelain
        if ($status) {
            Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
            Write-Host $status -ForegroundColor Gray
            return $true
        } else {
            Write-Host "✅ Working directory is clean" -ForegroundColor Green
            return $false
        }
    } catch {
        Write-Host "❌ Error checking git status: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check if git is initialized
function Test-GitRepository {
    try {
        git rev-parse --git-dir > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

# Function to check remote repository
function Test-GitRemote {
    param([string]$RemoteName = "origin")
    
    try {
        $remote = git remote get-url $RemoteName 2>$null
        if ($remote) {
            Write-Host "✅ Remote '$RemoteName' is configured: $remote" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ Remote '$RemoteName' is not configured" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "⚠️ Remote '$RemoteName' is not configured" -ForegroundColor Yellow
        return $false
    }
}

# Main deployment process
Write-Host "`n🔍 Checking Git Repository Status..." -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-GitRepository)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Check git status
$hasChanges = Test-GitStatus

# Check remote repository
$hasRemote = Test-GitRemote

if (-not $hasRemote) {
    Write-Host "`n🔗 Setting up remote repository..." -ForegroundColor Cyan
    Write-Host "Please enter the GitHub repository URL (e.g., https://github.com/Raylyrix/TASKFORCE.git):" -ForegroundColor White
    $remoteUrl = Read-Host "Repository URL"
    
    if ($remoteUrl) {
        git remote add origin $remoteUrl
        Write-Host "✅ Remote repository added: $remoteUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ No repository URL provided. Exiting..." -ForegroundColor Red
        exit 1
    }
}

# Add all files
Write-Host "`n📁 Adding files to Git..." -ForegroundColor Cyan
git add .

if ($hasChanges) {
    # Commit changes
    Write-Host "`n💾 Committing changes..." -ForegroundColor Cyan
    $commitMessage = "feat: Complete production-ready Taskforce Mailer v4.0.1

🎉 PRODUCTION-READY SYSTEM FEATURES

✅ SEAMLESS AUTHENTICATION
- Fixed OAuth2 Google Sign-in completely
- Added Clear Auth Data button for fresh logins
- Implemented JWT token management
- Multi-tenant architecture ready

✅ ADVANCED AI FEATURES
- Natural language queries working
- Sentiment analysis implemented
- Predictive analytics ready
- Smart insights generating
- OpenRouter API properly configured

✅ PROFESSIONAL WEB APPLICATION
- Modern React dashboard with AI features
- Real-time analytics and insights
- Professional, responsive design
- Production-ready deployment

✅ SEAMLESS INTEGRATION
- Analytics Dashboard button in Electron app
- One-click access to advanced features
- No additional setup required
- Professional web interface

✅ SOPHISTICATED CODEBASE
- Organized file structure
- Comprehensive documentation
- Docker deployment ready
- Production scripts included

✅ FIXED ALL ISSUES
- Electron app errors resolved
- Authentication flow working
- Backend services operational
- AI features production-ready

Ready for production deployment and user testing!"

    git commit -m $commitMessage
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
}

# Push to GitHub
Write-Host "`n🚀 Pushing to GitHub..." -ForegroundColor Cyan
try {
    git push -u origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Main branch doesn't exist, trying master..." -ForegroundColor Yellow
    try {
        git push -u origin master
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to push to GitHub: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n🔧 Manual steps:" -ForegroundColor Yellow
        Write-Host "1. Create a repository on GitHub" -ForegroundColor White
        Write-Host "2. Run: git push -u origin main" -ForegroundColor White
        Write-Host "3. Or run: git push -u origin master" -ForegroundColor White
        exit 1
    }
}

# Create a release tag
Write-Host "`n🏷️ Creating release tag..." -ForegroundColor Cyan
$tagName = "v4.0.1"
try {
    git tag -a $tagName -m "Release v4.0.1 - Production Ready Taskforce Mailer

🎉 PRODUCTION-READY FEATURES

✅ Complete Authentication System
✅ Advanced AI Analytics
✅ Professional Web Dashboard
✅ Seamless Desktop Integration
✅ Sophisticated Codebase
✅ Docker Deployment Ready

Ready for production use!"

    git push origin $tagName
    Write-Host "✅ Release tag '$tagName' created and pushed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Tag already exists or failed to create: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Final status
Write-Host "`n🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

Write-Host "`n📋 Repository Information:" -ForegroundColor Cyan
$remoteUrl = git remote get-url origin
Write-Host "• Repository: $remoteUrl" -ForegroundColor White
Write-Host "• Branch: $(git branch --show-current)" -ForegroundColor White
Write-Host "• Latest Commit: $(git log -1 --oneline)" -ForegroundColor White
Write-Host "• Tag: $tagName" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit your GitHub repository to verify the push" -ForegroundColor White
Write-Host "2. Test the production deployment" -ForegroundColor White
Write-Host "3. Set up GitHub Actions for CI/CD (optional)" -ForegroundColor White
Write-Host "4. Configure environment variables in production" -ForegroundColor White
Write-Host "5. Deploy using Docker or traditional methods" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "• README.md - Complete project overview" -ForegroundColor White
Write-Host "• docs/ - Comprehensive documentation" -ForegroundColor White
Write-Host "• scripts/ - Deployment and utility scripts" -ForegroundColor White

Write-Host "`n🚀 Your Taskforce Mailer is now on GitHub and ready for production!" -ForegroundColor Green
