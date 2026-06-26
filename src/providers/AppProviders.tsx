import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../navigation/RootNavigator';
import { useAuthStore } from '../features/auth/store/authStore';
import { useJoinedCommunitiesStore } from '../features/communities/store/joinedCommunitiesStore';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import { useOfflineSync } from '../features/communities/hooks/useJoinLeaveCommunity';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { ApiAuthBootstrap } from './ApiAuthBootstrap';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@community_hub/react_query_cache',
});

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateQueue = useOfflineQueueStore((state) => state.hydrate);
  const hydrateJoined = useJoinedCommunitiesStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateAuth();
    void hydrateQueue();
    void hydrateJoined();
  }, [hydrateAuth, hydrateQueue, hydrateJoined]);

  return <>{children}</>;
}

function ThemedStatusBar() {
  const { colors, isDark } = useTheme();

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={colors.background}
    />
  );
}

function OfflineSyncBootstrap() {
  useOfflineSync();
  return null;
}

export function AppProviders() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        <AppBootstrap>
          <ThemeProvider>
            <ErrorBoundary fallbackMessage="The app encountered an unexpected error.">
              <ApiAuthBootstrap />
              <OfflineSyncBootstrap />
              <ThemedStatusBar />
              <RootNavigator />
            </ErrorBoundary>
          </ThemeProvider>
        </AppBootstrap>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
