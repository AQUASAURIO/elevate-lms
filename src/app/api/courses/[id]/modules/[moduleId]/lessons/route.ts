import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['TEXT', 'VIDEO', 'QUIZ', 'ASSIGNMENT']).optional(),
  videoUrl: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
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
// GET /api/courses/[id]/modules/[moduleId]/lessons — List lessons for a module
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> },
) {
  try {
    const { moduleId } = await params;

    // Verify module exists
    const moduleData = await db.module.findUnique({ where: { id: moduleId } });
    if (!moduleData) {
      return errorResponse('NOT_FOUND', 'Module not found', 404);
    }

    const lessons = await db.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });

    return successResponse({ lessons });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lessons';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/courses/[id]/modules/[moduleId]/lessons — Add a lesson (instructor/admin)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> },
) {
  try {
    const { id: courseId, moduleId } = await params;
    const { user } = await getAuthUser(request);

    // Verify module exists and belongs to the course
    const moduleData = await db.module.findUnique({ where: { id: moduleId } });
    if (!moduleData || moduleData.courseId !== courseId) {
      return errorResponse('NOT_FOUND', 'Module not found', 404);
    }

    // Verify course exists and check authorization
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    if (course.instructorId !== user.id && !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can add lessons', 403);
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    // Determine order (append to end)
    const maxOrder = await db.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (maxOrder?.order ?? -1) + 1;

    // Create lesson
    const lesson = await db.lesson.create({
      data: {
        ...parsed.data,
        moduleId,
        order,
      },
    });

    return successResponse({ lesson }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create lesson';
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
