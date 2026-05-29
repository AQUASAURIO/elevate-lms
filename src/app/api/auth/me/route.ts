import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function successResponse(data: unknown) {
  return Response.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
}

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ success: false, error: { code, message } }, { status });
}

function sanitizeUser(user: Record<string, unknown>) {
  const { passwordHash, loginAttempts, lockedUntil, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // 1. Verify token
    const payload = await getAuthPayload(request);

    // 2. Fetch user with aggregate counts
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: {
        _count: {
          select: {
            courses: true,
            enrollments: true,
            submissions: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    if (!user.isActive) {
      return errorResponse('ACCOUNT_DISABLED', 'This account has been disabled', 403);
    }

    // 3. Return
    return successResponse({
      ...sanitizeUser(user as unknown as Record<string, unknown>),
      stats: user._count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
