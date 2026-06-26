import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityCard, SearchFilterBar } from '../components/CommunityCard';
import {
  CommunityListSkeleton,
  EmptyView,
  ErrorView,
  OfflineSyncBanner,
  UserAvatar,
} from '../../../components/common';
import { useCommunities } from '../hooks/useCommunities';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { useAuthStore } from '../../../features/auth/store/authStore';
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
    topBarWide: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 720,
      paddingHorizontal: spacing.xl,
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
  const { contentContainerStyle, isWide } = useResponsiveLayout();
  const userName = useAuthStore((state) => state.session?.user.name ?? 'Guest');
  const { isOnline, isInitialized } = useNetworkStatus();
  const { pendingCount, isSyncing, syncError, retrySync } = useOfflineSync();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [clearSearchToken, setClearSearchToken] = useState(0);
  const [sort, setSort] = useState<CommunitySortOption>('members');
  const [joinedOnly, setJoinedOnly] = useState(false);

  const filters = useMemo(
    () => ({ search: searchQuery, sort, joinedOnly }),
    [searchQuery, sort, joinedOnly],
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

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleToggleJoined = useCallback(() => {
    setJoinedOnly((value) => !value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setJoinedOnly(false);
    setClearSearchToken((token) => token + 1);
  }, []);

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

  const listFooter = useMemo(
    () =>
      isFetchingNextPage ? <Text style={styles.footerText}>Loading more...</Text> : null,
    [isFetchingNextPage, styles.footerText],
  );

  if ((isLoading || !isInitialized) && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.topBar, isWide && styles.topBarWide]}>
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>Communities</Text>
            <Text style={styles.screenSubtitle}>Hi, {getFirstName(userName)}</Text>
          </View>
        </View>
        <CommunityListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineSyncBanner
        isOnline={isOnline}
        pendingActions={pendingCount}
        isSyncing={isSyncing}
        syncError={syncError}
        onRetrySync={retrySync}
      />

      <View style={[styles.topBar, isWide && styles.topBarWide]}>
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle} accessibilityRole="header">
            Communities
          </Text>
          <Text style={styles.screenSubtitle}>Hi, {getFirstName(userName)}</Text>
        </View>
        <UserAvatar name={userName} onPress={() => navigation.navigate('Profile')} />
      </View>

      {isError && !data ? (
        <ErrorView
          message={
            !isOnline
              ? 'You are offline and no cached communities are available yet. Connect once while online to cache the list.'
              : error instanceof Error
                ? error.message
                : 'Failed to load communities'
          }
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <View style={contentContainerStyle}>
            <SearchFilterBar
              key={clearSearchToken}
              onDebouncedSearchChange={handleDebouncedSearchChange}
              sort={sort}
              onSortChange={setSort}
              joinedOnly={joinedOnly}
              onToggleJoined={handleToggleJoined}
            />
          </View>

          <FlashList
            data={communities}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              communities.length === 0 ? styles.emptyList : styles.listContent,
              { paddingBottom: listBottomPadding },
              contentContainerStyle,
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
                onAction={handleClearFilters}
              />
            }
            ListFooterComponent={listFooter}
          />
        </>
      )}
    </SafeAreaView>
  );
}
