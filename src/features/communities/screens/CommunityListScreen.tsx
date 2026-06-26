import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CommunityCard,
  SearchFilterBar,
} from '../components/CommunityCard';
import {
  EmptyView,
  ErrorView,
  LoadingView,
  OfflineBanner,
  UserAvatar,
} from '../../../components/common';
import { useCommunities } from '../hooks/useCommunities';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { useOfflineQueueStore } from '../../../store/offlineQueueStore';
import type { Community, CommunitySortOption } from '../../../types/community';
import type { MainStackParamList } from '../../../types/navigation';
import { useTheme } from '../../../providers/ThemeProvider';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'CommunityList'>;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    titleBlock: {
      flex: 1,
      marginRight: spacing.md,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    listContent: {
      paddingTop: spacing.xs,
    },
    emptyList: {
      flexGrow: 1,
      paddingTop: spacing.xs,
    },
    footerText: {
      textAlign: 'center',
      color: colors.textSecondary,
      paddingVertical: spacing.lg,
      ...typography.caption,
    },
  });
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function CommunityListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const userName = useAuthStore((state) => state.session?.user.name ?? 'Guest');
  const { isOnline } = useNetworkStatus();
  const pendingCount = useOfflineQueueStore((state) => state.queue.length);
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CommunitySortOption>('members');
  const [joinedOnly, setJoinedOnly] = useState(false);

  const filters = useMemo(
    () => ({ search, sort, joinedOnly }),
    [search, sort, joinedOnly],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunities(filters);

  const communities = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const listBottomPadding = insets.bottom + spacing.lg;

  const handleCommunityPress = useCallback(
    (community: Community) => {
      navigation.navigate('CommunityDetail', { communityId: community.id });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityCard community={item} onPress={handleCommunityPress} />
    ),
    [handleCommunityPress],
  );

  const keyExtractor = useCallback((item: Community) => item.id, []);

  const listHeader = useMemo(
    () => (
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        joinedOnly={joinedOnly}
        onToggleJoined={() => setJoinedOnly((value) => !value)}
      />
    ),
    [search, sort, joinedOnly],
  );

  if (isLoading && !data) {
    return <LoadingView message="Loading communities..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!isOnline ? <OfflineBanner pendingActions={pendingCount} /> : null}

      <View style={styles.topBar}>
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Communities</Text>
          <Text style={styles.screenSubtitle}>Hi, {getFirstName(userName)}</Text>
        </View>
        <UserAvatar
          name={userName}
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      {isError && !data ? (
        <ErrorView
          message={error instanceof Error ? error.message : 'Failed to load communities'}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={communities}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[
            communities.length === 0 ? styles.emptyList : styles.listContent,
            { paddingBottom: listBottomPadding },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyView
              title="No communities found"
              message="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch('');
                setJoinedOnly(false);
              }}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text style={styles.footerText}>Loading more...</Text>
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      )}
    </SafeAreaView>
  );
}

