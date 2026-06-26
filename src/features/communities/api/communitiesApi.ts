import type { CommunitiesResponse, Community, CommunityFilters } from '../../../types/community';
import { discourseApi } from '../../../api/discourseApi';
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
    return discourseApi.getCommunitiesPage(page, filters, joinedIds);
  },

  getCommunityById: async (id: string): Promise<Community> => {
    const joinedIds = await ensureJoinedCommunitiesHydrated();
    return discourseApi.getCommunityById(id, joinedIds);
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
