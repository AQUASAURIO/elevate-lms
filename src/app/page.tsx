'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/components/auth/login-page';
import { RegisterPage } from '@/components/auth/register-page';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { CoursesPage } from '@/components/courses/courses-page';
import { CourseDetailPage } from '@/components/courses/course-detail-page';
import { CourseEditorPage } from '@/components/courses/course-editor-page';
import { MyCoursesPage } from '@/components/courses/my-courses-page';
import { AssignmentsPage } from '@/components/assignments/assignments-page';
import { AnnouncementsPage } from '@/components/announcements/announcements-page';
import { AdminUsersPage } from '@/components/admin/admin-users-page';
import { AdminAuditPage } from '@/components/admin/admin-audit-page';
import { ProfilePage } from '@/components/profile/profile-page';
import { NotificationsPage } from '@/components/notifications/notifications-page';
import { PageLoading } from '@/components/shared/loading-skeleton';

type AuthView = 'login' | 'register';

export default function Home() {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const currentPage = useAppStore((s) => s.currentPage);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [initialized, setInitialized] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setInitialized(true);
    };
    init();
  }, [fetchUser]);

  // Derive auth view from state — no extra effect needed
  const activeAuthView = useMemo<AuthView>(() => {
    if (!isAuthenticated && initialized) return 'login';
    return authView;
  }, [isAuthenticated, initialized, authView]);

  // Show loading spinner on first load
  if (!initialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Elévate...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login/register
  if (!isAuthenticated) {
    return activeAuthView === 'login' ? (
      <LoginPage />
    ) : (
      <RegisterPage />
    );
  }

  // Authenticated — show app layout with routing
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'courses':
        return <CoursesPage />;
      case 'course-detail':
        return <CourseDetailPage />;
      case 'course-editor':
        return <CourseEditorPage />;
      case 'my-courses':
        return <MyCoursesPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'admin-users':
        return <AdminUsersPage />;
      case 'admin-audit':
        return <AdminAuditPage />;
      case 'profile':
        return <ProfilePage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
}
