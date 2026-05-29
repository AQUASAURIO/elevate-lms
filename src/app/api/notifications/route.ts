import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const markReadSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one notification ID is required'),
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
// GET /api/notifications — List notifications for current user
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const isReadFilter = searchParams.get('isRead');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };
    if (isReadFilter !== null && isReadFilter !== undefined) {
      where.isRead = isReadFilter === 'true';
    }

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return successResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/notifications — Mark notifications as read
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);

    // Parse & validate body
    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    // Mark specified notifications as read (only the user's own notifications)
    const result = await db.notification.updateMany({
      where: {
        id: { in: parsed.data.ids },
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return successResponse({ updated: result.count });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notifications';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
