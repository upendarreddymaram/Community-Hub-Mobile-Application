import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/authStore';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const hydrateAuth = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  return <>{children}</>;
}

export function AppProviders() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary fallbackMessage="The app encountered an unexpected error.">
        <AppBootstrap>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
          <RootNavigator />
        </AppBootstrap>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
