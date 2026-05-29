// Elévate LMS TypeScript Types

// Enums
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROFESSOR' | 'STUDENT';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'TEXT' | 'VIDEO' | 'QUIZ' | 'ASSIGNMENT';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'GRADED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

// User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: Role;
  bio?: string | null;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Aggregated counts (from /api/auth/me)
  _count?: {
    courses?: number;
    enrollments?: number;
    submissions?: number;
    notifications?: number;
  };
}

// Course
export interface Course {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  instructorId: string;
  category?: string | null;
  level: CourseLevel;
  status: CourseStatus;
  maxStudents?: number | null;
  enrollCount: number;
  createdAt: string;
  updatedAt: string;
  instructor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar' | 'email'>;
  modules?: Module[];
  _count?: {
    modules?: number;
    enrollments?: number;
    assignments?: number;
    announcements?: number;
  };
}

// Module
export interface Module {
  id: string;
  title: string;
  description?: string | null;
  courseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
  assignments?: Assignment[];
}

// Lesson
export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: LessonType;
  videoUrl?: string | null;
  moduleId: string;
  order: number;
  durationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Enrollment
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number;
  completedAt?: string | null;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, 'id' | 'title' | 'thumbnail' | 'level' | 'category'>;
}

// Assignment
export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  courseId: string;
  moduleId?: string | null;
  dueDate?: string | null;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, 'id' | 'title'>;
  module?: Pick<Module, 'id' | 'title'>;
  submission?: Submission;
  _count?: {
    submissions?: number;
  };
}

// Submission
export interface Submission {
  id: string;
  content?: string | null;
  score?: number | null;
  feedback?: string | null;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt?: string | null;
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignment?: Pick<Assignment, 'id' | 'title' | 'maxScore' | 'dueDate'>;
  student?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId: string;
  authorId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, 'id' | 'title'>;
  author?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  isRead?: boolean;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  updatedAt: string;
}

// AuditLog
export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

// Dashboard Stats
export interface StudentDashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  pendingAssignments: number;
  averageScore: number;
}

export interface ProfessorDashboardStats {
  myCourses: number;
  totalStudents: number;
  pendingGrading: number;
  avgCompletion: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeUsers: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Auth types
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Chart data
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Activity
export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

// Deadline
export interface Deadline {
  id: string;
  assignmentId: string;
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  dueDate: string;
  status: SubmissionStatus;
}
