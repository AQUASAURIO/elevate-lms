import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { verifyToken, signAccessToken, signRefreshToken } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

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
// POST /api/auth/refresh
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await request.json();
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Refresh token is required', 400);
    }

    const { refreshToken } = parsed.data;

    // 2. Verify refresh token
    const payload = await verifyToken(refreshToken);

    // 3. Ensure it's actually a refresh token
    if (payload.type !== 'refresh') {
      return errorResponse('INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    // 4. Verify user still exists and is active
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return errorResponse('UNAUTHORIZED', 'User not found or inactive', 401);
    }

    // 5. Issue new token pair
    const [accessToken, newRefreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ]);

    // 6. Audit log
    await createAuditLog({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      entity: 'User',
      entityId: user.id,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    // 7. Return
    return successResponse({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    const status = message.includes('expired') || message.includes('Invalid') || message.includes('Missing') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
