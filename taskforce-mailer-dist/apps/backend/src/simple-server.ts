import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register plugins
fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      ai: 'available'
    }
  };
});

// Basic OAuth endpoints
fastify.get('/auth/google', async (request, reply) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GMAIL_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GMAIL_REDIRECT_URI || 'http://localhost:4000/auth/google/callback')}&` +
    `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email')}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  reply.redirect(authUrl);
});

fastify.get('/auth/google/callback', async (request, reply) => {
  const { code } = request.query as { code: string };
  
  if (!code) {
    reply.status(400).send({ error: 'Authorization code not provided' });
    return;
  }
  
  // Exchange code for tokens
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID || '',
        client_secret: process.env.GMAIL_CLIENT_SECRET || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:4000/auth/google/callback'
      })
    });
    
    const tokens = await tokenResponse.json() as any;
    
    if (tokens.access_token) {
      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      const userInfo = await userResponse.json() as any;
      
      // Generate JWT token
      const jwtToken = fastify.jwt.sign({
        userId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      });
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
    } else {
      reply.status(400).send({ error: 'Failed to obtain access token' });
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

fastify.get('/auth/status', async (request, reply) => {
  try {
    const token = (request.headers.authorization || '').replace('Bearer ', '');
    
    if (!token) {
      return { authenticated: false };
    }
    
    const decoded = fastify.jwt.verify(token);
    return { 
      authenticated: true, 
      user: decoded 
    };
  } catch (error) {
    return { authenticated: false };
  }
});

// Basic analytics endpoints
fastify.get('/api/analytics/metrics', async (request, reply) => {
  return {
    success: true,
    data: {
      totalEmails: 1250,
      sentEmails: 800,
      receivedEmails: 450,
      avgResponseTime: 2.5,
      pendingEmails: 25,
      todayEmails: 45,
      weekEmails: 320,
      monthEmails: 1250
    }
  };
});

fastify.get('/api/analytics/insights', async (request, reply) => {
  return {
    success: true,
    data: {
      sentiment: 'positive',
      urgency: 'medium',
      suggestions: [
        'Consider responding to high-priority emails within 2 hours',
        'Your email volume is 15% higher this week',
        'Schedule follow-ups for pending emails'
      ],
      trends: [
        'Email volume increased by 15% this week',
        'Response time improved by 20%',
        'More emails received in the morning hours'
      ],
      predictions: [
        'Expected email volume tomorrow: 35-40 emails',
        'Best time to send emails: 10-11 AM',
        'Peak response time: 2-4 PM'
      ]
    }
  };
});

fastify.get('/api/analytics/relationships', async (request, reply) => {
  return {
    success: true,
    data: [
      {
        contact: 'john.doe@company.com',
        health: 'excellent',
        lastInteraction: '2 hours ago',
        responseRate: 95,
        sentiment: 'positive'
      },
      {
        contact: 'jane.smith@client.com',
        health: 'good',
        lastInteraction: '1 day ago',
        responseRate: 87,
        sentiment: 'neutral'
      },
      {
        contact: 'bob.wilson@partner.com',
        health: 'fair',
        lastInteraction: '3 days ago',
        responseRate: 65,
        sentiment: 'neutral'
      }
    ]
  };
});

// AI endpoints
fastify.post('/api/ai/query', async (request, reply) => {
  const { query } = request.body as { query: string };
  
  if (!query) {
    reply.status(400).send({ error: 'Query is required' });
    return;
  }
  
  // Simple AI response simulation
  const responses = {
    'busy': 'Your busiest day this week was Tuesday with 45 emails received.',
    'volume': 'You have received 125 emails this week, which is 15% higher than last week.',
    'response': 'Your average response time is 2.5 hours, which is 20% faster than last month.',
    'pending': 'You have 25 pending emails that need attention.',
    'sentiment': 'Your recent emails show a positive sentiment trend.',
    'default': `Based on your query "${query}", here's what I found: Your email analytics show good performance with room for improvement in response times.`
  };
  
  let answer = responses.default;
  for (const [key, response] of Object.entries(responses)) {
    if (query.toLowerCase().includes(key)) {
      answer = response;
      break;
    }
  }
  
  return {
    success: true,
    data: {
      answer,
      charts: [
        {
          title: 'Email Volume Trend',
          description: 'Weekly email volume comparison',
          type: 'line'
        }
      ]
    }
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log('✅ Health check: http://localhost:4000/health');
    console.log('✅ OAuth: http://localhost:4000/auth/google');
    console.log('✅ Analytics: http://localhost:4000/api/analytics/metrics');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
