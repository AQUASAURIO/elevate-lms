import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { comparePassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

function successResponse(data: unknown) {
  return Response.json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
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
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.issues);
    }

    const { email, password } = parsed.data;

    // 2. Find user by email
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return errorResponse('ACCOUNT_DISABLED', 'This account has been disabled', 403);
    }

    // 4. Check lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60_000,
      );
      return errorResponse(
        'ACCOUNT_LOCKED',
        `Account is temporarily locked. Try again in ${remainingMinutes} minute(s).`,
        423,
        { lockedUntil: user.lockedUntil },
      );
    }

    // 5. Verify password
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      // Increment failed login attempts
      const attempts = user.loginAttempts + 1;
      const lockUpdate: Record<string, unknown> = { loginAttempts: attempts };

      // Lock after MAX_LOGIN_ATTEMPTS failed attempts
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockUpdate.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000);
        lockUpdate.loginAttempts = 0; // reset for next lockout cycle
      }

      await db.user.update({ where: { id: user.id }, data: lockUpdate });

      await createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        details: `Failed login attempt (${attempts}/${MAX_LOGIN_ATTEMPTS})`,
        ipAddress: extractIp(request),
        userAgent: extractUserAgent(request),
      });

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        return errorResponse(
          'ACCOUNT_LOCKED',
          `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
          423,
        );
      }

      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // 6. Successful login — reset attempts
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    // 7. Issue tokens
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, email: user.email, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ]);

    // 8. Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      details: `User logged in: ${email}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    // 9. Return
    return successResponse({
      user: sanitizeUser(user as unknown as Record<string, unknown>),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[login] Unexpected error:', error);
    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
