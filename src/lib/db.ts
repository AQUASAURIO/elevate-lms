import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Supabase adapter (loaded only when NEXT_PUBLIC_SUPABASE_URL is set)
// ---------------------------------------------------------------------------

let supabaseDb: typeof import('@/lib/supabase-client').db | null = null

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const supabaseModule = require('@/lib/supabase-client')
  supabaseDb = supabaseModule.db as typeof import('@/lib/supabase-client').db
}

// ---------------------------------------------------------------------------
// Prisma fallback (used when Supabase is not configured)
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaDb =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaDb

// ---------------------------------------------------------------------------
// Export: Supabase when available, Prisma otherwise
// ---------------------------------------------------------------------------

export const db = supabaseDb ?? prismaDb
