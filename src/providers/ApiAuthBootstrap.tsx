import { useEffect } from 'react';
import { configureApiAuth } from '../api/authInterceptor';
import { useAuthStore } from '../features/auth/store/authStore';

export function ApiAuthBootstrap() {
  useEffect(() => {
    configureApiAuth(
      () => useAuthStore.getState().session?.token ?? null,
      () => {
        void useAuthStore.getState().logout();
      },
    );
  }, []);

  return null;
}
