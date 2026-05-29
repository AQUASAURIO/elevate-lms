import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
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
// GET /api/courses/[id]/modules — List modules for a course (ordered)
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify course exists
    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    const modules = await db.module.findMany({
      where: { courseId: id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { assignments: true, lessons: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return successResponse({ modules });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch modules';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/courses/[id]/modules — Add a module (instructor/admin)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Verify course exists
    const course = await db.course.findUnique({ where: { id } });
    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    // Authorization: only instructor or admin
    if (course.instructorId !== user.id && !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can add modules', 403);
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    // Determine order (append to end)
    const maxOrder = await db.module.findFirst({
      where: { courseId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (maxOrder?.order ?? -1) + 1;

    // Create module
    const moduleData = await db.module.create({
      data: {
        ...parsed.data,
        courseId: id,
        order,
      },
      include: {
        _count: {
          select: { lessons: true, assignments: true },
        },
      },
    });

    return successResponse({ module: moduleData }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create module';
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
