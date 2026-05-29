import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Database abstraction layer
// ---------------------------------------------------------------------------
// When Supabase env vars are set, uses the Supabase adapter via require().
// Otherwise, falls back to local Prisma + SQLite.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ---------------------------------------------------------------------------
// Supabase adapter (loaded via require for server-side only)
// ---------------------------------------------------------------------------

let supabaseDb: any = null
const USE_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
)

if (USE_SUPABASE) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/supabase-client')
    supabaseDb = mod.db
    console.log('[db] Using Supabase adapter')
  } catch (error) {
    console.error('[db] Failed to load Supabase adapter, falling back to Prisma:', error)
  }
}

// ---------------------------------------------------------------------------
// Export: Supabase when available, Prisma otherwise
// ---------------------------------------------------------------------------

export const db = supabaseDb ?? (prisma as unknown as any)
