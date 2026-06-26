import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { useAuthStore } from '../../../features/auth/store/authStore';
import { QUERY_KEYS } from '../../../utils/constants';
import type { CreatePostPayload, Post } from '../../../types/post';

export function useCommunityPosts(communityId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.communityPosts(communityId),
    queryFn: () => postsApi.getPosts(communityId),
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

  return useMutation({
    mutationFn: (payload: CreatePostPayload) => postsApi.createPost(payload, userName),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.communityPosts(communityId),
      });

      const previous = queryClient.getQueryData<Post[]>(
        QUERY_KEYS.communityPosts(communityId),
      );

      const optimisticPost: Post = {
        id: `optimistic_${Date.now()}`,
        communityId,
        title: payload.title.trim(),
        body: payload.body.trim(),
        authorName: userName,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData<Post[]>(
        QUERY_KEYS.communityPosts(communityId),
        (current) => [optimisticPost, ...(current ?? [])],
      );

      return { previous, optimisticId: optimisticPost.id };
    },
    onSuccess: (createdPost, _payload, context) => {
      queryClient.setQueryData<Post[]>(
        QUERY_KEYS.communityPosts(communityId),
        (current) =>
          (current ?? []).map((post) =>
            post.id === context?.optimisticId
              ? { ...createdPost, isOptimistic: false }
              : post,
          ),
      );
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
