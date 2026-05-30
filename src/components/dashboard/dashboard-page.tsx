'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Plus,
  FileText,
  ArrowRight,
  AlertCircle,
  Activity,
  UserCheck,
  BookMarked,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import type { Role } from '@/types';

const completionData = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 19 },
  { name: 'Mar', value: 25 },
  { name: 'Apr', value: 31 },
  { name: 'May', value: 42 },
  { name: 'Jun', value: 38 },
];

const userGrowthData = [
  { name: 'Jan', students: 45, professors: 8 },
  { name: 'Feb', students: 52, professors: 10 },
  { name: 'Mar', students: 68, professors: 12 },
  { name: 'Apr', students: 85, professors: 14 },
  { name: 'May', students: 102, professors: 15 },
  { name: 'Jun', students: 120, professors: 18 },
];

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  description?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Student Dashboard
function StudentDashboard() {
  const { navigate } = useAppStore();

  const upcomingDeadlines = [
    { id: '1', courseTitle: 'Introduction to CS', assignmentTitle: 'Final Project', dueDate: '2025-02-15T23:59:00Z', status: 'PENDING' as const },
    { id: '2', courseTitle: 'Data Structures', assignmentTitle: 'Midterm Exam', dueDate: '2025-02-18T23:59:00Z', status: 'PENDING' as const },
    { id: '3', courseTitle: 'Web Development', assignmentTitle: 'Portfolio Website', dueDate: '2025-02-20T23:59:00Z', status: 'SUBMITTED' as const },
  ];

  const recentActivity = [
    { id: '1', type: 'enrollment', title: 'Enrolled in Machine Learning 101', time: '2 hours ago' },
    { id: '2', type: 'submission', title: 'Submitted Lab 3 - Data Structures', time: '5 hours ago' },
    { id: '3', type: 'grade', title: 'Received A+ on Database Design Quiz', time: '1 day ago' },
    { id: '4', type: 'enrollment', title: 'Enrolled in Computer Networks', time: '2 days ago' },
    { id: '5', type: 'announcement', title: 'New announcement in Web Dev course', time: '3 days ago' },
  ];

  const courseProgress = [
    { id: '1', title: 'Introduction to Computer Science', progress: 75, category: 'Computer Science', level: 'BEGINNER' },
    { id: '2', title: 'Data Structures & Algorithms', progress: 45, category: 'Computer Science', level: 'INTERMEDIATE' },
    { id: '3', title: 'Web Development Fundamentals', progress: 90, category: 'Development', level: 'BEGINNER' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your learning progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard title="Enrolled Courses" value={5} icon={BookOpen} trend="+2 this month" />
        <StatCard title="Completed" value={2} icon={CheckCircle2} />
        <StatCard title="Pending" value={3} icon={Clock} description="Assignments due" />
        <StatCard title="Avg Score" value="87%" icon={TrendingUp} trend="+5% from last" />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Completion Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Completion Progress</CardTitle>
            <CardDescription>Your course completions over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.52 0.14 240)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.52 0.14 240)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'oklch(0.556 0 0)' }} />
                  <YAxis className="text-xs" tick={{ fill: 'oklch(0.556 0 0)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.922 0 0)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="oklch(0.52 0.14 240)"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {activity.type === 'enrollment' && <BookOpen className="h-4 w-4 text-primary" />}
                  {activity.type === 'submission' && <FileText className="h-4 w-4 text-primary" />}
                  {activity.type === 'grade' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {activity.type === 'announcement' && <AlertCircle className="h-4 w-4 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines + Course Progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                <CardDescription>Assignments that need your attention</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('assignments')}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{deadline.assignmentTitle}</p>
                  <p className="text-xs text-muted-foreground">{deadline.courseTitle}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={deadline.status === 'SUBMITTED' ? 'secondary' : 'default'} className="text-xs">
                    {deadline.status === 'SUBMITTED' ? 'Submitted' : 'Pending'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{format(new Date(deadline.dueDate), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">My Courses</CardTitle>
                <CardDescription>Your current course progress</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('my-courses')}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseProgress.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{course.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{course.category}</Badge>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">{Math.round(course.progress)}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Professor Dashboard
function ProfessorDashboard() {
  const { navigate } = useAppStore();

  const recentSubmissions = [
    { id: '1', studentName: 'Alice Johnson', assignment: 'Midterm Project', course: 'Intro to CS', submittedAt: '2025-02-10T14:30:00Z' },
    { id: '2', studentName: 'Bob Smith', assignment: 'Lab 4 Report', course: 'Data Structures', submittedAt: '2025-02-10T10:15:00Z' },
    { id: '3', studentName: 'Carol Williams', assignment: 'Essay Draft', course: 'Technical Writing', submittedAt: '2025-02-09T22:00:00Z' },
    { id: '4', studentName: 'David Brown', assignment: 'Final Project', course: 'Web Development', submittedAt: '2025-02-09T18:45:00Z' },
  ];

  const coursePerformance = [
    { id: '1', title: 'Introduction to CS', students: 45, avgCompletion: 72, avgScore: 81 },
    { id: '2', title: 'Data Structures', students: 32, avgCompletion: 65, avgScore: 78 },
    { id: '3', title: 'Web Development', students: 28, avgCompletion: 85, avgScore: 86 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your teaching activity.</p>
        </div>
        <Button onClick={() => navigate('course-editor')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard title="My Courses" value={4} icon={BookMarked} />
        <StatCard title="Total Students" value={156} icon={Users} trend="+12 this week" />
        <StatCard title="Pending Grading" value={23} icon={ClipboardList} description="Needs attention" />
        <StatCard title="Avg Completion" value="74%" icon={TrendingUp} trend="+3% this month" />
      </div>

      {/* Chart + Submissions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Student Enrollment Trend</CardTitle>
            <CardDescription>New enrollments per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fill: 'oklch(0.556 0 0)' }} />
                  <YAxis tick={{ fill: 'oklch(0.556 0 0)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.922 0 0)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" fill="oklch(0.52 0.14 240)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Needs Grading</CardTitle>
              <Badge variant="destructive">{recentSubmissions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {recentSubmissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{sub.studentName}</p>
                  <p className="text-xs text-muted-foreground">{sub.assignment}</p>
                  <p className="text-xs text-muted-foreground">{sub.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{format(new Date(sub.submittedAt), 'MMM d')}</p>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto mt-1 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Performance</CardTitle>
          <CardDescription>Overview of your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coursePerformance.map((course) => (
              <div key={course.id} className="rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{course.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.students} students</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Completion</p>
                    <p className="text-sm font-semibold text-primary">{course.avgCompletion}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                    <p className="text-sm font-semibold">{course.avgScore}%</p>
                  </div>
                </div>
                <Progress value={course.avgCompletion} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const systemHealth = [
    { name: 'API Server', status: 'healthy' },
    { name: 'Database', status: 'healthy' },
    { name: 'File Storage', status: 'healthy' },
    { name: 'Email Service', status: 'warning' },
  ];

  const recentLogs = [
    { id: '1', user: 'Admin User', action: 'Updated user role', entity: 'User', time: '5 min ago' },
    { id: '2', user: 'System', action: 'Daily backup completed', entity: 'System', time: '1 hour ago' },
    { id: '3', user: 'Prof. Smith', action: 'Published course', entity: 'Course', time: '2 hours ago' },
    { id: '4', user: 'Admin User', action: 'Created announcement', entity: 'Announcement', time: '3 hours ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => useAppStore.getState().navigate('admin-users')}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button onClick={() => useAppStore.getState().navigate('admin-audit')}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Audit Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard title="Total Users" value={324} icon={Users} trend="+18 this week" />
        <StatCard title="Total Courses" value={48} icon={BookMarked} trend="+3 this month" />
        <StatCard title="Enrollments" value={1250} icon={GraduationCap} trend="+85 this month" />
        <StatCard title="Active Users" value={198} icon={UserCheck} description="Last 30 days" />
      </div>

      {/* User Growth Chart + System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>Students and professors joined per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fill: 'oklch(0.556 0 0)' }} />
                  <YAxis tick={{ fill: 'oklch(0.556 0 0)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.922 0 0)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="students" fill="oklch(0.52 0.14 240)" radius={[4, 4, 0, 0]} name="Students" />
                  <Bar dataKey="professors" fill="oklch(0.60 0.10 230)" radius={[4, 4, 0, 0]} name="Professors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemHealth.map((service) => (
              <div key={service.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">{service.name}</span>
                </div>
                <Badge
                  variant={service.status === 'healthy' ? 'default' : 'destructive'}
                  className={
                    service.status === 'healthy'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : ''
                  }
                >
                  {service.status === 'healthy' ? 'Healthy' : 'Warning'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => useAppStore.getState().navigate('admin-audit')}>
              View all logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.user} &middot; {log.entity}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{log.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard
export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role: Role = user?.role || 'STUDENT';

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return <AdminDashboard />;
  }
  if (role === 'PROFESSOR') {
    return <ProfessorDashboard />;
  }
  return <StudentDashboard />;
}
