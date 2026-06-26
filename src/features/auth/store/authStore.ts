import { create } from 'zustand';
import type {
  AuthSession,
  LoginCredentials,
  PersistedAuthProfile,
} from '../../../types/auth';
import { STORAGE_KEYS } from '../../../utils/constants';
import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from '../../../utils/secureStorage';
import { getJsonItem, removeItem, setJsonItem } from '../../../utils/storage';
import { trackEvent } from '../../../utils/analytics';
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
      const [profile, token] = await Promise.all([
        getJsonItem<PersistedAuthProfile>(STORAGE_KEYS.AUTH_SESSION),
        getAuthToken(),
      ]);

      if (profile?.user && token) {
        set({
          session: { user: profile.user, token },
          isHydrated: true,
        });
        return;
      }

      if (profile || token) {
        await removeItem(STORAGE_KEYS.AUTH_SESSION);
        await clearAuthToken();
      }

      set({ session: null, isHydrated: true });
    } catch {
      set({ session: null, isHydrated: true });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authApi.login(credentials);
      await Promise.all([
        setJsonItem<PersistedAuthProfile>(STORAGE_KEYS.AUTH_SESSION, {
          user: session.user,
        }),
        saveAuthToken(session.token),
      ]);
      set({ session, isLoading: false });
      trackEvent('login_success');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await Promise.all([removeItem(STORAGE_KEYS.AUTH_SESSION), clearAuthToken()]);
    set({ session: null, error: null });
    trackEvent('logout');
  },

  clearError: () => set({ error: null }),
}));

/** Token accessor for the API layer (outside React). */
export function getSessionToken(): string | null {
  return useAuthStore.getState().session?.token ?? null;
}
