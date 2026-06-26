import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ErrorView, PostListSkeleton } from '../../../components/common';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    emptyPosts: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
  });
}

interface CommunityPostsEmptyStateProps {
  isLoading: boolean;
  isError: boolean;
  isOnline: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

function CommunityPostsEmptyStateComponent({
  isLoading,
  isError,
  isOnline,
  errorMessage,
  onRetry,
}: CommunityPostsEmptyStateProps) {
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return <PostListSkeleton />;
  }

  if (isError) {
    return (
      <ErrorView
        message={
          !isOnline
            ? 'Posts are unavailable offline. Cached posts and your local posts will appear when available.'
            : (errorMessage ?? 'Failed to load posts')
        }
        onRetry={onRetry}
      />
    );
  }

  return <Text style={styles.emptyPosts}>No posts yet. Be the first to share!</Text>;
}

export const CommunityPostsEmptyState = memo(CommunityPostsEmptyStateComponent);
