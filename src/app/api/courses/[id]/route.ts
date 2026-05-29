import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const updateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  thumbnail: z.string().optional(),
  maxStudents: z.number().int().positive().optional(),
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
// GET /api/courses/[id] — Get course by ID
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true, bio: true },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: { assignments: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true, announcements: true, assignments: true },
        },
        announcements: {
          take: 5,
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    // STUDENT: only show PUBLISHED courses (unless enrolled)
    try {
      const { user } = await getAuthUser(request);
      if (user.role === 'STUDENT' && course.status !== 'PUBLISHED') {
        const enrollment = await db.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: id } },
        });
        if (!enrollment) {
          return errorResponse('FORBIDDEN', 'Course not available', 403);
        }
      }
    } catch {
      // Unauthenticated: only show PUBLISHED
      if (course.status !== 'PUBLISHED') {
        return errorResponse('FORBIDDEN', 'Course not available', 403);
      }
    }

    return successResponse({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch course';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/courses/[id] — Update course (instructor or admin)
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Check course exists
    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    // Authorization: only instructor or admin can update
    if (existing.instructorId !== user.id && !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can update this course', 403);
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update', 400);
    }

    // Update course
    const course = await db.course.update({
      where: { id },
      data: updates,
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_COURSE',
      entity: 'Course',
      entityId: id,
      details: `Updated course "${existing.title}": ${JSON.stringify(updates)}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update course';
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
// DELETE /api/courses/[id] — Archive course (instructor or admin)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Check course exists
    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    // Authorization: only instructor or admin
    if (existing.instructorId !== user.id && !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can archive this course', 403);
    }

    // Archive (soft delete) the course
    const course = await db.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: 'ARCHIVE_COURSE',
      entity: 'Course',
      entityId: id,
      details: `Archived course: ${existing.title}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to archive course';
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
