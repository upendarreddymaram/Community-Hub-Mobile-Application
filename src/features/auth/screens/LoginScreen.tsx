import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, AppLogo } from '../../../components/common';
import { useLoginForm } from '../hooks/useLoginForm';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { ThemeColors } from '../../../theme/colors';
import { radii, spacing, typography } from '../../../theme';

const SHEET_RADIUS = 28;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    headerSafe: {
      backgroundColor: colors.primary,
      width: '100%',
      alignItems: 'center',
    },
    header: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    logo: {
      alignSelf: 'center',
    },
    flex: {
      flex: 1,
    },
    sheetScroll: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: SHEET_RADIUS,
      borderTopRightRadius: SHEET_RADIUS,
    },
    sheetContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    form: {
      gap: 0,
    },
    errorBanner: {
      backgroundColor: colors.errorBackground,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      lineHeight: 20,
    },
    demoLink: {
      alignSelf: 'center',
      marginTop: spacing.xl,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    demoLinkPressed: {
      opacity: 0.6,
    },
    demoLinkText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    footerSafe: {
      backgroundColor: colors.surface,
    },
    footer: {
      ...typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingBottom: spacing.sm,
    },
  });
}

export function LoginScreen() {
  const styles = useThemedStyles(createStyles);
  const {
    email,
    password,
    errors,
    touched,
    isLoading,
    serverError,
    isFormValid,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit,
    handleFillDemo,
  } = useLoginForm();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <AppLogo size="lg" elevated containerStyle={styles.logo} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greeting} accessibilityRole="header">
            Welcome back
          </Text>
          <Text style={styles.subtitle}>
            Sign in to explore communities and join the conversation.
          </Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={() => handleBlur('email')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              placeholder="you@example.com"
              error={touched.email ? errors.email : undefined}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={() => handleBlur('password')}
              secureTextEntry
              showPasswordToggle
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              placeholder="Enter password"
              onSubmitEditing={() => void handleSubmit()}
              error={touched.password ? errors.password : undefined}
            />

            {serverError ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}

            <Button
              label="Sign In"
              onPress={() => void handleSubmit()}
              loading={isLoading}
              disabled={!isFormValid || isLoading}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fill demo account credentials"
            disabled={isLoading}
            onPress={handleFillDemo}
            style={({ pressed }) => [styles.demoLink, pressed && styles.demoLinkPressed]}
          >
            <Text style={styles.demoLinkText}>Try demo account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
        <Text style={styles.footer}>Mock authentication — for demo only</Text>
      </SafeAreaView>
    </View>
  );
}
