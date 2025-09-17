// Prisma client factory that handles both real and mock clients
import type { PrismaClient } from '../types/prisma';

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  try {
    // Try to import the real Prisma client
    const { PrismaClient: RealPrismaClient } = require('@prisma/client');
    prismaClient = new RealPrismaClient();
    console.log('✅ Using real Prisma client');
  } catch (error) {
    // Fallback to mock client for CI or when Prisma is not available
    console.log('⚠️  Prisma client not available, using mock client');
    prismaClient = createMockPrismaClient();
  }

  return prismaClient;
}

function createMockPrismaClient(): PrismaClient {
  const mockDelegate: any = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    createMany: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    updateMany: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    deleteMany: () => Promise.resolve({}),
    upsert: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
  };

  return {
    user: mockDelegate,
    organization: mockDelegate,
    mailbox: mockDelegate,
    message: mockDelegate,
    contact: mockDelegate,
    thread: mockDelegate,
    analytics: mockDelegate,
    report: mockDelegate,
    eventType: mockDelegate,
    availability: mockDelegate,
    booking: mockDelegate,
    auditLog: mockDelegate,
    analyticsAggregate: mockDelegate,
    messageContact: mockDelegate,
    $connect: async () => {
      console.log('Mock Prisma client connected');
    },
    $disconnect: async () => {
      console.log('Mock Prisma client disconnected');
    },
    $transaction: async (fn: (prisma: PrismaClient) => Promise<any>) => {
      return fn(prismaClient!);
    },
    $queryRaw: async (query: any) => {
      console.log('Mock $queryRaw called with:', query);
      return [];
    },
    $executeRaw: async (query: any) => {
      console.log('Mock $executeRaw called with:', query);
      return 0;
    },
  } as any;
}

// Export types for use in other files
export type { PrismaClient, User, Organization, Mailbox, Message, Contact, Thread, Analytics, Report } from '../types/prisma';
