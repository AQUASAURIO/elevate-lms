import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth';
import { createAuditLog, extractIp, extractUserAgent } from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  thumbnail: z.string().optional(),
  maxStudents: z.number().int().positive().optional(),
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
// GET /api/courses — List courses with filtering and pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category') || undefined;
    const level = searchParams.get('level') || undefined;
    const status = searchParams.get('status') || undefined;
    const instructorId = searchParams.get('instructorId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12));

    // Determine user role for filtering
    let userRole: string | undefined;
    let userId: string | undefined;
    try {
      const { user } = await getAuthUser(request);
      userRole = user.role;
      userId = user.id;
    } catch {
      // Unauthenticated — only show PUBLISHED courses
      userRole = undefined;
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Level filter
    if (level) {
      where.level = level;
    }

    // Instructor filter
    if (instructorId) {
      where.instructorId = instructorId;
    }

    // Role-based status filtering
    if (status) {
      where.status = status;
    } else if (userRole === 'STUDENT') {
      where.status = 'PUBLISHED';
    } else if (userRole === 'PROFESSOR') {
      // Show PUBLISHED courses + own DRAFT courses
      where.OR = [
        ...(where.OR ? [where.OR as unknown] : []),
        { status: 'PUBLISHED' },
        { status: 'DRAFT', instructorId: userId },
      ];
      // Remove conflicting top-level OR if search also added one
      if (search && Array.isArray(where.OR) && where.OR.length > 2) {
        // search OR has 2 items, status OR has 2 items = 4 items total — wrap with AND
        const searchOr = where.OR.slice(0, 2);
        const statusOr = where.OR.slice(2);
        where.OR = searchOr;
        (where as Record<string, unknown>).AND = [
          { OR: statusOr },
        ];
      }
    }
    // ADMIN/SUPER_ADMIN: show all statuses (no additional filter)

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          _count: {
            select: { enrollments: true, modules: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.course.count({ where }),
    ]);

    return successResponse({
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch courses';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/courses — Create a course (PROFESSOR or ADMIN/SUPER_ADMIN)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);

    // Role check
    if (user.role !== 'PROFESSOR' && !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return errorResponse('FORBIDDEN', 'Only professors and admins can create courses', 403);
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return errorResponse(
        'VALIDATION_ERROR',
        firstIssue?.message || 'Invalid input',
        400,
      );
    }

    // Create course
    const course = await db.course.create({
      data: {
        ...parsed.data,
        instructorId: user.id,
        status: 'DRAFT',
      },
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
      action: 'CREATE_COURSE',
      entity: 'Course',
      entityId: course.id,
      details: `Created course: ${course.title}`,
      ipAddress: extractIp(request),
      userAgent: extractUserAgent(request),
    });

    return successResponse({ course }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create course';
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
