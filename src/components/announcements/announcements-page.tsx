'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import {
  Megaphone,
  Pin,
  BookOpen,
  Clock,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const mockAnnouncements = [
  {
    id: '1',
    title: 'Welcome to the Spring 2025 Semester!',
    content: 'We are excited to kick off the new semester. Please review the updated syllabus for each of your courses and make sure you have access to all required materials. Office hours will be posted by each instructor on their respective course pages.',
    courseTitle: 'General',
    author: { firstName: 'Admin', lastName: 'Team', avatar: null },
    isPinned: true,
    isRead: false,
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: '2',
    title: 'Scheduled Maintenance - Feb 22',
    content: 'The platform will undergo scheduled maintenance on February 22, 2025, from 2:00 AM to 6:00 AM EST. During this time, the system will be unavailable. Please plan your studies accordingly.',
    courseTitle: 'General',
    author: { firstName: 'System', lastName: 'Admin', avatar: null },
    isPinned: true,
    isRead: false,
    createdAt: '2025-02-10T14:00:00Z',
  },
  {
    id: '3',
    title: 'Midterm Exam Schedule Published',
    content: 'The midterm exam schedule for all courses has been published. Please check your course pages for specific dates and times. Make sure to review the exam policies and bring valid identification.',
    courseTitle: 'Introduction to Computer Science',
    author: { firstName: 'John', lastName: 'Smith', avatar: null },
    isPinned: false,
    isRead: true,
    createdAt: '2025-02-08T11:00:00Z',
  },
  {
    id: '4',
    title: 'New Study Resources Available',
    content: 'We have added new supplementary materials for the Data Structures course including practice problems with solutions and video walkthroughs of complex algorithms. Access them from the course modules page.',
    courseTitle: 'Data Structures & Algorithms',
    author: { firstName: 'Jane', lastName: 'Doe', avatar: null },
    isPinned: false,
    isRead: true,
    createdAt: '2025-02-06T10:30:00Z',
  },
  {
    id: '5',
    title: 'Guest Lecture: AI in Education',
    content: 'Join us for a special guest lecture by Dr. Emily Chen on "The Future of AI in Education" on March 15, 2025 at 3:00 PM in the Main Auditorium. All students and faculty are welcome to attend.',
    courseTitle: 'Machine Learning 101',
    author: { firstName: 'Alan', lastName: 'Turing', avatar: null },
    isPinned: false,
    isRead: false,
    createdAt: '2025-02-05T16:00:00Z',
  },
  {
    id: '6',
    title: 'Project Submission Deadline Extended',
    content: 'Due to the recent system update, the project submission deadline for the Web Development course has been extended by 3 days. The new deadline is February 25, 2025.',
    courseTitle: 'Web Development Fundamentals',
    author: { firstName: 'John', lastName: 'Smith', avatar: null },
    isPinned: false,
    isRead: true,
    createdAt: '2025-02-04T13:00:00Z',
  },
];

export function AnnouncementsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [announcements] = useState(mockAnnouncements);

  const pinned = announcements.filter((a) => a.isPinned);
  const unpinned = announcements.filter((a) => !a.isPinned);

  const renderAnnouncement = (announcement: typeof mockAnnouncements[0]) => (
    <Card
      key={announcement.id}
      className={`hover:bg-muted/30 transition-colors ${
        !announcement.isRead ? 'border-l-2 border-l-primary' : ''
      }`}
    >
      <CardContent className="p-4 md:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
              <AvatarImage src={announcement.author.avatar || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {announcement.author.firstName[0]}{announcement.author.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {announcement.isPinned && (
                  <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                <h3 className="text-sm font-semibold">{announcement.title}</h3>
                {!announcement.isRead && (
                  <Badge variant="default" className="bg-primary h-4 w-4 p-0 rounded-full text-[0] min-w-4" />
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{announcement.content}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="font-medium">
                  {announcement.author.firstName} {announcement.author.lastName}
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {announcement.courseTitle}
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground mt-1">Stay updated with the latest news and updates</p>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-muted-foreground">Pinned</h2>
          </div>
          {pinned.map(renderAnnouncement)}
        </div>
      )}

      {/* Unpinned */}
      <div className="space-y-3">
        {unpinned.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">Recent</h2>
            </div>
            {unpinned.map(renderAnnouncement)}
          </>
        )}

        {announcements.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No announcements yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back later for updates</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
