import { useOfflineQueueStore } from '../../src/store/offlineQueueStore';
import { getJsonItem, setJsonItem } from '../../src/utils/storage';

jest.mock('../../src/utils/storage', () => ({
  getJsonItem: jest.fn(),
  setJsonItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockedGetJsonItem = getJsonItem as jest.MockedFunction<typeof getJsonItem>;
const mockedSetJsonItem = setJsonItem as jest.MockedFunction<typeof setJsonItem>;

describe('useOfflineQueueStore', () => {
  beforeEach(() => {
    mockedGetJsonItem.mockResolvedValue([]);
    mockedSetJsonItem.mockResolvedValue(undefined);
    useOfflineQueueStore.setState({ queue: [], isHydrated: false });
  });

  it('hydrates queue from storage', async () => {
    mockedGetJsonItem.mockResolvedValueOnce([
      {
        id: 'join-7-1',
        type: 'join',
        communityId: '7',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    await useOfflineQueueStore.getState().hydrate();

    expect(useOfflineQueueStore.getState().queue).toHaveLength(1);
    expect(useOfflineQueueStore.getState().isHydrated).toBe(true);
  });

  it('replaces conflicting join/leave actions for the same community', async () => {
    await useOfflineQueueStore.getState().enqueue('join', '7');
    await useOfflineQueueStore.getState().enqueue('leave', '7');

    const { queue } = useOfflineQueueStore.getState();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.type).toBe('leave');
    expect(queue[0]?.communityId).toBe('7');
  });

  it('allows multiple create_post actions', async () => {
    await useOfflineQueueStore.getState().enqueue('create_post', '7', {
      postId: 'local_1',
      title: 'One',
      body: 'First queued post body',
      authorName: 'Alice',
    });
    await useOfflineQueueStore.getState().enqueue('create_post', '7', {
      postId: 'local_2',
      title: 'Two',
      body: 'Second queued post body',
      authorName: 'Alice',
    });

    expect(useOfflineQueueStore.getState().queue).toHaveLength(2);
  });
});
