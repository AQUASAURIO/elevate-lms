// ---------------------------------------------------------------------------
// Database client — Prisma (SQLite)
// ---------------------------------------------------------------------------
// Supabase adapter is available at /src/lib/supabase-client.ts for future
// migration.  Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to
// activate it.  For now we use Prisma directly so Turbopack doesn't try to
// resolve @supabase/supabase-js at compile time.
// ---------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
