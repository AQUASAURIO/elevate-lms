import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const gradeSchema = z.object({
  score: z.number().min(0, 'Score must be non-negative'),
  feedback: z.string().optional(),
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
// PUT /api/submissions/[id]/grade — Grade a submission (instructor/admin)
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Only instructor/admin can grade
    const isAdmin = ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);

    // Check submission exists
    const submission = await db.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            course: {
              select: { id: true, title: true, instructorId: true },
            },
          },
        },
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!submission) {
      return errorResponse('NOT_FOUND', 'Submission not found', 404);
    }

    // Authorization: instructor of the course or admin
    if (!isAdmin && submission.assignment.course.instructorId !== user.id) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can grade submissions', 403);
    }

    // Check submission status
    if (submission.status !== 'SUBMITTED') {
      return errorResponse('CONFLICT', 'This submission has already been graded', 409);
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    const { score, feedback } = parsed.data;

    // Validate score against maxScore
    if (score > submission.assignment.maxScore) {
      return errorResponse('VALIDATION_ERROR', `Score cannot exceed maximum score of ${submission.assignment.maxScore}`, 400);
    }

    // Update submission
    const graded = await db.submission.update({
      where: { id },
      data: {
        score,
        feedback: feedback || null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        assignment: {
          select: { id: true, title: true, maxScore: true },
        },
      },
    });

    // Create notification for student
    await db.notification.create({
      data: {
        userId: submission.studentId,
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" has been graded. Score: ${score}/${submission.assignment.maxScore}`,
        type: 'SUCCESS',
        link: `/courses/${submission.assignment.course.id}/assignments/${submission.assignment.id}`,
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'GRADE_SUBMISSION',
      entity: 'Submission',
      entityId: id,
      details: `Graded submission for "${submission.assignment.title}" — score: ${score}/${submission.assignment.maxScore}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ submission: graded });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to grade submission';
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
