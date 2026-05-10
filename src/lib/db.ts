import { PrismaClient, Prisma } from '@prisma/client'

/**
 * Single Prisma client for the whole app.
 *
 * In serverless environments (Vercel) each function invocation reuses the
 * same module-level value within a warm container.  The global cache makes
 * sure a second import path that reaches this module (e.g. during bundling)
 * also gets the same instance, preventing runaway connections.
 *
 * connection_limit=1 is critical for serverless: the default pool of 10
 * will exhaust Supabase/PgBouncer free-tier limits within seconds when
 * several Lambda/Edge containers are live at the same time.
 */

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const baseUrl = process.env.DATABASE_URL ?? ''
  // Append connection_limit=1 so each serverless function uses exactly
  // one connection.  Skip if the URL already contains the param.
  const datasourceUrl =
    baseUrl && !baseUrl.includes('connection_limit')
      ? baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'connection_limit=1&pool_timeout=10'
      : baseUrl

  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? (['error', 'warn'] as Prisma.LogLevel[])
        : (['error'] as Prisma.LogLevel[]),
    datasourceUrl: datasourceUrl || undefined,
  })
}

// Always reuse the global singleton (important for serverless cold-start reuse)
export const prisma = global._prisma ?? createPrismaClient()
global._prisma = prisma

export default prisma
