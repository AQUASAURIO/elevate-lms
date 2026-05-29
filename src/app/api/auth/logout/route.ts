import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function successResponse(data: unknown) {
  return Response.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
}

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ success: false, error: { code, message } }, { status });
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Verify token (best-effort — we still return 200 even if invalid)
    let userId: string | undefined;
    try {
      const payload = await getAuthPayload(request);
      userId = payload.sub;
    } catch {
      // Token is missing or invalid — still return 200 (stateless logout)
    }

    // 2. Audit log
    if (userId) {
      await createAuditLog({
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        ipAddress: extractIp(request),
        userAgent: extractUserAgent(request),
      });
    }

    // 3. Return success (client discards tokens)
    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[logout] Unexpected error:', error);
    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
