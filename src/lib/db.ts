// ---------------------------------------------------------------------------
// Database abstraction layer
// ---------------------------------------------------------------------------
// When Supabase env vars are set, uses the Supabase adapter.
// Otherwise, falls back to local Prisma + SQLite.
// ---------------------------------------------------------------------------

const USE_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ---------------------------------------------------------------------------
// Supabase adapter (loaded via require for server-side only)
// ---------------------------------------------------------------------------

let supabaseDb: any = null

if (USE_SUPABASE) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/supabase-client')
    if (mod.db) {
      supabaseDb = mod.db
      console.log('[db] Using Supabase adapter')
    } else {
      console.warn('[db] Supabase client is null (credentials missing). Falling back to Prisma.')
    }
  } catch (error) {
    console.error('[db] Failed to load Supabase adapter:', error)
  }
}

// ---------------------------------------------------------------------------
// Prisma fallback (lazy-loaded only when Supabase is NOT available)
// ---------------------------------------------------------------------------

let prismaDb: any = null

if (!supabaseDb) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')

    const globalForPrisma = globalThis as unknown as {
      prisma: any | undefined
    }

    prismaDb =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: ['error'],
      })

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaDb

    console.log('[db] Using Prisma fallback (local SQLite)')
  } catch (error) {
    console.error('[db] Failed to initialize Prisma:', error)
  }
}

// ---------------------------------------------------------------------------
// Export: Supabase when available, Prisma otherwise
// ---------------------------------------------------------------------------

export const db = supabaseDb ?? prismaDb
