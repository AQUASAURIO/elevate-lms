import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { hashPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z.email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function successResponse(data: unknown, status = 201) {
  return Response.json(
    { success: true, data, meta: { timestamp: new Date().toISOString() } },
    { status },
  );
}

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return Response.json(
    { success: false, error: { code, message, ...(details !== undefined && { details }) } },
    { status },
  );
}

function sanitizeUser(user: Record<string, unknown>) {
  const { passwordHash, loginAttempts, lockedUntil, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.issues);
    }

    const { email, password, firstName, lastName } = parsed.data;

    // 2. Check if email already taken
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse('CONFLICT', 'A user with this email already exists', 409);
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create user (role defaults to STUDENT)
    const user = await db.user.create({
      data: { email, passwordHash, firstName, lastName },
    });

    // 5. Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to SW-IPP!',
        message: `Hi ${firstName}, welcome to the SW-IPP Learning Management System. We're excited to have you on board!`,
        type: 'INFO',
      },
    });

    // 6. Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user.id,
      details: `New user registered: ${email}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    // 7. Issue tokens
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ]);

    // 8. Return
    return successResponse({
      user: sanitizeUser(user as unknown as Record<string, unknown>),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[register] Unexpected error:', error);
    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
