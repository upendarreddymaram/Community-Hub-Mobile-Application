import { DISCOURSE_BASE_URL, USER_AGENT } from '@env';

const DEFAULT_DISCOURSE_BASE_URL = 'https://meta.discourse.org';
const DEFAULT_USER_AGENT = 'CommunityHubApp/1.0 (React Native Assignment)';

export const ENV = {
  DISCOURSE_BASE_URL: DISCOURSE_BASE_URL?.trim() || DEFAULT_DISCOURSE_BASE_URL,
  USER_AGENT: USER_AGENT?.trim() || DEFAULT_USER_AGENT,
} as const;
