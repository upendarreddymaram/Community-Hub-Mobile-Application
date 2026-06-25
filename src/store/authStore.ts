import { create } from 'zustand';
import type { AuthSession, LoginCredentials } from '../types/auth';
import { STORAGE_KEYS } from '../utils/constants';
import { getJsonItem, removeItem, setJsonItem } from '../utils/storage';
import { authApi } from '../api/authApi';

interface AuthState {
  session: AuthSession | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const session = await getJsonItem<AuthSession>(STORAGE_KEYS.AUTH_SESSION);
      set({ session, isHydrated: true });
    } catch {
      set({ session: null, isHydrated: true });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authApi.login(credentials);
      await setJsonItem(STORAGE_KEYS.AUTH_SESSION, session);
      set({ session, isLoading: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await removeItem(STORAGE_KEYS.AUTH_SESSION);
    set({ session: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
