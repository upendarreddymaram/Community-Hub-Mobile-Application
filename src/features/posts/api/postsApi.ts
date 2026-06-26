import type { CreatePostPayload, Post, PostDraft } from '../../../types/post';
import { STORAGE_KEYS } from '../../../utils/constants';
import { getJsonItem, removeItem, setJsonItem } from '../../../utils/storage';
import { ApiError } from '../../../api/client';
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
  getPosts: async (communityId: string): Promise<Post[]> => {
    const [livePosts, localPosts] = await Promise.all([
      discourseApi.getTopicsForCommunity(communityId),
      getLocalPosts(communityId),
    ]);

    const merged = mergePosts(livePosts, localPosts);

    logApiInfo('Posts merged for community', {
      communityId,
      liveCount: livePosts.length,
      localCount: localPosts.length,
      totalCount: merged.length,
    });

    return merged;
  },

  createPost: async (payload: CreatePostPayload, authorName: string): Promise<Post> => {
    await discourseApi.getCategoryById(payload.communityId);

    const post: Post = {
      id: `local_${Date.now()}`,
      communityId: payload.communityId,
      title: payload.title.trim(),
      body: payload.body.trim(),
      authorName,
      createdAt: new Date().toISOString(),
    };

    const existing = await getLocalPosts(payload.communityId);
    await setLocalPosts(payload.communityId, [post, ...existing]);
    await removeItem(draftKey(payload.communityId));

    return post;
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

  validateCommunityExists: async (communityId: string): Promise<void> => {
    try {
      await discourseApi.getCategoryById(communityId);
    } catch {
      throw new ApiError('Community not found', 404);
    }
  },
};
