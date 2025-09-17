# Taskforce Mailer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js v18+ installed
- pnpm installed: `npm install -g pnpm`
- Redis server running (optional for scheduling)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
```bash
# Copy environment template
copy env.example .env

# Edit .env with your settings:
# - SMTP credentials for email sending
# - Supabase URL and keys (see SUPABASE_SETUP_GUIDE.md)
```

### Step 3: Start the Application
```bash
# Option 1: Use the working startup script
node start-working-app.js

# Option 2: Use the original startup script
node start-app.js

# Option 3: Start manually
# Terminal 1: Backend
cd apps/backend && npx tsx src/simple-server.ts

# Terminal 2: Frontend  
cd apps/frontend && pnpm dev
```

### Step 4: Test Email Service
```bash
# Test basic email sending
node test-simple-email.js

# Test scheduling (if Supabase is set up)
node test-scheduling.js
```

## 📱 Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 🔧 Configuration

### Required Environment Variables
```env
# SMTP (for email sending)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_NAME="Taskforce Mailer"

# Supabase (for scheduling)
SUPABASE_URL="https://mcyiohpzduyqmjsepedo.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Redis (for job queue)
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## 🧪 Testing

### Test 1: Basic Email
```bash
node test-simple-email.js
```

### Test 2: Full Application
1. Start the app: `node start-working-app.js`
2. Open http://localhost:3000
3. Try the demo login
4. Test email scheduling features

### Test 3: Scheduling (Advanced)
1. Set up Supabase (see SUPABASE_SETUP_GUIDE.md)
2. Run: `node test-scheduling.js`
3. Schedule an email for 2 minutes from now
4. Shut down the client - email will still be sent!

## 🆘 Troubleshooting

### Common Issues:

1. **"Cannot find module" errors**:
   ```bash
   pnpm install
   ```

2. **Port conflicts**:
   ```bash
   # Kill processes using ports
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

3. **SMTP errors**:
   - Verify SMTP credentials in .env
   - Use app-specific passwords for Gmail
   - Check firewall settings

4. **Supabase connection failed**:
   - Run the SQL schema in Supabase dashboard
   - Verify URL and keys in .env

## 📚 Documentation

- **Full Setup Guide**: `SUPABASE_SETUP_GUIDE.md`
- **API Documentation**: `SCHEDULING_SERVICE_README.md`
- **Docker Deployment**: `docker-compose.production.yml`

## 🎯 Features

### ✅ Working Now
- Email sending with SMTP
- Basic web interface
- Authentication system
- Health monitoring

### 🔄 With Supabase Setup
- Email scheduling for future delivery
- Offline resilience (emails sent even when PC is off)
- Retry logic with exponential backoff
- Complete audit trail
- Real-time status tracking

## 🚀 Production Deployment

For production use:
```bash
docker-compose -f docker-compose.production.yml up -d
```

---

**Ready to go!** 🎉
