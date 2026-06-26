export const STORAGE_KEYS = {
  AUTH_SESSION: '@community_hub/auth_session',
  AUTH_TOKEN: 'auth_token',
  POST_DRAFT_PREFIX: '@community_hub/post_draft_',
  JOINED_COMMUNITIES: '@community_hub/joined_communities',
  OFFLINE_QUEUE: '@community_hub/offline_queue',
} as const;

export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  SIMULATED_DELAY_MS: 600,
  REQUEST_TIMEOUT_MS: 15000,
  DISCOURSE_BASE_URL: 'https://meta.discourse.org',
  USER_AGENT: 'CommunityHubApp/1.0 (React Native Assignment)',
} as const;

export const QUERY_KEYS = {
  communities: (filters: string) => ['communities', filters] as const,
  communityDetail: (id: string) => ['community', id] as const,
  communityPosts: (id: string) => ['community', id, 'posts'] as const,
} as const;
