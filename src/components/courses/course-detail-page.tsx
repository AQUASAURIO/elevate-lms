'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  Star,
  Pin,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

const mockCourse = {
  id: '1',
  title: 'Introduction to Computer Science',
  description: 'Learn the fundamentals of computer science including algorithms, data structures, and programming concepts. This comprehensive course covers everything from basic syntax to advanced problem-solving techniques.',
  thumbnail: null,
  instructorId: 'prof-1',
  category: 'Computer Science',
  level: 'BEGINNER' as const,
  status: 'PUBLISHED' as const,
  maxStudents: 100,
  enrollCount: 45,
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
  instructor: { id: 'prof-1', firstName: 'John', lastName: 'Smith', avatar: null, email: 'john.smith@example.com' },
  _count: { modules: 8, enrollments: 45, assignments: 12, announcements: 3 },
};

const mockModules = [
  {
    id: 'm1',
    title: 'Getting Started',
    description: 'Introduction and setup',
    order: 0,
    lessons: [
      { id: 'l1', title: 'Welcome to the Course', type: 'TEXT' as const, durationMinutes: 10, order: 0 },
      { id: 'l2', title: 'Setting Up Your Environment', type: 'VIDEO' as const, durationMinutes: 25, order: 1 },
      { id: 'l3', title: 'Basic Concepts Quiz', type: 'QUIZ' as const, durationMinutes: 15, order: 2 },
    ],
  },
  {
    id: 'm2',
    title: 'Variables and Data Types',
    description: 'Core programming fundamentals',
    order: 1,
    lessons: [
      { id: 'l4', title: 'Variables Explained', type: 'VIDEO' as const, durationMinutes: 30, order: 0 },
      { id: 'l5', title: 'Data Types Deep Dive', type: 'TEXT' as const, durationMinutes: 20, order: 1 },
      { id: 'l6', title: 'Practice Exercise', type: 'ASSIGNMENT' as const, durationMinutes: 45, order: 2 },
    ],
  },
  {
    id: 'm3',
    title: 'Control Flow',
    description: 'Conditionals and loops',
    order: 2,
    lessons: [
      { id: 'l7', title: 'If Statements', type: 'VIDEO' as const, durationMinutes: 20, order: 0 },
      { id: 'l8', title: 'Loops and Iteration', type: 'VIDEO' as const, durationMinutes: 35, order: 1 },
      { id: 'l9', title: 'Switch Cases', type: 'TEXT' as const, durationMinutes: 15, order: 2 },
    ],
  },
  {
    id: 'm4',
    title: 'Functions',
    description: 'Building reusable code',
    order: 3,
    lessons: [
      { id: 'l10', title: 'Defining Functions', type: 'VIDEO' as const, durationMinutes: 25, order: 0 },
      { id: 'l11', title: 'Parameters and Return Values', type: 'TEXT' as const, durationMinutes: 20, order: 1 },
      { id: 'l12', title: 'Module Assessment', type: 'QUIZ' as const, durationMinutes: 30, order: 2 },
    ],
  },
];

const mockAssignments = [
  { id: 'a1', title: 'Hello World Program', dueDate: '2025-02-20T23:59:00Z', maxScore: 100, status: 'GRADED' as const, score: 95 },
  { id: 'a2', title: 'Variable Explorer', dueDate: '2025-02-25T23:59:00Z', maxScore: 100, status: 'SUBMITTED' as const },
  { id: 'a3', title: 'Loop Challenge', dueDate: '2025-03-01T23:59:00Z', maxScore: 100, status: 'PENDING' as const },
  { id: 'a4', title: 'Function Library', dueDate: '2025-03-10T23:59:00Z', maxScore: 100, status: 'PENDING' as const },
];

const mockAnnouncements = [
  { id: 'n1', title: 'Welcome to the Course!', content: 'We are excited to have you. Please review the syllabus and introduce yourself in the discussion forum.', createdAt: '2025-01-15T00:00:00Z', isPinned: true, author: { firstName: 'John', lastName: 'Smith' } },
  { id: 'n2', title: 'Midterm Exam Schedule', content: 'The midterm exam will be held on March 5th. Please prepare accordingly and review chapters 1-4.', createdAt: '2025-02-10T00:00:00Z', isPinned: true, author: { firstName: 'John', lastName: 'Smith' } },
  { id: 'n3', title: 'Office Hours Update', content: 'Starting this week, office hours will be held on Tuesdays and Thursdays from 2-4 PM.', createdAt: '2025-02-08T00:00:00Z', isPinned: false, author: { firstName: 'John', lastName: 'Smith' } },
];

const lessonTypeIcons: Record<string, React.ElementType> = {
  TEXT: FileText,
  VIDEO: PlayCircle,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardCheck,
};

export function CourseDetailPage() {
  const navigate = useAppStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const course = mockCourse;
  const [isEnrolled, setIsEnrolled] = useState(true);
  const progress = 65;

  const handleEnroll = () => {
    setIsEnrolled(true);
    toast.success('Successfully enrolled in the course!');
  };

  const totalLessons = mockModules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('courses')} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to courses
      </Button>

      {/* Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
              </Badge>
              {course.category && <Badge variant="secondary">{course.category}</Badge>}
              <Badge variant="outline">{course.status}</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">{course.description}</p>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={course.instructor?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{course.instructor?.firstName} {course.instructor?.lastName}</p>
              <p className="text-xs text-muted-foreground">Instructor</p>
            </div>
          </div>
        </div>

        {/* Sidebar card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2.5" />
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{mockModules.length} Modules</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{course.enrollCount} Enrolled</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Started Jan 15</span>
              </div>
            </div>
            <Separator />
            {user?.role === 'STUDENT' && !isEnrolled && (
              <Button className="w-full" size="lg" onClick={handleEnroll}>
                <Plus className="h-4 w-4 mr-2" />
                Enroll in Course
              </Button>
            )}
            {isEnrolled && (
              <Button className="w-full" size="lg" onClick={() => toast.info('Continuing to first uncompleted lesson...')}>
                Continue Learning
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="text-sm font-medium">{course.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Level</span>
                    <span className="text-sm font-medium">{course.level.charAt(0) + course.level.slice(1).toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Students</span>
                    <span className="text-sm font-medium">{course.maxStudents || 'Unlimited'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">{format(new Date(course.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You&apos;ll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {['Fundamentals of programming', 'Data types and variables', 'Control flow and functions', 'Problem-solving techniques'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <div className="space-y-2">
            <Accordion type="multiple" defaultValue={['m1']}>
              {mockModules.map((mod, modIndex) => (
                <AccordionItem key={mod.id} value={mod.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {modIndex + 1}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{mod.title}</p>
                        <p className="text-xs text-muted-foreground">{mod.lessons.length} lessons</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-10">
                      {mod.lessons.map((lesson, lessonIndex) => {
                        const Icon = lessonTypeIcons[lesson.type] || FileText;
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.durationMinutes}m</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {lesson.type}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <div className="space-y-3">
            {mockAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{assignment.title}</h4>
                        <Badge
                          variant={
                            assignment.status === 'GRADED'
                              ? 'default'
                              : assignment.status === 'SUBMITTED'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={`text-[10px] px-1.5 py-0 ${
                            assignment.status === 'GRADED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : ''
                          }`}
                        >
                          {assignment.status === 'GRADED'
                            ? `Graded: ${assignment.score}/${assignment.maxScore}`
                            : assignment.status === 'SUBMITTED'
                            ? 'Submitted'
                            : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info('Opening assignment...')}
                    >
                      {assignment.status === 'PENDING' ? 'Submit' : 'View'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <div className="space-y-3">
            {mockAnnouncements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {announcement.isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        <h4 className="text-sm font-medium">{announcement.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {announcement.author.firstName} {announcement.author.lastName} &middot;{' '}
                        {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
