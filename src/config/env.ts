/**
 * Runtime config. Override these values here for local/dev builds.
 * See `.env.example` for documented variable names (RN does not load .env at runtime).
 */
export const ENV = {
  DISCOURSE_BASE_URL: 'https://meta.discourse.org',
  USER_AGENT: 'CommunityHubApp/1.0 (React Native Assignment)',
} as const;
