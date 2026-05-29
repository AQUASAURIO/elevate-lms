import { db } from '@/lib/db';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an audit log entry in the database.
 * Fire-and-forget — errors are logged but never thrown to avoid breaking the caller.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({ data: params });
  } catch (error) {
    console.error('[audit] Failed to create audit log:', error);
  }
}

/**
 * Extracts the IP address from a Next.js request.
 */
export function extractIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/**
 * Extracts the User-Agent from a Next.js request.
 */
export function extractUserAgent(request: Request): string {
  return request.headers.get('user-agent') ?? 'unknown';
}
