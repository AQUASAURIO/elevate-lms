import { create } from 'zustand';

type PageName =
  | 'dashboard'
  | 'courses'
  | 'course-detail'
  | 'course-editor'
  | 'my-courses'
  | 'assignments'
  | 'announcements'
  | 'admin-users'
  | 'admin-audit'
  | 'profile'
  | 'notifications';

interface AppState {
  currentPage: PageName;
  courseDetailId: string | null;
  courseEditorId: string | null;
  sidebarOpen: boolean;
  navigate: (page: PageName, params?: Record<string, string>) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  courseDetailId: null,
  courseEditorId: null,
  sidebarOpen: true,

  navigate: (page, params = {}) => {
    set({
      currentPage: page,
      courseDetailId: params.courseId ?? null,
      courseEditorId: params.courseId ?? null,
    });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
}));
