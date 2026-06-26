import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuthStore } from '../features/auth/store/authStore';
import type { RootStackParamList } from '../types/navigation';
import { AppLogo } from '../components/common/AppLogo';
import { useTheme } from '../providers/ThemeProvider';
import { spacing } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const session = useAuthStore((state) => state.session);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(
    () => {
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
    },
    [colors, isDark],
  );

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

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <AppLogo size="md" elevated containerStyle={styles.bootLogo} />
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
