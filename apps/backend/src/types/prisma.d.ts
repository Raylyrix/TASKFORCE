// Comprehensive Prisma type definitions
// This file provides all necessary types for both real and mock Prisma clients

export interface PrismaClient {
  user: UserDelegate;
  organization: OrganizationDelegate;
  mailbox: MailboxDelegate;
  message: MessageDelegate;
  contact: ContactDelegate;
  thread: ThreadDelegate;
  analytics: AnalyticsDelegate;
  report: ReportDelegate;
  eventType: any; // For dates feature
  availability: any; // For dates feature
  booking: any; // For dates feature
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(fn: (prisma: PrismaClient) => Promise<T>) => Promise<T>;
  $queryRaw: (query: any) => Promise<any>;
  $executeRaw: (query: any) => Promise<any>;
}

export interface UserDelegate {
  findMany: (args?: any) => Promise<User[]>;
  findUnique: (args: any) => Promise<User | null>;
  findFirst: (args?: any) => Promise<User | null>;
  create: (args: any) => Promise<User>;
  update: (args: any) => Promise<User>;
  delete: (args: any) => Promise<User>;
  upsert: (args: any) => Promise<User>;
  count: (args?: any) => Promise<number>;
}

export interface OrganizationDelegate {
  findMany: (args?: any) => Promise<Organization[]>;
  findUnique: (args: any) => Promise<Organization | null>;
  findFirst: (args?: any) => Promise<Organization | null>;
  create: (args: any) => Promise<Organization>;
  update: (args: any) => Promise<Organization>;
  delete: (args: any) => Promise<Organization>;
  upsert: (args: any) => Promise<Organization>;
  count: (args?: any) => Promise<number>;
}

export interface MailboxDelegate {
  findMany: (args?: any) => Promise<Mailbox[]>;
  findUnique: (args: any) => Promise<Mailbox | null>;
  findFirst: (args?: any) => Promise<Mailbox | null>;
  create: (args: any) => Promise<Mailbox>;
  update: (args: any) => Promise<Mailbox>;
  delete: (args: any) => Promise<Mailbox>;
  upsert: (args: any) => Promise<Mailbox>;
  count: (args?: any) => Promise<number>;
}

export interface MessageDelegate {
  findMany: (args?: any) => Promise<Message[]>;
  findUnique: (args: any) => Promise<Message | null>;
  findFirst: (args?: any) => Promise<Message | null>;
  create: (args: any) => Promise<Message>;
  createMany: (args: any) => Promise<any>;
  update: (args: any) => Promise<Message>;
  delete: (args: any) => Promise<Message>;
  upsert: (args: any) => Promise<Message>;
  count: (args?: any) => Promise<number>;
}

export interface ContactDelegate {
  findMany: (args?: any) => Promise<Contact[]>;
  findUnique: (args: any) => Promise<Contact | null>;
  findFirst: (args?: any) => Promise<Contact | null>;
  create: (args: any) => Promise<Contact>;
  update: (args: any) => Promise<Contact>;
  delete: (args: any) => Promise<Contact>;
  upsert: (args: any) => Promise<Contact>;
  count: (args?: any) => Promise<number>;
}

export interface ThreadDelegate {
  findMany: (args?: any) => Promise<Thread[]>;
  findUnique: (args: any) => Promise<Thread | null>;
  findFirst: (args?: any) => Promise<Thread | null>;
  create: (args: any) => Promise<Thread>;
  update: (args: any) => Promise<Thread>;
  delete: (args: any) => Promise<Thread>;
  upsert: (args: any) => Promise<Thread>;
  count: (args?: any) => Promise<number>;
}

export interface AnalyticsDelegate {
  findMany: (args?: any) => Promise<Analytics[]>;
  findUnique: (args: any) => Promise<Analytics | null>;
  findFirst: (args?: any) => Promise<Analytics | null>;
  create: (args: any) => Promise<Analytics>;
  update: (args: any) => Promise<Analytics>;
  delete: (args: any) => Promise<Analytics>;
  upsert: (args: any) => Promise<Analytics>;
  count: (args?: any) => Promise<number>;
}

export interface ReportDelegate {
  findMany: (args?: any) => Promise<Report[]>;
  findUnique: (args: any) => Promise<Report | null>;
  findFirst: (args?: any) => Promise<Report | null>;
  create: (args: any) => Promise<Report>;
  update: (args: any) => Promise<Report>;
  delete: (args: any) => Promise<Report>;
  upsert: (args: any) => Promise<Report>;
  count: (args?: any) => Promise<number>;
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
  organization?: Organization;
  teamMemberships?: any[];
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
  settings?: any;
  syncCursor?: string;
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
  lastContactAt?: Date;
  mailboxId?: string;
  avgResponseTime?: number;
  contactCount?: number;
  domain?: string;
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
  responseTime?: number;
  messages?: Message[];
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
