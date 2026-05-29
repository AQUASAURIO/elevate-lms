import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const submitSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function successResponse(data: unknown, status?: number) {
  return Response.json({ success: true, data, meta: { timestamp: new Date().toISOString() } }, status ? { status } : undefined);
}

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ success: false, error: { code, message } }, { status });
}

// ---------------------------------------------------------------------------
// POST /api/assignments/[id]/submit — Submit work for an assignment
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Only STUDENT can submit
    if (user.role !== 'STUDENT') {
      return errorResponse('FORBIDDEN', 'Only students can submit assignments', 403);
    }

    // Check assignment exists
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, instructorId: true },
        },
      },
    });
    if (!assignment) {
      return errorResponse('NOT_FOUND', 'Assignment not found', 404);
    }

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: assignment.course.id },
      },
    });
    if (!enrollment || enrollment.status === 'DROPPED') {
      return errorResponse('FORBIDDEN', 'You must be enrolled in this course to submit', 403);
    }

    // Check existing submission
    const existing = await db.submission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId: id, studentId: user.id },
      },
    });

    if (existing) {
      // Allow resubmit only if not yet graded
      if (existing.status === 'GRADED') {
        return errorResponse('CONFLICT', 'This assignment has already been graded. Resubmission is not allowed.', 409);
      }

      // Update existing submission
      const submission = await db.submission.update({
        where: { id: existing.id },
        data: {
          content: (await request.json()).content,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          score: null,
          feedback: null,
          gradedAt: null,
        },
      });

      // Create notification for instructor
      await db.notification.create({
        data: {
          userId: assignment.course.instructorId,
          title: 'New Submission',
          message: `${user.firstName} ${user.lastName} resubmitted "${assignment.title}"`,
          type: 'INFO',
          link: `/courses/${assignment.course.id}/assignments/${id}`,
        },
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: 'RESUBMIT_ASSIGNMENT',
        entity: 'Assignment',
        entityId: id,
        details: `Resubmitted assignment: ${assignment.title}`,
        ipAddress: extractIp(request),
        userAgent: extractUserAgent(request),
      });

      return successResponse({ submission });
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    // Create submission
    const submission = await db.submission.create({
      data: {
        content: parsed.data.content,
        assignmentId: id,
        studentId: user.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Create notification for instructor
    await db.notification.create({
      data: {
        userId: assignment.course.instructorId,
        title: 'New Submission',
        message: `${user.firstName} ${user.lastName} submitted "${assignment.title}"`,
        type: 'INFO',
        link: `/courses/${assignment.course.id}/assignments/${id}`,
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'SUBMIT_ASSIGNMENT',
      entity: 'Assignment',
      entityId: id,
      details: `Submitted assignment: ${assignment.title}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ submission }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit assignment';
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
