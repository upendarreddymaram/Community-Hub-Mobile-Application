import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesApi } from '../features/communities/api/communitiesApi';
import { postsApi } from '../features/posts/api/postsApi';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { isOnline, isInitialized } = useNetworkStatus();
  const { queue, dequeue, isHydrated } = useOfflineQueueStore();

  const syncMutation = useMutation({
    mutationFn: async () => {
      for (const action of queue) {
        if (action.type === 'join') {
          await communitiesApi.joinCommunity(action.communityId);
        } else if (action.type === 'leave') {
          await communitiesApi.leaveCommunity(action.communityId);
        } else {
          await postsApi.syncQueuedPost(action);
        }
        await dequeue(action.id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      void queryClient.invalidateQueries({ queryKey: ['community'] });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'community' &&
          query.queryKey[2] === 'posts',
      });
    },
  });

  const { mutate: syncQueue, isPending: isSyncing } = syncMutation;

  useEffect(() => {
    if (isOnline && isInitialized && isHydrated && queue.length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline, isInitialized, isHydrated, isSyncing, queue.length, syncQueue]);

  const syncError =
    syncMutation.error instanceof Error
      ? syncMutation.error.message
      : syncMutation.isError
        ? 'Failed to sync offline actions'
        : null;

  return {
    pendingCount: queue.length,
    isSyncing,
    syncError,
    retrySync: syncQueue,
  };
}
