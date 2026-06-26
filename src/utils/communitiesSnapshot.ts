import type {
  CommunitiesResponse,
  Community,
  CommunityFilters,
} from '../types/community';
import { API_CONFIG } from './constants';
import { sortCommunities } from './communitySort';
import { getJsonItem, setJsonItem } from './storage';

const SNAPSHOT_KEY = '@community_hub/communities_snapshot';

interface CommunitiesSnapshot {
  savedAt: string;
  communities: Community[];
}

function applyCommunityFilters(
  communities: Community[],
  filters: CommunityFilters,
): Community[] {
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

export async function saveCommunitiesSnapshot(communities: Community[]): Promise<void> {
  const snapshot: CommunitiesSnapshot = {
    savedAt: new Date().toISOString(),
    communities,
  };
  await setJsonItem(SNAPSHOT_KEY, snapshot);
}

export async function loadCommunitiesSnapshot(): Promise<Community[] | null> {
  const snapshot = await getJsonItem<CommunitiesSnapshot>(SNAPSHOT_KEY);
  return snapshot?.communities?.length ? snapshot.communities : null;
}

export function buildCommunitiesPageFromList(
  communities: Community[],
  page: number,
  filters: CommunityFilters,
  joinedIds: Set<string>,
): CommunitiesResponse {
  const withJoined = communities.map((community) => ({
    ...community,
    isJoined: joinedIds.has(community.id),
  }));
  const filtered = applyCommunityFilters(withJoined, filters);
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / API_CONFIG.DEFAULT_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * API_CONFIG.DEFAULT_PAGE_SIZE;

  return {
    data: filtered.slice(start, start + API_CONFIG.DEFAULT_PAGE_SIZE),
    page: safePage,
    totalPages,
    totalCount,
  };
}

export async function getCommunitiesPageFromSnapshot(
  page: number,
  filters: CommunityFilters,
  joinedIds: Set<string>,
): Promise<CommunitiesResponse | null> {
  const communities = await loadCommunitiesSnapshot();
  if (!communities) {
    return null;
  }

  return buildCommunitiesPageFromList(communities, page, filters, joinedIds);
}

export async function getCommunityFromSnapshot(
  id: string,
  joinedIds: Set<string>,
): Promise<Community | null> {
  const communities = await loadCommunitiesSnapshot();
  const community = communities?.find((item) => item.id === id);
  if (!community) {
    return null;
  }

  return {
    ...community,
    isJoined: joinedIds.has(id),
  };
}
