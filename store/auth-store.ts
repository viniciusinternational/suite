import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  hasHydrated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setNotificationId: (id: string) => void;
  setCurrentAccount: (account: CurrentAccount) => void;
  setHasHydrated: (state: boolean) => void;
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
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setNotificationId: (notificationId) => set({ notificationId }),
      setCurrentAccount: (currentAccount) => set({ currentAccount }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        notificationId: state.notificationId,
        token: state.token,
        refreshToken: state.refreshToken,
        currentAccount: state.currentAccount,
        // hasHydrated is excluded - it's runtime state only
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
