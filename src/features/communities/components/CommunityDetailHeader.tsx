import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/common';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { Community } from '../../../types/community';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerCard: {
      backgroundColor: colors.surface,
      margin: spacing.md,
      padding: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerCardWide: {
      marginHorizontal: spacing.xl,
    },
    name: {
      ...typography.title,
      fontSize: 22,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      ...typography.subtitle,
      color: colors.text,
    },
    statLabel: {
      ...typography.small,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    membershipButton: {
      marginBottom: spacing.sm,
    },
    createPostButton: {
      marginTop: spacing.sm,
    },
    actionError: {
      backgroundColor: colors.errorBackground,
      borderRadius: 10,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    actionErrorText: {
      color: colors.error,
      ...typography.caption,
      marginBottom: spacing.xs,
    },
  });
}

interface CommunityDetailHeaderProps {
  community: Community;
  isWide: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  membershipError: unknown;
  onToggleMembership: () => void;
  onCreatePost: () => void;
  onRetryMembership: () => void;
}

function StatItem({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statItem} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CommunityDetailHeaderComponent({
  community,
  isWide,
  isJoining,
  isLeaving,
  membershipError,
  onToggleMembership,
  onCreatePost,
  onRetryMembership,
}: CommunityDetailHeaderProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.headerCard, isWide && styles.headerCardWide]}>
      <Text style={styles.name} accessibilityRole="header">
        {community.name}
      </Text>
      <Text style={styles.description}>{community.description}</Text>

      <View style={styles.statsRow} accessibilityRole="summary">
        <StatItem
          label="Members"
          value={community.memberCount.toLocaleString()}
          styles={styles}
        />
        <StatItem
          label="Posts"
          value={community.postCount.toLocaleString()}
          styles={styles}
        />
        <StatItem label="Category" value={community.category} styles={styles} />
      </View>

      <Button
        label={community.isJoined ? 'Leave Community' : 'Join Community'}
        variant={community.isJoined ? 'secondary' : 'primary'}
        loading={isJoining || isLeaving}
        onPress={onToggleMembership}
        style={styles.membershipButton}
        accessibilityLabel={
          community.isJoined ? `Leave ${community.name}` : `Join ${community.name}`
        }
        accessibilityHint={
          community.isJoined
            ? 'Removes this community from your joined list'
            : 'Adds this community to your joined list'
        }
      />

      {membershipError ? (
        <View style={styles.actionError} accessibilityLiveRegion="polite">
          <Text style={styles.actionErrorText}>
            {membershipError instanceof Error ? membershipError.message : 'Action failed'}
          </Text>
          <Button
            label="Retry"
            variant="ghost"
            onPress={onRetryMembership}
            accessibilityLabel={
              community.isJoined ? 'Retry leave community' : 'Retry join community'
            }
          />
        </View>
      ) : null}

      <Button
        label="Create Post"
        onPress={onCreatePost}
        style={styles.createPostButton}
        accessibilityHint={`Opens the create post form for ${community.name}`}
      />
    </View>
  );
}

export const CommunityDetailHeader = memo(CommunityDetailHeaderComponent);
