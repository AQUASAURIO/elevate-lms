import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

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
// POST /api/courses/[id]/enroll — Enroll current user in course (STUDENT)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Only STUDENT can enroll
    if (user.role !== 'STUDENT') {
      return errorResponse('FORBIDDEN', 'Only students can enroll in courses', 403);
    }

    // Check course exists and is PUBLISHED
    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }
    if (course.status !== 'PUBLISHED') {
      return errorResponse('FORBIDDEN', 'Course is not available for enrollment', 403);
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });
    if (existing) {
      return errorResponse('CONFLICT', 'You are already enrolled in this course', 409);
    }

    // Check maxStudents
    if (course.maxStudents) {
      const currentCount = await db.enrollment.count({
        where: { courseId: id, status: { not: 'DROPPED' } },
      });
      if (currentCount >= course.maxStudents) {
        return errorResponse('FORBIDDEN', 'Course has reached maximum enrollment capacity', 403);
      }
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        userId: user.id,
        courseId: id,
        status: 'ACTIVE',
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });

    // Increment enrollCount on course
    await db.course.update({
      where: { id },
      data: { enrollCount: { increment: 1 } },
    });

    // Create notification for student
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Successfully Enrolled',
        message: `You have been enrolled in "${course.title}"`,
        type: 'SUCCESS',
        link: `/courses/${id}`,
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'ENROLL_COURSE',
      entity: 'Course',
      entityId: id,
      details: `Student enrolled in course: ${course.title}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ enrollment }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enroll in course';
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

// ---------------------------------------------------------------------------
// DELETE /api/courses/[id]/enroll — Unenroll (drop course)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Check enrollment exists
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
      include: { course: { select: { id: true, title: true } } },
    });

    if (!enrollment) {
      return errorResponse('NOT_FOUND', 'Enrollment not found', 404);
    }

    // Update enrollment to DROPPED
    const updated = await db.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'DROPPED' },
    });

    // Decrement enrollCount on course
    await db.course.update({
      where: { id },
      data: { enrollCount: { decrement: 1 } },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'UNENROLL_COURSE',
      entity: 'Course',
      entityId: id,
      details: `Student dropped course: ${enrollment.course.title}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ enrollment: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unenroll from course';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
