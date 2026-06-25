import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

export { AppLogo } from './AppLogo';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function Input({ label, error, showPasswordToggle, secureTextEntry, ...props }: InputProps) {
  const [isSecure, setIsSecure] = React.useState(Boolean(secureTextEntry));

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            showPasswordToggle && styles.inputWithToggle,
            error ? styles.inputError : undefined,
          ]}
          secureTextEntry={showPasswordToggle ? isSecure : secureTextEntry}
          {...props}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setIsSecure((current) => !current)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleLabel}>{isSecure ? 'Show' : 'Hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.centered} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function EmptyView({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {onRetry ? (
        <Button label="Try Again" onPress={onRetry} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function OfflineBanner({ pendingActions = 0 }: { pendingActions?: number }) {
  return (
    <View style={styles.offlineBanner} accessibilityLiveRegion="polite">
      <Text style={styles.offlineText}>
        You are offline. Cached data is shown
        {pendingActions > 0 ? ` • ${pendingActions} action(s) queued` : ''}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    ...typography.subtitle,
    fontSize: 16,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
  },
  inputWithToggle: {
    paddingRight: spacing.xl + spacing.md,
  },
  toggleButton: {
    position: 'absolute',
    right: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    ...typography.small,
    marginTop: spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    ...typography.caption,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.subtitle,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  emptyAction: {
    marginTop: spacing.lg,
    minWidth: 140,
  },
  offlineBanner: {
    backgroundColor: colors.offlineBackground,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  offlineText: {
    color: colors.offline,
    ...typography.small,
    textAlign: 'center',
    fontWeight: '600',
  },
});
