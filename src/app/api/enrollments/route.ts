import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';

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
// GET /api/enrollments — List current user's enrollments
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || undefined;

    const where: Record<string, unknown> = { userId: user.id };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const enrollments = await db.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            _count: {
              select: { modules: true, enrollments: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return successResponse({ enrollments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch enrollments';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
