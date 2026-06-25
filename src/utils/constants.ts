export const STORAGE_KEYS = {
  AUTH_SESSION: '@community_hub/auth_session',
  POST_DRAFT_PREFIX: '@community_hub/post_draft_',
  JOINED_COMMUNITIES: '@community_hub/joined_communities',
  OFFLINE_QUEUE: '@community_hub/offline_queue',
} as const;

export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  SIMULATED_DELAY_MS: 800,
  SIMULATED_ERROR_RATE: 0.05,
} as const;

export const QUERY_KEYS = {
  communities: (filters: string) => ['communities', filters] as const,
  communityDetail: (id: string) => ['community', id] as const,
  communityPosts: (id: string) => ['community', id, 'posts'] as const,
} as const;
