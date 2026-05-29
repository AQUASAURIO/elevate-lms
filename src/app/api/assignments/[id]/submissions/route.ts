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
// GET /api/assignments/[id]/submissions — Get all submissions for an assignment
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Only instructor/admin can view all submissions
    const isAdmin = ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);

    // Check assignment exists
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, instructorId: true },
        },
      },
    });
    if (!assignment) {
      return errorResponse('NOT_FOUND', 'Assignment not found', 404);
    }

    // Authorization: instructor of the course or admin
    if (!isAdmin && assignment.course.instructorId !== user.id) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can view submissions', 403);
    }

    const submissions = await db.submission.findMany({
      where: { assignmentId: id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return successResponse({ submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch submissions';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid')
      ? 401
      : message.includes('Forbidden')
        ? 403
        : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
