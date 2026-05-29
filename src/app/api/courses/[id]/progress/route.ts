import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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
// GET /api/courses/[id]/progress — Get current user's progress in a course
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);

    // Check course exists
    const course = await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      return errorResponse('NOT_FOUND', 'Course not found', 404);
    }

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });

    if (!enrollment) {
      return errorResponse('FORBIDDEN', 'You are not enrolled in this course', 403);
    }

    // Count total lessons
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;

    // Get user's submissions for this course's assignments
    const courseAssignments = await db.assignment.findMany({
      where: { courseId: id },
      select: { id: true },
    });

    const assignmentIds = courseAssignments.map((a) => a.id);

    const submissions = await db.submission.findMany({
      where: {
        assignmentId: { in: assignmentIds },
        studentId: user.id,
      },
      include: {
        assignment: {
          select: { id: true, title: true, maxScore: true },
        },
      },
    });

    // Calculate completed lessons based on:
    // - For TEXT/VIDEO lessons: we track "viewed" via submissions (lessons don't have a separate viewed status)
    // - For QUIZ/ASSIGNMENT lessons: based on submission status
    // Since we don't have a LessonProgress table, we approximate progress based on assignments submitted
    const completedAssignments = submissions.filter(
      (s) => s.status === 'GRADED' || s.status === 'SUBMITTED',
    ).length;

    // Calculate progress as percentage of assignments completed
    const totalAssignments = courseAssignments.length;
    const progress =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : totalLessons > 0
          ? 0
          : 100;

    // Determine completed lessons (those with a related assignment that was submitted/graded)
    // For a simpler approach: count lessons whose module has a submitted assignment
    const completedLessons = allLessons.filter((lesson) => {
      if (lesson.type === 'QUIZ' || lesson.type === 'ASSIGNMENT') {
        const assignment = courseAssignments.find(
          (a) => a.id === lesson.id, // This won't match; we need to link lessons to assignments
        );
        // Fallback: count all lessons as progress indicator through assignments
      }
      return false; // Base: no lessons marked complete without explicit tracking
    }).length;

    // Better approach: use the number of submitted/graded assignments as the progress metric
    // and derive completedLessons from submissions where lesson type matches

    return successResponse({
      progress,
      completedLessons: completedAssignments, // Approximate based on assignments
      totalLessons: Math.max(totalLessons, totalAssignments), // Use max of lessons or assignments
      submissions: submissions.map((s) => ({
        id: s.id,
        assignmentId: s.assignment.id,
        assignmentTitle: s.assignment.title,
        status: s.status,
        score: s.score,
        maxScore: s.assignment.maxScore,
        submittedAt: s.submittedAt,
        gradedAt: s.gradedAt,
      })),
      enrollmentProgress: enrollment.progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch course progress';
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
