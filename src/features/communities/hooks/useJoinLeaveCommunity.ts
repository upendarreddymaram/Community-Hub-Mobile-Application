import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesApi } from '../api/communitiesApi';
import { useOfflineQueueStore } from '../../../store/offlineQueueStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { QUERY_KEYS } from '../../../utils/constants';
import type { Community } from '../../../types/community';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { queue, dequeue, isHydrated } = useOfflineQueueStore();

  const syncMutation = useMutation({
    mutationFn: async () => {
      for (const action of queue) {
        if (action.type === 'join') {
          await communitiesApi.joinCommunity(action.communityId);
        } else {
          await communitiesApi.leaveCommunity(action.communityId);
        }
        await dequeue(action.id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      void queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });

  useEffect(() => {
    if (isOnline && isHydrated && queue.length > 0 && !syncMutation.isPending) {
      syncMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, isHydrated, queue.length]);

  return { pendingCount: queue.length, isSyncing: syncMutation.isPending };
}

export function useJoinLeaveCommunity(communityId: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const enqueue = useOfflineQueueStore((state) => state.enqueue);

  const updateCaches = (updater: (community: Community) => Community) => {
    queryClient.setQueryData<Community>(
      QUERY_KEYS.communityDetail(communityId),
      (current) => (current ? updater(current) : current),
    );

    queryClient.setQueriesData<{ pages: Array<{ data: Community[] }> }>(
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

  const joinMutation = useMutation({
    mutationFn: () => communitiesApi.joinCommunity(communityId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.communityDetail(communityId),
      });
      const previous = queryClient.getQueryData<Community>(
        QUERY_KEYS.communityDetail(communityId),
      );

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
        queryClient.setQueryData(
          QUERY_KEYS.communityDetail(communityId),
          context.previous,
        );
      }
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
    mutationFn: () => communitiesApi.leaveCommunity(communityId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.communityDetail(communityId),
      });
      const previous = queryClient.getQueryData<Community>(
        QUERY_KEYS.communityDetail(communityId),
      );

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
        queryClient.setQueryData(
          QUERY_KEYS.communityDetail(communityId),
          context.previous,
        );
      }
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
    joinError: joinMutation.error,
    leaveError: leaveMutation.error,
    retryJoin: joinMutation.mutate,
    retryLeave: leaveMutation.mutate,
  };
}
