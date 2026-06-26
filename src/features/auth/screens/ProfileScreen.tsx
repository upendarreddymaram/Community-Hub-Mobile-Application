import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, UserAvatar } from '../../../components/common';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useAuthStore } from '../store/authStore';
import type { MainStackParamList } from '../../../types/navigation';
import type { ThemeColors } from '../../../theme/colors';
import { radii, spacing, typography } from '../../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    name: {
      ...typography.title,
      color: colors.text,
      marginTop: spacing.md,
    },
    email: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    rowLabel: {
      ...typography.body,
      color: colors.text,
    },
    rowValue: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successBackground,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
      marginRight: spacing.xs,
    },
    statusText: {
      ...typography.small,
      color: colors.success,
      fontWeight: '600',
    },
    aboutText: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    signOutSection: {
      marginTop: spacing.md,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    signOutButton: {
      width: '100%',
    },
  });
}

export function ProfileScreen(_props: Props) {
  const styles = useThemedStyles(createStyles);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  if (!session) {
    return null;
  }

  const { user } = session;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileHeader}>
          <UserAvatar name={user.name} size={88} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active session</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Auth type</Text>
              <Text style={styles.rowValue}>Mock (demo)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              Your session is saved on this device. Sign out when you are done on a shared
              device.
            </Text>
          </View>
        </View>

        <View style={styles.signOutSection}>
          <Button
            label="Sign out"
            variant="danger"
            onPress={() => void logout()}
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
