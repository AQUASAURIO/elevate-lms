import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  isPinned: z.boolean().optional().default(false),
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
// GET /api/announcements — List announcements for user
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);

    const isAdmin = ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);

    // Build course filter based on role
    let courseIds: string[] = [];

    if (isAdmin) {
      // Admin sees all courses' announcements
      const allCourses = await db.course.findMany({
        select: { id: true },
      });
      courseIds = allCourses.map((c) => c.id);
    } else if (user.role === 'PROFESSOR') {
      // Professor sees announcements from their courses
      const courses = await db.course.findMany({
        where: { instructorId: user.id },
        select: { id: true },
      });
      courseIds = courses.map((c) => c.id);
    } else {
      // Student sees announcements from enrolled courses
      const enrollments = await db.enrollment.findMany({
        where: { userId: user.id, status: { not: 'DROPPED' } },
        select: { courseId: true },
      });
      courseIds = enrollments.map((e) => e.courseId);
    }

    const announcements = await db.announcement.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    });

    return successResponse({ announcements });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch announcements';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/announcements — Create announcement (instructor/admin for their courses)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);

    const isAdmin = ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);

    // Parse & validate body
    const body = await request.json();
    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    const { courseId, ...data } = parsed.data;

    // Verify course exists
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    // Authorization: instructor of the course or admin
    if (!isAdmin && course.instructorId !== user.id) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can create announcements', 403);
    }

    // Create announcement
    const announcement = await db.announcement.create({
      data: {
        ...data,
        courseId,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
    });

    // Notify enrolled students
    const enrollments = await db.enrollment.findMany({
      where: { courseId, status: { not: 'DROPPED' } },
      select: { userId: true },
    });

    if (enrollments.length > 0) {
      await db.notification.createMany({
        data: enrollments.map((e) => ({
          userId: e.userId,
          title: announcement.isPinned ? '📌 Pinned Announcement' : 'New Announcement',
          message: `${announcement.title} — in "${course.title}"`,
          type: 'INFO' as const,
          link: `/courses/${courseId}`,
        })),
      });
    }

    return successResponse({ announcement }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create announcement';
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
