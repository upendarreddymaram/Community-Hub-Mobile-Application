import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { Post } from '../../../types/post';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';

interface PostCardProps {
  post: Post;
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
    optimistic: {
      opacity: 0.75,
    },
    title: {
      ...typography.subtitle,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.xs,
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
  });
}

function PostCardComponent({ post }: PostCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, post.isOptimistic && styles.optimistic]}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body}>{post.body}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{post.authorName}</Text>
        <Text style={styles.meta}>{new Date(post.createdAt).toLocaleDateString()}</Text>
      </View>
      {post.isOptimistic ? <Text style={styles.syncing}>Syncing...</Text> : null}
    </View>
  );
}

export const PostCard = memo(PostCardComponent);
