// Single source of truth — delegate to db.ts so there is only ever one
// PrismaClient instance in the process, regardless of which import path
// is used.
export { prisma } from '@/lib/db'
export { default } from '@/lib/db'
