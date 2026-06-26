import type {
  Community,
  CommunitiesResponse,
  CommunityFilters,
} from '../types/community';
import type { Post, PostsPageResponse } from '../types/post';
import { API_CONFIG } from '../utils/constants';
import { sortCommunities } from '../utils/communitySort';
import { stripHtml } from '../utils/html';
import { saveCommunitiesSnapshot } from '../utils/communitiesSnapshot';
import { logApiInfo } from '../utils/apiLogger';
import { ApiError, apiRequest } from './client';
import type {
  DiscourseCategory,
  DiscourseCategoryTopicsResponse,
  DiscourseSiteResponse,
  DiscourseTopic,
} from './discourseTypes';

const CATEGORY_CACHE_TTL_MS = 1000 * 60 * 5;

let cachedCategories: DiscourseCategory[] | null = null;
let categoriesCachedAt = 0;

/** Clears in-memory category cache — for tests only. */
export function resetDiscourseCategoryCache(): void {
  cachedCategories = null;
  categoriesCachedAt = 0;
}

async function fetchCategories(): Promise<DiscourseCategory[]> {
  const now = Date.now();
  if (cachedCategories && now - categoriesCachedAt < CATEGORY_CACHE_TTL_MS) {
    logApiInfo('Using cached categories', { count: cachedCategories.length });
    return cachedCategories;
  }

  logApiInfo('Fetching fresh categories from Discourse /site.json');

  const response = await apiRequest<DiscourseSiteResponse>(
    `${API_CONFIG.DISCOURSE_BASE_URL}/site.json`,
  );

  cachedCategories = response.categories.filter(
    (category) => !category.read_restricted && category.topic_count > 0,
  );
  categoriesCachedAt = now;
  logApiInfo('Categories loaded', {
    total: response.categories.length,
    usable: cachedCategories.length,
  });
  return cachedCategories;
}

function getCategoryLabel(
  category: DiscourseCategory,
  categoriesById: Map<number, DiscourseCategory>,
): string {
  if (category.parent_category_id) {
    const parent = categoriesById.get(category.parent_category_id);
    if (parent) {
      return parent.name;
    }
  }
  return 'Community';
}

function estimateCreatedAt(category: DiscourseCategory): string {
  const base = new Date('2018-01-01T00:00:00.000Z').getTime();
  return new Date(base + category.id * 86400000 * 7).toISOString();
}

export function mapDiscourseCategory(
  category: DiscourseCategory,
  categoriesById: Map<number, DiscourseCategory>,
  isJoined: boolean,
): Community {
  return {
    id: String(category.id),
    slug: category.slug,
    name: category.name,
    description:
      category.description_text?.trim() ||
      category.description_excerpt?.trim() ||
      'Join the discussion in this community.',
    memberCount: Math.max(category.post_count, category.topic_count * 12),
    postCount: category.topic_count,
    category: getCategoryLabel(category, categoriesById),
    createdAt: estimateCreatedAt(category),
    isJoined,
  };
}

function applyCommunityFilters(
  communities: Community[],
  filters: CommunityFilters,
): Community[] {
  // Client-side filter/sort after a single /site.json fetch — fine for ~45 categories.
  // At larger scale, push search/sort to the API or index categories server-side.
  let result = communities;

  if (filters.search.trim()) {
    const query = filters.search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }

  if (filters.joinedOnly) {
    result = result.filter((item) => item.isJoined);
  }

  return sortCommunities(result, filters.sort);
}

function resolveTopicAuthor(
  topic: DiscourseTopic,
  users: DiscourseCategoryTopicsResponse['users'],
): string {
  if (topic.last_poster_username) {
    return topic.last_poster_username;
  }

  const posterId = topic.posters?.[0]?.user_id;
  const user = users.find((item) => item.id === posterId);
  return user?.name || user?.username || 'Community member';
}

export function mapDiscourseTopic(
  topic: DiscourseTopic,
  communityId: string,
  users: DiscourseCategoryTopicsResponse['users'],
): Post {
  const body = topic.excerpt ? stripHtml(topic.excerpt) : '';

  return {
    id: String(topic.id),
    communityId,
    title: topic.title,
    body: body || 'Open this topic on Discourse to read the full discussion.',
    authorName: resolveTopicAuthor(topic, users),
    createdAt: topic.created_at,
  };
}

export const discourseApi = {
  getCategories: fetchCategories,

  getCommunitiesPage: async (
    page: number,
    filters: CommunityFilters,
    joinedIds: Set<string>,
  ): Promise<CommunitiesResponse> => {
    const categories = await fetchCategories();
    const categoriesById = new Map(categories.map((item) => [item.id, item]));
    const all = categories.map((item) =>
      mapDiscourseCategory(item, categoriesById, joinedIds.has(String(item.id))),
    );

    if (page === 1) {
      await saveCommunitiesSnapshot(all);
    }

    const filtered = applyCommunityFilters(all, filters);
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / API_CONFIG.DEFAULT_PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * API_CONFIG.DEFAULT_PAGE_SIZE;
    const pageData = filtered.slice(start, start + API_CONFIG.DEFAULT_PAGE_SIZE);

    logApiInfo('Communities page mapped', {
      page: safePage,
      totalPages,
      totalCount,
      returned: pageData.length,
      filters,
    });

    return {
      data: pageData,
      page: safePage,
      totalPages,
      totalCount,
    };
  },

  getCommunityById: async (id: string, joinedIds: Set<string>): Promise<Community> => {
    const categories = await fetchCategories();
    const categoriesById = new Map(categories.map((item) => [item.id, item]));
    const category = categories.find((item) => String(item.id) === id);

    if (!category) {
      throw new ApiError('Community not found', 404);
    }

    try {
      const live = await apiRequest<DiscourseCategoryTopicsResponse>(
        `${API_CONFIG.DISCOURSE_BASE_URL}/c/${category.slug}/${category.id}.json`,
      );
      if (live.category) {
        return mapDiscourseCategory(live.category, categoriesById, joinedIds.has(id));
      }
    } catch {
      // Fall back to cached category metadata when live refresh fails.
    }

    return mapDiscourseCategory(category, categoriesById, joinedIds.has(id));
  },

  getCategoryById: async (id: string): Promise<DiscourseCategory> => {
    const categories = await fetchCategories();
    const category = categories.find((item) => String(item.id) === id);
    if (!category) {
      throw new ApiError('Community not found', 404);
    }
    return category;
  },

  getTopicsForCommunity: async (communityId: string): Promise<Post[]> => {
    const page = await discourseApi.getTopicsPage(communityId, 1);
    return page.data;
  },

  getTopicsPage: async (
    communityId: string,
    page: number,
  ): Promise<PostsPageResponse> => {
    const category = await discourseApi.getCategoryById(communityId);
    const response = await apiRequest<DiscourseCategoryTopicsResponse>(
      `${API_CONFIG.DISCOURSE_BASE_URL}/c/${category.slug}/${category.id}.json?page=${page}`,
    );

    const posts = response.topic_list.topics
      .filter((topic) => !topic.pinned)
      .map((topic) => mapDiscourseTopic(topic, communityId, response.users))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const hasMore = Boolean(response.topic_list.more_topics_url);

    logApiInfo('Posts page mapped for community', {
      communityId,
      slug: category.slug,
      page,
      livePostCount: posts.length,
      hasMore,
    });

    return {
      data: posts,
      page,
      hasMore,
    };
  },
};
