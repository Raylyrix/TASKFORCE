#!/bin/bash

# Taskforce Analytics Platform Setup Script

set -e

echo "🚀 Setting up Taskforce Analytics Platform..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required but not installed."
    echo "Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Please ensure PostgreSQL is installed."
fi

if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis client not found. Please ensure Redis is installed."
fi

echo "✅ Prerequisites check complete"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment configuration..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Setup database
echo "🗄️  Setting up database..."

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    echo "Creating database if it doesn't exist..."
    createdb TASKFORCE 2>/dev/null || echo "Database already exists"
    
    echo "Running database migrations..."
    pnpm --filter backend prisma migrate dev --name init
    
    echo "Seeding demo data..."
    pnpm --filter backend prisma db seed
else
    echo "⚠️  PostgreSQL not available. Please install and start PostgreSQL."
    echo "Then run: pnpm --filter backend prisma migrate dev"
fi

# Build shared packages
echo "🔨 Building shared packages..."
pnpm --filter @taskforce/shared build

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys and configuration"
echo "2. Ensure PostgreSQL and Redis are running"
echo "3. Run 'pnpm dev' to start development servers"
echo ""
echo "🔑 Demo credentials:"
echo "Admin: admin@taskforce-demo.com / demo123"
echo "Analyst: analyst@taskforce-demo.com / demo123"
echo ""
echo "🌐 URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo "Health: http://localhost:4000/health"
