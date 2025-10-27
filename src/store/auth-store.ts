import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface CurrentAccount {
  _id?: string;
  email?: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  notificationId: string | null;
  token: string | null;
  refreshToken: string | null;
  currentAccount: CurrentAccount | null;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setNotificationId: (id: string) => void;
  setCurrentAccount: (account: CurrentAccount) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      notificationId: null,
      token: null,
      refreshToken: null,
      currentAccount: null,
      setUser: (user) => set({ user }),
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setNotificationId: (notificationId) => set({ notificationId }),
      setCurrentAccount: (currentAccount) => set({ currentAccount }),
      logout: () => set({
        user: null,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        currentAccount: null,
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
