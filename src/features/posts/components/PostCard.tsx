import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { canManagePost } from '../../../utils/postHelpers';
import type { Post } from '../../../types/post';
import type { ThemeColors } from '../../../theme/colors';
import { radii, spacing, typography } from '../../../theme';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    localCard: {
      borderColor: colors.primaryMuted,
    },
    optimistic: {
      opacity: 0.75,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.subtitle,
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    localBadge: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.pill,
    },
    localBadgeText: {
      ...typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    body: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    meta: {
      ...typography.small,
      color: colors.textSecondary,
    },
    syncing: {
      ...typography.small,
      color: colors.primary,
      marginTop: spacing.xs,
      fontWeight: '600',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    actionButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    actionPressed: {
      opacity: 0.7,
    },
    editLabel: {
      ...typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    deleteLabel: {
      ...typography.small,
      color: colors.error,
      fontWeight: '600',
    },
  });
}

function formatPostDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PostCardComponent({ post, onEdit, onDelete }: PostCardProps) {
  const styles = useThemedStyles(createStyles);
  const formattedDate = formatPostDate(post.updatedAt ?? post.createdAt);
  const manageable = canManagePost(post);
  const accessibilityLabel = `${post.title}. By ${post.authorName}. ${formattedDate}.${
    post.isOptimistic ? ' Syncing.' : ''
  }${manageable ? ' Your post.' : ''}`;

  return (
    <View
      style={[
        styles.card,
        manageable && styles.localCard,
        post.isOptimistic && styles.optimistic,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>{post.title}</Text>
        {manageable ? (
          <View style={styles.localBadge}>
            <Text style={styles.localBadgeText}>Yours</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.body}>{post.body}</Text>

      <View style={styles.footer}>
        <Text style={styles.meta}>{post.authorName}</Text>
        <Text style={styles.meta}>{formattedDate}</Text>
      </View>

      {post.isOptimistic ? (
        <Text style={styles.syncing} accessibilityLiveRegion="polite">
          Syncing...
        </Text>
      ) : null}

      {manageable && onEdit && onDelete ? (
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit post ${post.title}`}
            onPress={() => onEdit(post)}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={styles.editLabel}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete post ${post.title}`}
            onPress={() => onDelete(post)}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={styles.deleteLabel}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export const PostCard = memo(PostCardComponent);
