// Utility to safely import Prisma client with fallback for CI builds

export function getPrismaClient() {
  try {
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  } catch (error) {
    // Fallback for CI builds where Prisma client is not generated
    const { MockPrismaClient } = require('../prisma-fallback');
    return new MockPrismaClient();
  }
}

export function getPrismaTypes() {
  try {
    return require('@prisma/client');
  } catch (error) {
    return require('../prisma-fallback');
  }
}

// Export types for direct import
export const { PrismaClient, Mailbox, Message, Contact, Thread, User, Organization, Analytics, Report } = getPrismaTypes();
