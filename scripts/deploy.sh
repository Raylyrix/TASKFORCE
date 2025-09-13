#!/bin/bash

# Taskforce Analytics Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_NAME="taskforce-analytics"

echo "🚀 Deploying Taskforce Analytics to $ENVIRONMENT"

# Check if required tools are installed
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build all packages
echo "🔨 Building packages..."
pnpm build

# Run tests
echo "🧪 Running tests..."
pnpm test

# Copy environment file
if [ "$ENVIRONMENT" = "production" ]; then
    echo "📋 Setting up production environment..."
    cp env.production .env
else
    echo "📋 Setting up staging environment..."
    cp env.example .env
fi

# Start services
echo "🚀 Starting services..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment with PM2
    command -v pm2 >/dev/null 2>&1 || { echo "❌ PM2 is required for production deployment. Aborting." >&2; exit 1; }
    
    echo "🔄 Starting production services with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    # Staging deployment
    echo "🔄 Starting staging services..."
    pnpm dev &
    echo "✅ Services started in background"
fi

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:4000"
echo "🤖 AI Service: http://localhost:4001"
