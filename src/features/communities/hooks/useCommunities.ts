import {
  useInfiniteQuery,
  useQuery,
  keepPreviousData,
  useIsRestoring,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { communitiesApi } from '../api/communitiesApi';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import type { CommunityFilters } from '../../../types/community';
import { QUERY_KEYS } from '../../../utils/constants';

function filtersKey(filters: CommunityFilters): string {
  return JSON.stringify(filters);
}

export function useCommunities(filters: CommunityFilters) {
  const key = useMemo(() => filtersKey(filters), [filters]);
  const { isOnline, isInitialized } = useNetworkStatus();
  const isRestoringCache = useIsRestoring();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.communities(key),
    queryFn: ({ pageParam }) => communitiesApi.getCommunities(pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    enabled: isInitialized && !isRestoringCache,
    meta: { isOfflineQuery: !isOnline },
  });
}

export function useCommunityDetail(communityId: string) {
  const { isInitialized } = useNetworkStatus();
  const isRestoringCache = useIsRestoring();

  return useQuery({
    queryKey: QUERY_KEYS.communityDetail(communityId),
    queryFn: () => communitiesApi.getCommunityById(communityId),
    staleTime: 1000 * 60 * 5,
    enabled: isInitialized && !isRestoringCache,
  });
}
