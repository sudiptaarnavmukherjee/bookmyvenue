import { PrismaClient, Prisma } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Use connection pooling for serverless environments
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn'] as Prisma.LogLevel[]
    : ['error'] as Prisma.LogLevel[],
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
