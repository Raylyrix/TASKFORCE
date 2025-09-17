# Taskforce Mailer - Final Setup Guide

## 🚀 Complete Production Setup

### Prerequisites
- Node.js v18+ installed
- pnpm installed: `npm install -g pnpm`
- Redis server running (optional for scheduling)
- Supabase account with your project

### Step 1: Set Up Supabase Database

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `setup-supabase-database.sql`**
4. **Execute the SQL** to create all tables and functions

### Step 2: Configure Environment

Your `.env` file should contain:

```env
# Database
DATABASE_URL="postgresql://postgres:Rayvical@localhost:5432/taskforce"

# Supabase (Your Real API Keys)
SUPABASE_URL="https://mcyiohpzduyqmjsepedo.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA4ODk1NywiZXhwIjoyMDczNjY0OTU3fQ.VmgFAJdPH2CIqGvjg6QnkG11WjbEMoGq_y62SGSbhJE"

# Next.js Public Supabase
NEXT_PUBLIC_SUPABASE_URL="https://mcyiohpzduyqmjsepedo.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeWlvaHB6ZHV5cW1qc2VwZWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODg5NTcsImV4cCI6MjA3MzY2NDk1N30.-sOcgTWdyavYUnOLIjlbDK_C5f2KnntN2_PjiN0JhBk"

# SMTP (Configure with your email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SECURE="false"
SMTP_FROM_NAME="Taskforce Mailer"

# Redis (for job queue)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Encryption
ENCRYPTION_KEY="your-encryption-key-change-this-in-production"
```

### Step 3: Install Dependencies

```bash
pnpm install
```

### Step 4: Test the Setup

```bash
# Test Supabase connection
node test-supabase-connection.js

# Test email service
node test-simple-email.js

# Test full application
node start-working-app.js
```

### Step 5: Start the Application

```bash
# Option 1: Working startup script
node start-working-app.js

# Option 2: Original startup script
node start-app.js

# Option 3: Manual start
# Terminal 1: Backend
cd apps/backend && npx tsx src/simple-server.ts

# Terminal 2: Frontend
cd apps/frontend && pnpm dev
```

## 🎯 Features Working

### ✅ Email Scheduling
- Schedule emails for future delivery
- Offline resilience (emails sent even when PC is off)
- Retry logic with exponential backoff
- Complete audit trail

### ✅ Supabase Integration
- Real database with your API keys
- Row-level security policies
- Automatic data persistence
- Real-time status tracking

### ✅ Production Ready
- All build errors fixed
- Real API keys integrated
- Comprehensive error handling
- Docker deployment ready

## 🧪 Testing

### Test 1: Database Connection
```bash
node test-supabase-connection.js
```

### Test 2: Email Service
```bash
node test-simple-email.js
```

### Test 3: Full Application
1. Start: `node start-working-app.js`
2. Open: http://localhost:3000
3. Test email scheduling features

## 🚀 Production Deployment

### Docker Compose
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Manual Deployment
1. Build: `pnpm build`
2. Start: `node start-working-app.js`
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates

## 📊 Monitoring

### Health Checks
- Backend: http://localhost:4000/health
- Frontend: http://localhost:3000
- Supabase: Check dashboard for logs

### Logs
- Application logs in terminal
- Supabase logs in dashboard
- Redis logs (if using)

## 🆘 Troubleshooting

### Common Issues:

1. **Build errors**: Run `pnpm install` and `pnpm build`
2. **Port conflicts**: Kill processes using ports 3000, 4000
3. **Supabase errors**: Verify API keys and run setup script
4. **SMTP errors**: Check email credentials and app password

### Getting Help:

1. Check terminal output for detailed errors
2. Verify all environment variables are set
3. Ensure Supabase tables are created
4. Test individual components

## 🎉 Success!

Your Taskforce Mailer is now ready for production use with:
- ✅ Real Supabase database integration
- ✅ Email scheduling with offline resilience
- ✅ Complete audit trail and compliance
- ✅ Production-ready deployment
- ✅ All build errors fixed

**Ready to schedule emails that work even when your PC is off!** 🚀
