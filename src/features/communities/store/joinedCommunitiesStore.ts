import { create } from 'zustand';
import { STORAGE_KEYS } from '../../../utils/constants';
import { getJsonItem, setJsonItem } from '../../../utils/storage';

interface JoinedCommunitiesState {
  joinedIds: Set<string>;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  getJoinedIds: () => Set<string>;
  isJoined: (communityId: string) => boolean;
  setJoined: (communityId: string, joined: boolean) => Promise<void>;
}

export const useJoinedCommunitiesStore = create<JoinedCommunitiesState>((set, get) => ({
  joinedIds: new Set<string>(),
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const stored = await getJsonItem<string[]>(STORAGE_KEYS.JOINED_COMMUNITIES);
    set({
      joinedIds: new Set(stored ?? []),
      isHydrated: true,
    });
  },

  getJoinedIds: () => get().joinedIds,

  isJoined: (communityId) => get().joinedIds.has(communityId),

  setJoined: async (communityId, joined) => {
    const next = new Set(get().joinedIds);
    if (joined) {
      next.add(communityId);
    } else {
      next.delete(communityId);
    }

    await setJsonItem(STORAGE_KEYS.JOINED_COMMUNITIES, Array.from(next));
    set({ joinedIds: next, isHydrated: true });
  },
}));

/** Ensures joined state is loaded before API reads (usable outside React). */
export async function ensureJoinedCommunitiesHydrated(): Promise<Set<string>> {
  await useJoinedCommunitiesStore.getState().hydrate();
  return useJoinedCommunitiesStore.getState().getJoinedIds();
}
