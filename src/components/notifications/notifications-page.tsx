'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  INFO: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  SUCCESS: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  ERROR: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

const mockNotifications = [
  {
    id: '1',
    title: 'Assignment Graded',
    message: 'Your submission for "Hello World Program" has been graded. Score: 95/100',
    type: 'SUCCESS' as const,
    isRead: false,
    link: 'assignments',
    createdAt: '2025-02-12T14:30:00Z',
  },
  {
    id: '2',
    title: 'New Announcement',
    message: 'Prof. John Smith posted a new announcement in "Introduction to Computer Science"',
    type: 'INFO' as const,
    isRead: false,
    link: 'announcements',
    createdAt: '2025-02-12T10:00:00Z',
  },
  {
    id: '3',
    title: 'Assignment Deadline Approaching',
    message: '"Final Project - Full Stack App" is due in 2 days',
    type: 'WARNING' as const,
    isRead: false,
    link: 'assignments',
    createdAt: '2025-02-11T16:00:00Z',
  },
  {
    id: '4',
    title: 'Course Enrollment Confirmed',
    message: 'You have been successfully enrolled in "Machine Learning 101"',
    type: 'SUCCESS' as const,
    isRead: true,
    link: 'my-courses',
    createdAt: '2025-02-10T09:00:00Z',
  },
  {
    id: '5',
    title: 'New Course Available',
    message: 'A new course "Computer Networks" is now available for enrollment',
    type: 'INFO' as const,
    isRead: true,
    link: 'courses',
    createdAt: '2025-02-08T14:00:00Z',
  },
  {
    id: '6',
    title: 'Maintenance Notice',
    message: 'The platform will undergo maintenance on Feb 22 from 2-6 AM EST',
    type: 'WARNING' as const,
    isRead: true,
    link: null,
    createdAt: '2025-02-07T12:00:00Z',
  },
  {
    id: '7',
    title: 'Submission Received',
    message: 'Your submission for "Midterm Exam" has been received',
    type: 'SUCCESS' as const,
    isRead: true,
    link: 'assignments',
    createdAt: '2025-02-06T15:30:00Z',
  },
];

export function NotificationsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleClick = (notification: typeof mockNotifications[0]) => {
    handleMarkRead(notification.id);
    if (notification.link) {
      navigate(notification.link as any);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <Card
                key={notification.id}
                className={`hover:bg-muted/30 transition-colors cursor-pointer group ${
                  !notification.isRead ? 'border-l-2 border-l-primary' : ''
                }`}
                onClick={() => handleClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgColor} mt-0.5`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-primary h-2 w-2 p-0 rounded-full min-w-2" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {notification.link && (
                          <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
