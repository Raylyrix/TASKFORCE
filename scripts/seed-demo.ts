import { PrismaClient } from '@prisma/client';
import { hashString } from '../packages/shared/src/utils';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');

  try {
    // Create demo organization
    const organization = await prisma.organization.upsert({
      where: { domain: 'taskforce-demo.com' },
      update: {},
      create: {
        name: 'Taskforce Demo Organization',
        domain: 'taskforce-demo.com',
        settings: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          internalDomains: ['taskforce-demo.com', 'company.com']
        }
      }
    });

    console.log('✅ Created organization:', organization.name);

    // Create demo users
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@taskforce-demo.com' },
      update: {},
      create: {
        email: 'admin@taskforce-demo.com',
        name: 'Admin User',
        role: 'ADMIN',
        organizationId: organization.id,
        preferences: {
          theme: 'dark',
          notifications: true,
          defaultDateRange: '7d'
        }
      }
    });

    const analystUser = await prisma.user.upsert({
      where: { email: 'analyst@taskforce-demo.com' },
      update: {},
      create: {
        email: 'analyst@taskforce-demo.com',
        name: 'Analyst User',
        role: 'ANALYST',
        organizationId: organization.id,
        preferences: {
          theme: 'light',
          notifications: false,
          defaultDateRange: '30d'
        }
      }
    });

    console.log('✅ Created users:', [adminUser.email, analystUser.email]);

    // Create demo teams
    const salesTeam = await prisma.team.create({
      data: {
        name: 'Sales Team',
        description: 'Sales and business development',
        department: 'Sales',
        organizationId: organization.id
      }
    });

    const supportTeam = await prisma.team.create({
      data: {
        name: 'Support Team',
        description: 'Customer support and technical assistance',
        department: 'Support',
        organizationId: organization.id
      }
    });

    console.log('✅ Created teams:', [salesTeam.name, supportTeam.name]);

    // Add users to teams
    await prisma.teamMembership.createMany({
      data: [
        { userId: adminUser.id, teamId: salesTeam.id, role: 'ADMIN' },
        { userId: analystUser.id, teamId: supportTeam.id, role: 'LEAD' }
      ]
    });

    // Create demo mailboxes
    const gmailMailbox = await prisma.mailbox.create({
      data: {
        email: 'demo@taskforce-demo.com',
        provider: 'GMAIL',
        providerId: 'gmail_demo_123',
        displayName: 'Demo Gmail Account',
        organizationId: organization.id,
        teamId: salesTeam.id,
        settings: {
          syncInterval: 15, // minutes
          maxMessages: 10000,
          labels: ['INBOX', 'SENT', 'IMPORTANT']
        }
      }
    });

    const outlookMailbox = await prisma.mailbox.create({
      data: {
        email: 'support@taskforce-demo.com',
        provider: 'OUTLOOK',
        providerId: 'outlook_demo_456',
        displayName: 'Support Outlook Account',
        organizationId: organization.id,
        teamId: supportTeam.id,
        settings: {
          syncInterval: 30, // minutes
          maxMessages: 5000,
          folders: ['Inbox', 'Sent Items', 'Important']
        }
      }
    });

    console.log('✅ Created mailboxes:', [gmailMailbox.email, outlookMailbox.email]);

    // Create demo contacts
    const contacts = [
      {
        email: 'john.doe@client.com',
        name: 'John Doe',
        domain: 'client.com',
        isInternal: false,
        responseRate: 0.85,
        avgResponseTime: 240, // 4 hours
        lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        contactCount: 15,
        mailboxId: gmailMailbox.id
      },
      {
        email: 'sarah.smith@prospect.com',
        name: 'Sarah Smith',
        domain: 'prospect.com',
        isInternal: false,
        responseRate: 0.60,
        avgResponseTime: 480, // 8 hours
        lastContactAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        contactCount: 8,
        mailboxId: gmailMailbox.id
      },
      {
        email: 'mike@company.com',
        name: 'Mike Johnson',
        domain: 'company.com',
        isInternal: true,
        responseRate: 0.95,
        avgResponseTime: 60, // 1 hour
        lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        contactCount: 25,
        mailboxId: outlookMailbox.id
      }
    ];

    for (const contactData of contacts) {
      await prisma.contact.create({
        data: contactData
      });
    }

    console.log('✅ Created contacts:', contacts.length);

    // Create demo messages
    const now = new Date();
    const messages = [];
    
    // Generate messages for the last 30 days
    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const messageDate = new Date(now.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);
      
      const isSent = Math.random() > 0.5;
      const mailbox = isSent ? gmailMailbox : outlookMailbox;
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      
      messages.push({
        messageId: `msg_${i}_${Date.now()}`,
        subject: `Demo Email ${i + 1}`,
        fromEmail: isSent ? gmailMailbox.email : contact.email,
        fromName: isSent ? 'Demo User' : contact.name,
        toEmails: isSent ? [contact.email] : [gmailMailbox.email],
        receivedAt: messageDate,
        sentAt: isSent ? messageDate : undefined,
        size: Math.floor(Math.random() * 50000) + 1000,
        hasAttachments: Math.random() > 0.7,
        attachmentCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
        isRead: Math.random() > 0.3,
        isImportant: Math.random() > 0.8,
        labels: ['INBOX'],
        snippet: `This is a demo email snippet for message ${i + 1}.`,
        bodyHash: await hashString(`demo-body-${i}`),
        mailboxId: mailbox.id
      });
    }

    await prisma.message.createMany({
      data: messages
    });

    console.log('✅ Created messages:', messages.length);

    // Create demo analytics aggregates
    const analyticsData = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const sentCount = Math.floor(Math.random() * 20) + 5;
      const receivedCount = Math.floor(Math.random() * 25) + 8;
      
      analyticsData.push(
        {
          date,
          metric: 'volume_sent',
          value: sentCount,
          organizationId: organization.id
        },
        {
          date,
          metric: 'volume_received',
          value: receivedCount,
          organizationId: organization.id
        },
        {
          date,
          metric: 'response_time_avg',
          value: Math.floor(Math.random() * 480) + 60, // 1-8 hours
          organizationId: organization.id
        }
      );
    }

    await prisma.analyticsAggregate.createMany({
      data: analyticsData
    });

    console.log('✅ Created analytics aggregates:', analyticsData.length);

    // Create demo AI requests
    const aiRequests = [];
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      aiRequests.push({
        promptHash: `hash_${i}_${Date.now()}`,
        model: 'nvidia/nemotron-nano-9b-v2:free',
        tokensUsed: Math.floor(Math.random() * 1000) + 100,
        cost: Math.random() * 0.01,
        responseTime: Math.floor(Math.random() * 5000) + 500,
        success: Math.random() > 0.1,
        organizationId: organization.id,
        createdAt
      });
    }

    await prisma.aIRequest.createMany({
      data: aiRequests
    });

    console.log('✅ Created AI requests:', aiRequests.length);

    // Create demo automation rules
    await prisma.automationRule.createMany({
      data: [
        {
          name: 'High Priority Client Emails',
          description: 'Auto-prioritize emails from important clients',
          conditions: {
            from: { contains: ['@client.com', '@vip.com'] },
            subject: { contains: ['urgent', 'important', 'asap'] }
          },
          actions: {
            priority: 'high',
            label: 'important',
            notify: true
          },
          organizationId: organization.id
        },
        {
          name: 'Support Ticket Auto-Assignment',
          description: 'Assign support emails to support team',
          conditions: {
            subject: { contains: ['support', 'help', 'issue'] },
            to: { contains: ['support@'] }
          },
          actions: {
            assignTo: 'support-team',
            label: 'support',
            createTicket: true
          },
          organizationId: organization.id
        }
      ]
    });

    console.log('✅ Created automation rules');

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`- Organization: ${organization.name}`);
    console.log(`- Users: 2 (admin@taskforce-demo.com, analyst@taskforce-demo.com)`);
    console.log(`- Teams: 2 (Sales, Support)`);
    console.log(`- Mailboxes: 2 (Gmail, Outlook)`);
    console.log(`- Contacts: ${contacts.length}`);
    console.log(`- Messages: ${messages.length}`);
    console.log(`- Analytics Aggregates: ${analyticsData.length}`);
    console.log(`- AI Requests: ${aiRequests.length}`);
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin: admin@taskforce-demo.com');
    console.log('Analyst: analyst@taskforce-demo.com');
    console.log('Password: demo123 (you\'ll need to implement auth)');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedDemoData };
