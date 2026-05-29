import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthPayload, ADMIN_ROLES } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const updateUserSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROFESSOR', 'STUDENT']).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
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

function sanitizeUser(user: Record<string, unknown>) {
  const { passwordHash, loginAttempts, lockedUntil, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// PUT /api/admin/users/[id]
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Resolve params (Next.js 16 uses async params)
    const { id } = await params;

    // 2. Auth — verify token & admin role
    const payload = await getAuthPayload(request);
    if (!payload.role || !ADMIN_ROLES.includes(payload.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }

    // 3. Check target user exists
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    // 4. Prevent self-demotion (a SUPER_ADMIN can't demote themselves)
    if (payload.sub === id && payload.role === 'SUPER_ADMIN') {
      const body = await request.json();
      if (body.role && body.role !== 'SUPER_ADMIN') {
        return errorResponse('FORBIDDEN', 'Cannot change your own admin role', 403);
      }
    }

    // 5. Parse & validate body
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.issues);
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400);
    }

    // 6. Update user
    const updated = await db.user.update({
      where: { id },
      data: updates,
    });

    // 7. Audit log
    await createAuditLog({
      userId: payload.sub,
      action: 'ADMIN_UPDATE_USER',
      entity: 'User',
      entityId: id,
      details: `Updated user ${existing.email}: ${JSON.stringify(updates)}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    // 8. Return
    return successResponse({
      user: sanitizeUser(updated as unknown as Record<string, unknown>),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
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
