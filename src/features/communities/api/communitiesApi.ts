import type {
  CommunitiesResponse,
  Community,
  CommunityFilters,
} from '../../../types/community';
import { ApiError } from '../../../api/client';
import { discourseApi } from '../../../api/discourseApi';
import {
  getCommunitiesPageFromSnapshot,
  getCommunityFromSnapshot,
} from '../../../utils/communitiesSnapshot';
import {
  ensureJoinedCommunitiesHydrated,
  useJoinedCommunitiesStore,
} from '../store/joinedCommunitiesStore';

export const communitiesApi = {
  getCommunities: async (
    page: number,
    filters: CommunityFilters,
  ): Promise<CommunitiesResponse> => {
    const joinedIds = await ensureJoinedCommunitiesHydrated();

    try {
      return await discourseApi.getCommunitiesPage(page, filters, joinedIds);
    } catch (error) {
      const snapshotPage = await getCommunitiesPageFromSnapshot(page, filters, joinedIds);
      if (snapshotPage) {
        return snapshotPage;
      }
      throw error;
    }
  },

  getCommunityById: async (id: string): Promise<Community> => {
    const joinedIds = await ensureJoinedCommunitiesHydrated();

    try {
      return await discourseApi.getCommunityById(id, joinedIds);
    } catch (error) {
      const snapshotCommunity = await getCommunityFromSnapshot(id, joinedIds);
      if (snapshotCommunity) {
        return snapshotCommunity;
      }
      throw error instanceof ApiError
        ? error
        : new ApiError('Community not available offline', 503);
    }
  },

  joinCommunity: async (id: string): Promise<Community> => {
    const joinedIds = await ensureJoinedCommunitiesHydrated();
    const community = await discourseApi.getCommunityById(id, joinedIds);

    if (!joinedIds.has(id)) {
      await useJoinedCommunitiesStore.getState().setJoined(id, true);
    }

    return {
      ...community,
      isJoined: true,
      memberCount: community.memberCount + 1,
    };
  },

  leaveCommunity: async (id: string): Promise<Community> => {
    const joinedIds = await ensureJoinedCommunitiesHydrated();
    const community = await discourseApi.getCommunityById(id, joinedIds);

    if (joinedIds.has(id)) {
      await useJoinedCommunitiesStore.getState().setJoined(id, false);
    }

    return {
      ...community,
      isJoined: false,
      memberCount: Math.max(0, community.memberCount - 1),
    };
  },

  getJoinedIds: async (): Promise<string[]> => {
    const joinedIds = await ensureJoinedCommunitiesHydrated();
    return Array.from(joinedIds);
  },

  setJoinedLocally: async (id: string, joined: boolean): Promise<void> => {
    await useJoinedCommunitiesStore.getState().setJoined(id, joined);
  },
};
