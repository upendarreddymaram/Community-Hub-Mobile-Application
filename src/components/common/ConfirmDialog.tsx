import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';
import { useAnimatedValue } from '../../utils/animatedValue';
import { radii, spacing, typography } from '../../theme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.errorBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      alignSelf: 'center',
    },
    icon: {
      fontSize: 24,
    },
    title: {
      ...typography.subtitle,
      fontSize: 20,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    detailBox: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailText: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionBase: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmPrimary: {
      backgroundColor: colors.primary,
    },
    confirmDanger: {
      backgroundColor: colors.error,
    },
    actionPressed: {
      opacity: 0.85,
    },
    cancelLabel: {
      ...typography.subtitle,
      fontSize: 16,
      color: colors.primary,
    },
    confirmLabel: {
      ...typography.subtitle,
      fontSize: 16,
      color: '#fff',
    },
  });
}

export function ConfirmDialog({
  visible,
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const backdropOpacity = useAnimatedValue(0);
  const cardScale = useAnimatedValue(0.92);
  const cardOpacity = useAnimatedValue(0);

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.92);
      cardOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, cardOpacity, cardScale, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: backdropOpacity, backgroundColor: colors.overlay },
          ]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
          accessibilityViewIsModal
        >
          {variant === 'destructive' ? (
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>🗑️</Text>
            </View>
          ) : null}

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>

          {detail ? (
            <View style={styles.detailBox}>
              <Text style={styles.detailText} numberOfLines={2}>
                {detail}
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityHint="Closes the dialog without deleting"
              onPress={onCancel}
              disabled={confirmLoading}
              style={({ pressed }) => [
                styles.actionBase,
                styles.cancelButton,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityHint={
                variant === 'destructive'
                  ? 'Permanently deletes this post from your device'
                  : undefined
              }
              onPress={onConfirm}
              disabled={confirmLoading}
              style={({ pressed }) => [
                styles.actionBase,
                variant === 'destructive' ? styles.confirmDanger : styles.confirmPrimary,
                pressed && styles.actionPressed,
              ]}
            >
              {confirmLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
