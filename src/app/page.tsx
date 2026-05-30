'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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

  // Show polished loading screen on first load
  if (!initialized || isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.15_0.04_250)] via-[oklch(0.20_0.06_250)] to-[oklch(0.25_0.08_240)] dark:from-[oklch(0.10_0.03_250)] dark:via-[oklch(0.14_0.05_250)] dark:to-[oklch(0.18_0.07_240)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/80 dark:hidden" />

        {/* Animated blobs */}
        <div className="absolute top-1/3 -left-16 h-56 w-56 rounded-full bg-[oklch(0.52_0.14_240)]/15 dark:bg-[oklch(0.52_0.14_240)]/8 blur-3xl animate-blob" />
        <div className="absolute bottom-1/3 -right-16 h-64 w-64 rounded-full bg-[oklch(0.72_0.12_215)]/15 dark:bg-[oklch(0.72_0.12_215)]/8 blur-3xl animate-blob [animation-delay:2000ms]" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          {/* Pulsing logo */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="drop-shadow-lg"
          >
            <Image
              src="/logo.png"
              alt="Elévate"
              width={56}
              height={56}
              className="rounded-2xl"
            />
          </motion.div>

          {/* Fade-in text */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold tracking-tight text-white dark:text-white">
              Elévate
            </h2>
            <p className="text-sm text-blue-200/60 dark:text-blue-200/40 mt-1">
              Loading your experience...
            </p>
          </motion.div>
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
