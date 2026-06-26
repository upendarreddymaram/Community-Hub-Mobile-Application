import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ErrorView, LoadingView, OfflineBanner } from '../../../components/common';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { PostCard } from '../../../features/posts/components/PostCard';
import { useCommunityDetail } from '../hooks/useCommunities';
import { useJoinLeaveCommunity } from '../hooks/useJoinLeaveCommunity';
import { useCommunityPosts } from '../../../features/posts/hooks/usePosts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useTheme } from '../../../providers/ThemeProvider';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useOfflineQueueStore } from '../../../store/offlineQueueStore';
import type { Post } from '../../../types/post';
import type { MainStackParamList } from '../../../types/navigation';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'CommunityDetail'>;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    headerCard: {
      backgroundColor: colors.surface,
      margin: spacing.md,
      padding: spacing.lg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
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
    postsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.subtitle,
      color: colors.text,
    },
    postItem: {
      paddingHorizontal: spacing.md,
    },
    postSeparator: {
      height: spacing.md,
    },
    emptyPosts: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
  });
}

export function CommunityDetailScreen({ route, navigation }: Props) {
  const { communityId } = route.params;
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isOnline } = useNetworkStatus();
  const pendingCount = useOfflineQueueStore((state) => state.queue.length);

  const communityQuery = useCommunityDetail(communityId);
  const postsQuery = useCommunityPosts(communityId);
  const {
    join,
    leave,
    isJoining,
    isLeaving,
    joinError,
    leaveError,
    retryJoin,
    retryLeave,
  } = useJoinLeaveCommunity(communityId);

  const community = communityQuery.data;
  const posts = postsQuery.data ?? [];

  const handleToggleMembership = useCallback(() => {
    if (!community) {
      return;
    }
    if (community.isJoined) {
      leave();
    } else {
      join();
    }
  }, [community, join, leave]);

  const membershipError = joinError ?? leaveError;

  const handleRefresh = useCallback(() => {
    void communityQuery.refetch();
    void postsQuery.refetch();
  }, [communityQuery, postsQuery]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <View style={styles.postItem}>
        <PostCard post={item} />
      </View>
    ),
    [styles.postItem],
  );

  const renderSeparator = useCallback(
    () => <View style={styles.postSeparator} />,
    [styles.postSeparator],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const listHeader = useMemo(() => {
    if (!community) {
      return null;
    }

    return (
      <>
        <View style={styles.headerCard}>
          <Text style={styles.name}>{community.name}</Text>
          <Text style={styles.description}>{community.description}</Text>

          <View style={styles.statsRow}>
            <StatItem label="Members" value={community.memberCount.toLocaleString()} styles={styles} />
            <StatItem label="Posts" value={community.postCount.toLocaleString()} styles={styles} />
            <StatItem label="Category" value={community.category} styles={styles} />
          </View>

          <Button
            label={community.isJoined ? 'Leave Community' : 'Join Community'}
            variant={community.isJoined ? 'secondary' : 'primary'}
            loading={isJoining || isLeaving}
            onPress={handleToggleMembership}
            style={styles.membershipButton}
          />

          {membershipError ? (
            <View style={styles.actionError}>
              <Text style={styles.actionErrorText}>
                {membershipError instanceof Error
                  ? membershipError.message
                  : 'Action failed'}
              </Text>
              <Button
                label="Retry"
                variant="ghost"
                onPress={() => (community.isJoined ? retryLeave() : retryJoin())}
              />
            </View>
          ) : null}

          <Button
            label="Create Post"
            onPress={() =>
              navigation.navigate('CreatePost', {
                communityId,
                communityName: community.name,
              })
            }
            style={styles.createPostButton}
          />
        </View>

        <View style={styles.postsHeader}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <Button label="Refresh" variant="secondary" onPress={handleRefresh} />
        </View>
      </>
    );
  }, [
    community,
    communityId,
    handleRefresh,
    handleToggleMembership,
    isJoining,
    isLeaving,
    membershipError,
    navigation,
    retryJoin,
    retryLeave,
    styles,
  ]);

  const listEmpty = useMemo(() => {
    if (postsQuery.isLoading) {
      return <LoadingView message="Loading posts..." />;
    }

    if (postsQuery.isError) {
      return (
        <ErrorView
          message={
            postsQuery.error instanceof Error
              ? postsQuery.error.message
              : 'Failed to load posts'
          }
          onRetry={() => void postsQuery.refetch()}
        />
      );
    }

    return (
      <Text style={styles.emptyPosts}>No posts yet. Be the first to share!</Text>
    );
  }, [postsQuery.error, postsQuery.isError, postsQuery.isLoading, postsQuery.refetch, styles.emptyPosts]);

  if (communityQuery.isLoading && !community) {
    return <LoadingView message="Loading community..." />;
  }

  if (communityQuery.isError && !community) {
    return (
      <ErrorView
        message={
          communityQuery.error instanceof Error
            ? communityQuery.error.message
            : 'Failed to load community'
        }
        onRetry={() => void communityQuery.refetch()}
      />
    );
  }

  if (!community) {
    return null;
  }

  return (
    <ErrorBoundary fallbackMessage="Unable to render community details.">
      <View style={styles.container}>
        {!isOnline ? <OfflineBanner pendingActions={pendingCount} /> : null}

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={renderSeparator}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={[
            styles.listContent,
            posts.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={communityQuery.isRefetching || postsQuery.isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
        />
      </View>
    </ErrorBoundary>
  );
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
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
