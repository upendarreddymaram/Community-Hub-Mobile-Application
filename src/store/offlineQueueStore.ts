import { create } from 'zustand';
import type { OfflineAction, OfflineActionType } from '../types/navigation';
import { STORAGE_KEYS } from '../utils/constants';
import { getJsonItem, setJsonItem } from '../utils/storage';

interface OfflineQueueState {
  queue: OfflineAction[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  enqueue: (type: OfflineActionType, communityId: string) => Promise<void>;
  dequeue: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

function createAction(type: OfflineActionType, communityId: string): OfflineAction {
  return {
    id: `${type}-${communityId}-${Date.now()}`,
    type,
    communityId,
    createdAt: new Date().toISOString(),
  };
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  queue: [],
  isHydrated: false,

  hydrate: async () => {
    const queue = (await getJsonItem<OfflineAction[]>(STORAGE_KEYS.OFFLINE_QUEUE)) ?? [];
    set({ queue, isHydrated: true });
  },

  enqueue: async (type, communityId) => {
    const existing = get().queue.find(
      (item) => item.communityId === communityId && item.type === type,
    );
    if (existing) {
      return;
    }

    const filtered = get().queue.filter((item) => item.communityId !== communityId);
    const action = createAction(type, communityId);
    const queue = [...filtered, action];
    await setJsonItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
    set({ queue });
  },

  dequeue: async (id) => {
    const queue = get().queue.filter((item) => item.id !== id);
    await setJsonItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
    set({ queue });
  },

  clear: async () => {
    await setJsonItem(STORAGE_KEYS.OFFLINE_QUEUE, []);
    set({ queue: [] });
  },
}));
