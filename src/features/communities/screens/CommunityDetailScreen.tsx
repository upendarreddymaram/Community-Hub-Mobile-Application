import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CommunityDetailSkeleton,
  ConfirmDialog,
  ErrorView,
  LoadingView,
  OfflineSyncBanner,
} from '../../../components/common';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { CommunityPostsEmptyState } from '../components/CommunityPostsEmptyState';
import { CommunityPostsListHeader } from '../components/CommunityPostsListHeader';
import { AnimatedPostCard } from '../../../features/posts/components/AnimatedPostCard';
import { useCommunityDetail } from '../hooks/useCommunities';
import { useJoinLeaveCommunity } from '../hooks/useJoinLeaveCommunity';
import {
  useInfiniteCommunityPosts,
  useDeletePost,
} from '../../../features/posts/hooks/usePosts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { useTheme } from '../../../providers/ThemeProvider';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { Post } from '../../../types/post';
import type { MainStackParamList } from '../../../types/navigation';
import type { ThemeColors } from '../../../theme/colors';
import { spacing } from '../../../theme';
import { trackEvent } from '../../../utils/analytics';

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
    postItem: {
      paddingHorizontal: spacing.md,
    },
    postSeparator: {
      height: spacing.md,
    },
  });
}

export function CommunityDetailScreen({ route, navigation }: Props) {
  const { communityId } = route.params;
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { contentContainerStyle, isWide } = useResponsiveLayout();
  const { isOnline } = useNetworkStatus();
  const { pendingCount, isSyncing, syncError, retrySync } = useOfflineSync();

  const communityQuery = useCommunityDetail(communityId);
  const postsQuery = useInfiniteCommunityPosts(communityId);
  const deletePost = useDeletePost(communityId);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [postPendingDelete, setPostPendingDelete] = useState<Post | null>(null);
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
  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [postsQuery.data],
  );

  const membershipError = joinError ?? leaveError;

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

  const handleRefreshPosts = useCallback(() => {
    void postsQuery.refetch();
  }, [postsQuery]);

  const handleCreatePost = useCallback(() => {
    if (!community) {
      return;
    }
    navigation.navigate('CreatePost', {
      communityId,
      communityName: community.name,
    });
  }, [community, communityId, navigation]);

  const handleRetryMembership = useCallback(() => {
    if (!community) {
      return;
    }
    if (community.isJoined) {
      retryLeave();
    } else {
      retryJoin();
    }
  }, [community, retryJoin, retryLeave]);

  const handleEditPost = useCallback(
    (post: Post) => {
      if (!community) {
        return;
      }
      navigation.navigate('CreatePost', {
        communityId,
        communityName: community.name,
        postId: post.id,
      });
    },
    [community, communityId, navigation],
  );

  const handleDeletePost = useCallback((post: Post) => {
    setPostPendingDelete(post);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setPostPendingDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!postPendingDelete) {
      return;
    }
    setDeletingPostId(postPendingDelete.id);
    setPostPendingDelete(null);
  }, [postPendingDelete]);

  const handleDeleteAnimationComplete = useCallback(
    (postId: string) => {
      deletePost.mutate(postId, {
        onSuccess: () => trackEvent('post_delete', { communityId, postId }),
        onSettled: () => setDeletingPostId(null),
      });
    },
    [communityId, deletePost],
  );

  const handleLoadMorePosts = useCallback(() => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      void postsQuery.fetchNextPage();
    }
  }, [postsQuery]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <View style={styles.postItem}>
        <AnimatedPostCard
          post={item}
          isDeleting={deletingPostId === item.id}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onDeleteAnimationComplete={handleDeleteAnimationComplete}
        />
      </View>
    ),
    [
      deletingPostId,
      handleDeleteAnimationComplete,
      handleDeletePost,
      handleEditPost,
      styles.postItem,
    ],
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
      <CommunityPostsListHeader
        community={community}
        isWide={isWide}
        isJoining={isJoining}
        isLeaving={isLeaving}
        membershipError={membershipError}
        onToggleMembership={handleToggleMembership}
        onCreatePost={handleCreatePost}
        onRetryMembership={handleRetryMembership}
        onRefreshPosts={handleRefreshPosts}
      />
    );
  }, [
    community,
    handleCreatePost,
    handleRefreshPosts,
    handleRetryMembership,
    handleToggleMembership,
    isJoining,
    isLeaving,
    isWide,
    membershipError,
  ]);

  const listFooter = useMemo(() => {
    if (postsQuery.isFetchingNextPage) {
      return <LoadingView message="Loading more posts..." />;
    }

    return null;
  }, [postsQuery.isFetchingNextPage]);

  const listEmpty = useMemo(
    () => (
      <CommunityPostsEmptyState
        isLoading={postsQuery.isLoading}
        isError={postsQuery.isError}
        isOnline={isOnline}
        errorMessage={
          postsQuery.error instanceof Error ? postsQuery.error.message : undefined
        }
        onRetry={() => void postsQuery.refetch()}
      />
    ),
    [isOnline, postsQuery],
  );

  if (communityQuery.isLoading && !community) {
    return (
      <View style={styles.container}>
        <CommunityDetailSkeleton />
      </View>
    );
  }

  if (communityQuery.isError && !community) {
    return (
      <ErrorView
        message={
          !isOnline
            ? 'You are offline and this community is not cached yet. Open it once while online.'
            : communityQuery.error instanceof Error
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
        <OfflineSyncBanner
          isOnline={isOnline}
          pendingActions={pendingCount}
          isSyncing={isSyncing}
          syncError={syncError}
          onRetrySync={retrySync}
        />

        <ConfirmDialog
          visible={postPendingDelete !== null}
          title="Delete post?"
          message="This will permanently remove your post from this device."
          detail={postPendingDelete?.title}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        <FlashList
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={renderSeparator}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          onEndReached={handleLoadMorePosts}
          onEndReachedThreshold={0.4}
          contentContainerStyle={[
            styles.listContent,
            posts.length === 0 && styles.listContentEmpty,
            contentContainerStyle,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={postsQuery.isRefetching}
              onRefresh={handleRefreshPosts}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ErrorBoundary>
  );
}
