import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthPayload, ADMIN_ROLES } from '@/lib/auth';

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
// GET /api/admin/users
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // 1. Auth — verify token & admin role
    const payload = await getAuthPayload(request);
    if (!payload.role || !ADMIN_ROLES.includes(payload.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

    // 3. Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // 4. Query
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          bio: true,
          emailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // 5. Return paginated result
    return successResponse({
      users: users.map((u) => sanitizeUser(u as unknown as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid')
      ? 401
      : message.includes('Admin') || message.includes('Forbidden')
        ? 403
        : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
