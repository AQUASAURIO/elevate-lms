import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.string().datetime()),
  maxScore: z.number().int().min(0).optional().default(100),
  moduleId: z.string().optional(),
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
// GET /api/courses/[id]/assignments — List assignments for a course
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

    const assignments = await db.assignment.findMany({
      where: { courseId: id },
      include: {
        module: {
          select: { id: true, title: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ assignments });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch assignments';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/courses/[id]/assignments — Create assignment (instructor/admin)
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
      return errorResponse('FORBIDDEN', 'Only the course instructor or an admin can create assignments', 403);
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = createAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse('VALIDATION_ERROR', firstIssue?.message || 'Invalid input', 400);
    }

    const data = parsed.data;

    // Validate moduleId belongs to this course if provided
    if (data.moduleId) {
      const mod = await db.module.findUnique({ where: { id: data.moduleId } });
      if (!mod || mod.courseId !== id) {
        return errorResponse('VALIDATION_ERROR', 'Module does not belong to this course', 400);
      }
    }

    // Create assignment
    const assignment = await db.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        courseId: id,
        moduleId: data.moduleId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        maxScore: data.maxScore,
      },
      include: {
        module: {
          select: { id: true, title: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return successResponse({ assignment }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create assignment';
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
