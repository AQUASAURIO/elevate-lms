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
// GET /api/dashboard/stats — Role-specific dashboard statistics
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);

    const isAdmin = ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);

    if (user.role === 'STUDENT') {
      // Student stats
      const [enrolledCourses, completedEnrollments, pendingSubmissions, recentSubmissions] = await Promise.all([
        db.enrollment.count({
          where: { userId: user.id, status: 'ACTIVE' },
        }),
        db.enrollment.count({
          where: { userId: user.id, status: 'COMPLETED' },
        }),
        db.submission.count({
          where: { studentId: user.id, status: 'SUBMITTED' },
        }),
        db.submission.findMany({
          where: { studentId: user.id },
          include: {
            assignment: {
              select: { title: true, maxScore: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]);

      // Calculate average score
      const gradedSubmissions = await db.submission.findMany({
        where: { studentId: user.id, status: 'GRADED', score: { not: null } },
        select: { score: true, assignment: { select: { maxScore: true } } },
      });

      const avgScore =
        gradedSubmissions.length > 0
          ? Math.round(
              (gradedSubmissions.reduce((sum, s) => {
                const max = s.assignment.maxScore || 100;
                return sum + ((s.score || 0) / max) * 100;
              }, 0) /
                gradedSubmissions.length) *
                100,
            ) / 100
          : 0;

      return successResponse({
        enrolledCourses,
        completedCourses: completedEnrollments,
        pendingAssignments: pendingSubmissions,
        avgScore,
        recentActivity: recentSubmissions.map((s) => ({
          id: s.id,
          type: 'SUBMISSION',
          title: s.assignment.title,
          score: s.score,
          status: s.status,
          updatedAt: s.updatedAt,
        })),
      });
    }

    if (user.role === 'PROFESSOR') {
      // Professor stats
      const [myCourses, totalStudents, pendingGrading, enrollments] = await Promise.all([
        db.course.count({
          where: { instructorId: user.id },
        }),
        db.enrollment.count({
          where: {
            course: { instructorId: user.id },
            status: { not: 'DROPPED' },
          },
        }),
        db.submission.count({
          where: {
            assignment: { course: { instructorId: user.id } },
            status: 'SUBMITTED',
          },
        }),
        db.enrollment.findMany({
          where: {
            course: { instructorId: user.id },
            status: 'COMPLETED',
          },
          select: { progress: true },
        }),
      ]);

      // Average completion
      const avgCompletion =
        enrollments.length > 0
          ? Math.round(
              (enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length) * 100,
            ) / 100
          : 0;

      return successResponse({
        myCourses,
        totalStudents,
        pendingGrading,
        avgCompletion,
      });
    }

    if (isAdmin) {
      // Admin/Super Admin stats
      const [totalUsers, totalCourses, totalEnrollments, activeUsers, recentLogs] = await Promise.all([
        db.user.count(),
        db.course.count(),
        db.enrollment.count(),
        db.user.count({
          where: { isActive: true },
        }),
        db.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return successResponse({
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeUsers,
        recentActivity: recentLogs.map((log) => ({
          id: log.id,
          type: 'AUDIT',
          action: log.action,
          entity: log.entity,
          details: log.details,
          createdAt: log.createdAt,
        })),
      });
    }

    return errorResponse('FORBIDDEN', 'Invalid role', 403);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    const status = message.includes('Missing') || message.includes('expired') || message.includes('Invalid') ? 401 : 500;
    return errorResponse(
      status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
      status,
    );
  }
}
