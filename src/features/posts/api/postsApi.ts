import type {
  CreatePostPayload,
  Post,
  PostDraft,
  PostsPageResponse,
  UpdatePostPayload,
} from '../../../types/post';
import { ApiError } from '../../../api/client';
import { isLocalPost } from '../../../utils/postHelpers';
import type { CreatePostOfflinePayload, OfflineAction } from '../../../types/navigation';
import { STORAGE_KEYS } from '../../../utils/constants';
import { getJsonItem, removeItem, setJsonItem } from '../../../utils/storage';
import { discourseApi } from '../../../api/discourseApi';
import { logApiInfo } from '../../../utils/apiLogger';

const LOCAL_POSTS_KEY = '@community_hub/local_posts';

async function getLocalPostsMap(): Promise<Record<string, Post[]>> {
  return (await getJsonItem<Record<string, Post[]>>(LOCAL_POSTS_KEY)) ?? {};
}

async function saveLocalPostsMap(map: Record<string, Post[]>): Promise<void> {
  await setJsonItem(LOCAL_POSTS_KEY, map);
}

async function getLocalPosts(communityId: string): Promise<Post[]> {
  const map = await getLocalPostsMap();
  return map[communityId] ?? [];
}

async function setLocalPosts(communityId: string, posts: Post[]): Promise<void> {
  const map = await getLocalPostsMap();
  map[communityId] = posts;
  await saveLocalPostsMap(map);
}

function draftKey(communityId: string): string {
  return `${STORAGE_KEYS.POST_DRAFT_PREFIX}${communityId}`;
}

function mergePosts(livePosts: Post[], localPosts: Post[]): Post[] {
  const liveIds = new Set(livePosts.map((post) => post.id));
  const uniqueLocal = localPosts.filter((post) => !liveIds.has(post.id));

  return [...uniqueLocal, ...livePosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const postsApi = {
  getPostsPage: async (communityId: string, page: number): Promise<PostsPageResponse> => {
    try {
      const livePage = await discourseApi.getTopicsPage(communityId, page);

      if (page === 1) {
        const localPosts = await getLocalPosts(communityId);
        const merged = mergePosts(livePage.data, localPosts);

        logApiInfo('Posts page merged for community', {
          communityId,
          page,
          liveCount: livePage.data.length,
          localCount: localPosts.length,
          totalCount: merged.length,
          hasMore: livePage.hasMore,
        });

        return {
          ...livePage,
          data: merged,
        };
      }

      logApiInfo('Posts page loaded for community', {
        communityId,
        page,
        liveCount: livePage.data.length,
        hasMore: livePage.hasMore,
      });

      return livePage;
    } catch (error) {
      const localPosts = await getLocalPosts(communityId);

      if (page === 1 && localPosts.length > 0) {
        logApiInfo('Posts page served from local storage while offline', {
          communityId,
          page,
          localCount: localPosts.length,
        });

        return {
          data: localPosts,
          page: 1,
          hasMore: false,
        };
      }

      throw error;
    }
  },

  createPostLocal: async (
    payload: CreatePostPayload,
    authorName: string,
    postId?: string,
  ): Promise<Post> => {
    const post: Post = {
      id: postId ?? `local_${Date.now()}`,
      communityId: payload.communityId,
      title: payload.title.trim(),
      body: payload.body.trim(),
      authorName,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };

    const existing = await getLocalPosts(payload.communityId);
    await setLocalPosts(payload.communityId, [post, ...existing]);
    await removeItem(draftKey(payload.communityId));

    return post;
  },

  createPost: async (payload: CreatePostPayload, authorName: string): Promise<Post> => {
    return postsApi.createPostLocal(payload, authorName);
  },

  getLocalPostById: async (communityId: string, postId: string): Promise<Post> => {
    const posts = await getLocalPosts(communityId);
    const post = posts.find((item) => item.id === postId);

    if (!post || !isLocalPost(post)) {
      throw new ApiError('Post not found or cannot be edited', 404);
    }

    return post;
  },

  updatePost: async (payload: UpdatePostPayload): Promise<Post> => {
    const existing = await getLocalPosts(payload.communityId);
    const index = existing.findIndex((item) => item.id === payload.postId);

    if (index === -1 || !isLocalPost(existing[index]!)) {
      throw new ApiError('Post not found or cannot be edited', 404);
    }

    const updated: Post = {
      ...existing[index]!,
      title: payload.title.trim(),
      body: payload.body.trim(),
      updatedAt: new Date().toISOString(),
      isLocal: true,
    };

    const next = [...existing];
    next[index] = updated;
    await setLocalPosts(payload.communityId, next);

    return updated;
  },

  deletePost: async (communityId: string, postId: string): Promise<void> => {
    const existing = await getLocalPosts(communityId);
    const post = existing.find((item) => item.id === postId);

    if (!post || !isLocalPost(post)) {
      throw new ApiError('Post not found or cannot be deleted', 404);
    }

    await setLocalPosts(
      communityId,
      existing.filter((item) => item.id !== postId),
    );
  },

  syncQueuedPost: async (action: OfflineAction): Promise<void> => {
    const payload = action.payload as CreatePostOfflinePayload | undefined;
    if (!payload) {
      throw new Error('Missing post payload for queued create action');
    }

    const existing = await getLocalPosts(action.communityId);
    const alreadySaved = existing.some((post) => post.id === payload.postId);
    if (alreadySaved) {
      return;
    }

    await postsApi.createPostLocal(
      {
        communityId: action.communityId,
        title: payload.title,
        body: payload.body,
      },
      payload.authorName,
      payload.postId,
    );
  },

  saveDraft: async (draft: PostDraft): Promise<void> => {
    await setJsonItem(draftKey(draft.communityId), draft);
  },

  getDraft: async (communityId: string): Promise<PostDraft | null> => {
    return getJsonItem<PostDraft>(draftKey(communityId));
  },

  clearDraft: async (communityId: string): Promise<void> => {
    await removeItem(draftKey(communityId));
  },

  addOptimisticPost: async (post: Post): Promise<void> => {
    const existing = await getLocalPosts(post.communityId);
    await setLocalPosts(post.communityId, [post, ...existing]);
  },

  removePost: async (communityId: string, postId: string): Promise<void> => {
    const existing = await getLocalPosts(communityId);
    await setLocalPosts(
      communityId,
      existing.filter((post) => post.id !== postId),
    );
  },

  replacePost: async (
    communityId: string,
    oldId: string,
    newPost: Post,
  ): Promise<void> => {
    const existing = await getLocalPosts(communityId);
    await setLocalPosts(
      communityId,
      existing.map((post) => (post.id === oldId ? newPost : post)),
    );
  },
};
