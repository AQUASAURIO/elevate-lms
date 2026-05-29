'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/app-store';
import {
  BookOpen,
  Clock,
  ArrowRight,
  GraduationCap,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

const mockEnrolledCourses = [
  {
    id: '1',
    title: 'Introduction to Computer Science',
    category: 'Computer Science',
    level: 'BEGINNER' as const,
    progress: 75,
    lastAccessed: '2025-02-12T14:30:00Z',
    instructor: 'Prof. John Smith',
    thumbnail: null,
  },
  {
    id: '2',
    title: 'Data Structures & Algorithms',
    category: 'Computer Science',
    level: 'INTERMEDIATE' as const,
    progress: 45,
    lastAccessed: '2025-02-11T10:00:00Z',
    instructor: 'Prof. Jane Doe',
    thumbnail: null,
  },
  {
    id: '3',
    title: 'Web Development Fundamentals',
    category: 'Development',
    level: 'BEGINNER' as const,
    progress: 100,
    lastAccessed: '2025-02-08T16:00:00Z',
    instructor: 'Prof. John Smith',
    thumbnail: null,
  },
  {
    id: '4',
    title: 'Machine Learning 101',
    category: 'AI',
    level: 'INTERMEDIATE' as const,
    progress: 20,
    lastAccessed: '2025-02-10T09:00:00Z',
    instructor: 'Prof. Alan Turing',
    thumbnail: null,
  },
  {
    id: '5',
    title: 'Database Design & SQL',
    category: 'Computer Science',
    level: 'INTERMEDIATE' as const,
    progress: 60,
    lastAccessed: '2025-02-09T13:00:00Z',
    instructor: 'Prof. Jane Doe',
    thumbnail: null,
  },
];

const gradientColors = [
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-emerald-500 to-green-400',
  'from-green-400 to-lime-500',
  'from-teal-500 to-emerald-400',
];

export function MyCoursesPage() {
  const [filter, setFilter] = useState('all');
  const navigate = useAppStore((s) => s.navigate);

  const filteredCourses = useMemo(() => {
    return mockEnrolledCourses.filter((course) => {
      if (filter === 'in-progress') return course.progress > 0 && course.progress < 100;
      if (filter === 'completed') return course.progress === 100;
      return true;
    });
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">Track your enrolled courses and progress</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, index) => (
            <Card
              key={course.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate('course-detail', { courseId: course.id })}
            >
              <div className={`h-28 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} flex items-center justify-center`}>
                <BookOpen className="h-10 w-10 text-white/60" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                    </Badge>
                    {course.progress === 100 && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-muted-foreground">{course.instructor}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-primary">{Math.round(course.progress)}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last accessed {format(new Date(course.lastAccessed), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0">
                <Button
                  className="w-full"
                  size="sm"
                  variant={course.progress === 100 ? 'outline' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('course-detail', { courseId: course.id });
                  }}
                >
                  {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No courses found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'all'
                ? 'You haven\'t enrolled in any courses yet'
                : `No ${filter} courses`}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('courses')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
