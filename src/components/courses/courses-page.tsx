'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Users,
  BookOpen,
  GraduationCap,
  GraduationCapIcon,
  Eye,
  BarChart3,
} from 'lucide-react';
import type { Course, CourseLevel, CourseStatus } from '@/types';

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Computer Science',
    description: 'Learn the fundamentals of computer science including algorithms, data structures, and programming concepts.',
    thumbnail: null,
    instructorId: 'prof-1',
    category: 'Computer Science',
    level: 'BEGINNER',
    status: 'PUBLISHED',
    maxStudents: 100,
    enrollCount: 45,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    instructor: { id: 'prof-1', firstName: 'John', lastName: 'Smith', avatar: null, email: 'john@example.com' },
    _count: { modules: 8, enrollments: 45, assignments: 12, announcements: 3 },
  },
  {
    id: '2',
    title: 'Advanced Data Structures',
    description: 'Deep dive into advanced data structures: trees, graphs, hash tables, and their real-world applications.',
    thumbnail: null,
    instructorId: 'prof-2',
    category: 'Computer Science',
    level: 'ADVANCED',
    status: 'PUBLISHED',
    maxStudents: 50,
    enrollCount: 32,
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
    instructor: { id: 'prof-2', firstName: 'Jane', lastName: 'Doe', avatar: null, email: 'jane@example.com' },
    _count: { modules: 10, enrollments: 32, assignments: 15, announcements: 5 },
  },
  {
    id: '3',
    title: 'Web Development Fundamentals',
    description: 'Master HTML, CSS, JavaScript, and modern frameworks to build responsive web applications.',
    thumbnail: null,
    instructorId: 'prof-1',
    category: 'Development',
    level: 'BEGINNER',
    status: 'PUBLISHED',
    maxStudents: 80,
    enrollCount: 67,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
    instructor: { id: 'prof-1', firstName: 'John', lastName: 'Smith', avatar: null, email: 'john@example.com' },
    _count: { modules: 12, enrollments: 67, assignments: 20, announcements: 7 },
  },
  {
    id: '4',
    title: 'Machine Learning 101',
    description: 'Introduction to machine learning algorithms, neural networks, and practical applications.',
    thumbnail: null,
    instructorId: 'prof-3',
    category: 'Artificial Intelligence',
    level: 'INTERMEDIATE',
    status: 'PUBLISHED',
    maxStudents: 60,
    enrollCount: 58,
    createdAt: '2025-02-05T00:00:00Z',
    updatedAt: '2025-02-05T00:00:00Z',
    instructor: { id: 'prof-3', firstName: 'Alan', lastName: 'Turing', avatar: null, email: 'alan@example.com' },
    _count: { modules: 15, enrollments: 58, assignments: 18, announcements: 4 },
  },
  {
    id: '5',
    title: 'Database Design & SQL',
    description: 'Learn relational database design, SQL queries, normalization, and optimization techniques.',
    thumbnail: null,
    instructorId: 'prof-2',
    category: 'Computer Science',
    level: 'INTERMEDIATE',
    status: 'PUBLISHED',
    maxStudents: 40,
    enrollCount: 28,
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2025-02-10T00:00:00Z',
    instructor: { id: 'prof-2', firstName: 'Jane', lastName: 'Doe', avatar: null, email: 'jane@example.com' },
    _count: { modules: 6, enrollments: 28, assignments: 8, announcements: 2 },
  },
  {
    id: '6',
    title: 'Computer Networks',
    description: 'Understand networking protocols, TCP/IP, routing, and modern network architectures.',
    thumbnail: null,
    instructorId: 'prof-3',
    category: 'Computer Science',
    level: 'BEGINNER',
    status: 'DRAFT',
    maxStudents: 50,
    enrollCount: 0,
    createdAt: '2025-02-12T00:00:00Z',
    updatedAt: '2025-02-12T00:00:00Z',
    instructor: { id: 'prof-3', firstName: 'Alan', lastName: 'Turing', avatar: null, email: 'alan@example.com' },
    _count: { modules: 8, enrollments: 0, assignments: 10, announcements: 0 },
  },
];

const levelColors: Record<CourseLevel, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const categories = ['All', 'Computer Science', 'Development', 'Artificial Intelligence'];
const levels: (CourseLevel | 'ALL')[] = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const gradientColors = [
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-emerald-500 to-green-400',
  'from-green-400 to-lime-500',
  'from-teal-500 to-emerald-400',
  'from-emerald-300 to-teal-400',
];

export function CoursesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState<string>('ALL');
  const navigate = useAppStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isProfessor = user?.role === 'PROFESSOR';

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || course.category === category;
      const matchesLevel = level === 'ALL' || course.level === level;
      return matchesSearch && matchesCategory && matchesLevel && course.status === 'PUBLISHED';
    });
  }, [search, category, level]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Browse Courses</h1>
          <p className="text-muted-foreground mt-1">Discover courses to start your learning journey</p>
        </div>
        {(isAdmin || isProfessor) && (
          <Button onClick={() => navigate('course-editor')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>
                {l === 'ALL' ? 'All Levels' : l.charAt(0) + l.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, index) => (
            <Card
              key={course.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate('course-detail', { courseId: course.id })}
            >
              {/* Thumbnail placeholder */}
              <div className={`h-40 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} flex items-center justify-center`}>
                <BookOpen className="h-12 w-12 text-white/60" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${levelColors[course.level]}`}>
                      {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                    </Badge>
                    {course.category && (
                      <span className="text-xs text-muted-foreground">{course.category}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base leading-tight line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={course.instructor?.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {course.instructor?.firstName} {course.instructor?.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course.enrollCount} enrolled
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {course._count?.modules || 0} modules
                  </span>
                </div>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('course-detail', { courseId: course.id });
                  }}
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  View Course
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No courses found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
