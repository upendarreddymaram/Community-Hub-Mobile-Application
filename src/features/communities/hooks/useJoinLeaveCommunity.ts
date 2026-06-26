import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesApi } from '../api/communitiesApi';
import { useOfflineQueueStore } from '../../../store/offlineQueueStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { QUERY_KEYS } from '../../../utils/constants';
import type { Community } from '../../../types/community';
import { ApiError } from '../../../api/client';
import { trackEvent } from '../../../utils/analytics';

type CommunitiesListCache = {
  pages: Array<{ data: Community[] }>;
  pageParams: unknown[];
};

type JoinLeaveCacheSnapshot = {
  detail: Community | undefined;
  lists: Array<[queryKey: readonly unknown[], data: CommunitiesListCache | undefined]>;
};

export function useJoinLeaveCommunity(communityId: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const enqueue = useOfflineQueueStore((state) => state.enqueue);

  const updateCaches = (updater: (community: Community) => Community) => {
    queryClient.setQueryData<Community>(
      QUERY_KEYS.communityDetail(communityId),
      (current) => (current ? updater(current) : current),
    );

    queryClient.setQueriesData<CommunitiesListCache>(
      { queryKey: ['communities'] },
      (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((item) =>
              item.id === communityId ? updater(item) : item,
            ),
          })),
        };
      },
    );
  };

  const captureCaches = (): JoinLeaveCacheSnapshot => ({
    detail: queryClient.getQueryData<Community>(QUERY_KEYS.communityDetail(communityId)),
    lists: queryClient.getQueriesData<CommunitiesListCache>({
      queryKey: ['communities'],
    }),
  });

  const restoreCaches = (snapshot: JoinLeaveCacheSnapshot) => {
    queryClient.setQueryData(QUERY_KEYS.communityDetail(communityId), snapshot.detail);
    for (const [queryKey, data] of snapshot.lists) {
      queryClient.setQueryData(queryKey, data);
    }
  };

  const resolveOfflineCommunity = (): Community => {
    const detail = queryClient.getQueryData<Community>(
      QUERY_KEYS.communityDetail(communityId),
    );
    if (detail) {
      return detail;
    }

    const listQueries = queryClient.getQueriesData<CommunitiesListCache>({
      queryKey: ['communities'],
    });
    for (const [, data] of listQueries) {
      const match = data?.pages
        .flatMap((page) => page.data)
        .find((item) => item.id === communityId);
      if (match) {
        return match;
      }
    }

    throw new ApiError(
      'Community not available offline. Open it once while online.',
      503,
    );
  };

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        const community = resolveOfflineCommunity();
        return {
          ...community,
          isJoined: true,
          memberCount: community.memberCount + 1,
        };
      }
      return communitiesApi.joinCommunity(communityId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.communityDetail(communityId),
      });
      const previous = captureCaches();

      updateCaches((community) => ({
        ...community,
        isJoined: true,
        memberCount: community.memberCount + 1,
      }));

      if (!isOnline) {
        await enqueue('join', communityId);
        await communitiesApi.setJoinedLocally(communityId, true);
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        restoreCaches(context.previous);
      }
    },
    onSuccess: () => {
      trackEvent('community_join', { communityId, offline: !isOnline });
    },
    onSettled: () => {
      if (isOnline) {
        void queryClient.invalidateQueries({ queryKey: ['communities'] });
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.communityDetail(communityId),
        });
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        const community = resolveOfflineCommunity();
        return {
          ...community,
          isJoined: false,
          memberCount: Math.max(0, community.memberCount - 1),
        };
      }
      return communitiesApi.leaveCommunity(communityId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.communityDetail(communityId),
      });
      const previous = captureCaches();

      updateCaches((community) => ({
        ...community,
        isJoined: false,
        memberCount: Math.max(0, community.memberCount - 1),
      }));

      if (!isOnline) {
        await enqueue('leave', communityId);
        await communitiesApi.setJoinedLocally(communityId, false);
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        restoreCaches(context.previous);
      }
    },
    onSuccess: () => {
      trackEvent('community_leave', { communityId, offline: !isOnline });
    },
    onSettled: () => {
      if (isOnline) {
        void queryClient.invalidateQueries({ queryKey: ['communities'] });
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.communityDetail(communityId),
        });
      }
    },
  });

  return {
    join: joinMutation.mutate,
    leave: leaveMutation.mutate,
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
    joinError: isOnline ? joinMutation.error : null,
    leaveError: isOnline ? leaveMutation.error : null,
    retryJoin: joinMutation.mutate,
    retryLeave: leaveMutation.mutate,
  };
}
