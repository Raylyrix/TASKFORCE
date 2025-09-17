// Fallback Prisma client for CI builds where Prisma generation is skipped
// This provides the necessary types and a mock client

export interface PrismaClient {
  user: any;
  organization: any;
  mailbox: any;
  message: any;
  contact: any;
  thread: any;
  analytics: any;
  report: any;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: (fn: (prisma: PrismaClient) => Promise<any>) => Promise<any>;
}

export interface Mailbox {
  id: string;
  userId: string;
  organizationId: string;
  provider: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  mailboxId: string;
  threadId: string;
  subject: string;
  body: string;
  htmlBody?: string;
  fromEmail: string;
  fromName?: string;
  toEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  receivedAt: Date;
  sentAt?: Date;
  isRead: boolean;
  isImportant: boolean;
  labels: string[];
  attachments: any[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  organizationId: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  avatar?: string;
  tags: string[];
  notes?: string;
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Thread {
  id: string;
  mailboxId: string;
  subject: string;
  participants: string[];
  messageCount: number;
  isRead: boolean;
  isImportant: boolean;
  labels: string[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  organizationId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  id: string;
  organizationId: string;
  date: Date;
  metric: string;
  value: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  type: string;
  config: any;
  status: string;
  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mock PrismaClient implementation for CI
export class MockPrismaClient implements PrismaClient {
  user = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  organization = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  mailbox = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  message = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  contact = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  thread = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  analytics = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  report = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  };
  
  async $connect() {
    console.log('Mock Prisma client connected');
  }
  
  async $disconnect() {
    console.log('Mock Prisma client disconnected');
  }
  
  async $transaction(fn: (prisma: PrismaClient) => Promise<any>) {
    return fn(this);
  }
}
