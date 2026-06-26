import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { useOfflineQueueStore } from '../../../store/offlineQueueStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { QUERY_KEYS } from '../../../utils/constants';
import type { CreatePostPayload, Post } from '../../../types/post';

export function useInfiniteCommunityPosts(communityId: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.communityPosts(communityId),
    queryFn: ({ pageParam }) => postsApi.getPostsPage(communityId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePostDraft(communityId: string) {
  return useQuery({
    queryKey: ['postDraft', communityId],
    queryFn: () => postsApi.getDraft(communityId),
    staleTime: Infinity,
  });
}

export function useCreatePost(communityId: string) {
  const queryClient = useQueryClient();
  const userName = useAuthStore((state) => state.session?.user.name ?? 'Anonymous');
  const { isOnline } = useNetworkStatus();
  const enqueue = useOfflineQueueStore((state) => state.enqueue);

  return useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const post = await postsApi.createPost(payload, userName);

      if (!isOnline) {
        await enqueue('create_post', communityId, {
          postId: post.id,
          title: post.title,
          body: post.body,
          authorName: userName,
        });
      }

      return post;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.communityPosts(communityId),
      });

      const previous = queryClient.getQueryData<{
        pages: Array<{ data: Post[] }>;
        pageParams: number[];
      }>(QUERY_KEYS.communityPosts(communityId));

      const optimisticPost: Post = {
        id: `optimistic_${Date.now()}`,
        communityId,
        title: payload.title.trim(),
        body: payload.body.trim(),
        authorName: userName,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData<{
        pages: Array<{ data: Post[]; page: number; hasMore: boolean }>;
        pageParams: number[];
      }>(QUERY_KEYS.communityPosts(communityId), (current) => {
        if (!current?.pages.length) {
          return {
            pages: [{ data: [optimisticPost], page: 1, hasMore: false }],
            pageParams: [1],
          };
        }

        const [firstPage, ...rest] = current.pages;
        return {
          ...current,
          pages: [{ ...firstPage, data: [optimisticPost, ...firstPage.data] }, ...rest],
        };
      });

      return { previous, optimisticId: optimisticPost.id };
    },
    onSuccess: (createdPost, _payload, context) => {
      queryClient.setQueryData<{
        pages: Array<{ data: Post[]; page: number; hasMore: boolean }>;
        pageParams: number[];
      }>(QUERY_KEYS.communityPosts(communityId), (current) => {
        if (!current?.pages.length) {
          return current;
        }

        const [firstPage, ...rest] = current.pages;
        return {
          ...current,
          pages: [
            {
              ...firstPage,
              data: firstPage.data.map((post) =>
                post.id === context?.optimisticId
                  ? { ...createdPost, isOptimistic: false }
                  : post,
              ),
            },
            ...rest,
          ],
        };
      });
      void postsApi.clearDraft(communityId);
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          QUERY_KEYS.communityPosts(communityId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.communityPosts(communityId),
      });
    },
  });
}

export function useSavePostDraft(communityId: string) {
  return useMutation({
    mutationFn: (draft: { title: string; body: string }) =>
      postsApi.saveDraft({
        communityId,
        title: draft.title,
        body: draft.body,
        updatedAt: new Date().toISOString(),
      }),
  });
}
