import { create } from 'zustand';
import { apiGet, apiPost } from '@/lib/api';
import type { User, LoginData, RegisterData } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('sw-ipp-token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('sw-ipp-refresh-token') : null,
  isAuthenticated: false,
  isLoading: true,

  login: async (data: LoginData) => {
    try {
      const response = await apiPost<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        if (data.rememberMe) {
          localStorage.setItem('sw-ipp-token', accessToken);
          localStorage.setItem('sw-ipp-refresh-token', refreshToken);
        } else {
          sessionStorage.setItem('sw-ipp-token', accessToken);
          sessionStorage.setItem('sw-ipp-refresh-token', refreshToken);
        }
        set({
          token: accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await apiPost<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('sw-ipp-token', accessToken);
        localStorage.setItem('sw-ipp-refresh-token', refreshToken);
        set({
          token: accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // Best-effort logout
    apiPost('/api/auth/logout').catch(() => {});
    localStorage.removeItem('sw-ipp-token');
    localStorage.removeItem('sw-ipp-refresh-token');
    sessionStorage.removeItem('sw-ipp-token');
    sessionStorage.removeItem('sw-ipp-refresh-token');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchUser: async () => {
    const token = get().token || localStorage.getItem('sw-ipp-token') || sessionStorage.getItem('sw-ipp-token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await apiGet<User>('/api/auth/me');
      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          token,
        });
      } else {
        // Token is invalid
        get().logout();
      }
    } catch (error) {
      // Try refresh token
      const refreshToken = get().refreshToken || localStorage.getItem('sw-ipp-refresh-token') || sessionStorage.getItem('sw-ipp-refresh-token');
      if (refreshToken) {
        try {
          const refreshResponse = await apiPost<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
            refreshToken,
          });
          if (refreshResponse.success && refreshResponse.data) {
            const storage = localStorage.getItem('sw-ipp-token') ? localStorage : sessionStorage;
            storage.setItem('sw-ipp-token', refreshResponse.data.accessToken);
            storage.setItem('sw-ipp-refresh-token', refreshResponse.data.refreshToken);

            set({ token: refreshResponse.data.accessToken, refreshToken: refreshResponse.data.refreshToken });

            // Retry fetch user
            const retryResponse = await apiGet<User>('/api/auth/me');
            if (retryResponse.success && retryResponse.data) {
              set({
                user: retryResponse.data,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
        } catch {
          // Refresh failed
        }
      }
      get().logout();
    }
  },

  updateUser: (data: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...data } });
    }
  },
}));
