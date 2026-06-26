import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useIsRestoring } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { navigationRef, resetToAuthFlow, resetToMainFlow } from './navigationRef';
import { getActiveRouteName, trackScreen } from '../utils/analytics';
import { useAuthStore } from '../features/auth/store/authStore';
import type { AuthSession } from '../types/auth';
import type { RootStackParamList } from '../types/navigation';
import { AppLogo } from '../components/common/AppLogo';
import { useTheme } from '../providers/ThemeProvider';
import { spacing } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const session = useAuthStore((state) => state.session);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isRestoringCache = useIsRestoring();
  const { colors, isDark } = useTheme();
  const previousSessionRef = useRef<AuthSession | null | undefined>(undefined);
  const routeNameRef = useRef<string | undefined>(undefined);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, isDark]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        },
        bootLogo: {
          marginBottom: spacing.md,
        },
        spinner: {
          marginTop: spacing.sm,
        },
      }),
    [colors.background],
  );

  const handleNavigationReady = useCallback(() => {
    previousSessionRef.current = session;

    const routeName = getActiveRouteName(navigationRef.getRootState());
    routeNameRef.current = routeName;
    if (routeName) {
      trackScreen(routeName);
    }
  }, [session]);

  const handleNavigationStateChange = useCallback(() => {
    const routeName = getActiveRouteName(navigationRef.getRootState());
    if (!routeName || routeNameRef.current === routeName) {
      return;
    }

    routeNameRef.current = routeName;
    trackScreen(routeName);
  }, []);

  useEffect(() => {
    if (!navigationRef.isReady() || previousSessionRef.current === undefined) {
      return;
    }

    if (previousSessionRef.current === session) {
      return;
    }

    previousSessionRef.current = session;

    if (session) {
      resetToMainFlow();
      return;
    }

    resetToAuthFlow();
  }, [session]);

  if (!isHydrated || isRestoringCache) {
    return (
      <View style={styles.loading}>
        <AppLogo size="md" elevated containerStyle={styles.bootLogo} />
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={session ? 'Main' : 'Auth'}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
