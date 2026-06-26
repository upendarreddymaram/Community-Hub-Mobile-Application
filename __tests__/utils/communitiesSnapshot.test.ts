import type { Community } from '../../src/types/community';
import {
  buildCommunitiesPageFromList,
  getCommunitiesPageFromSnapshot,
  getCommunityFromSnapshot,
  saveCommunitiesSnapshot,
} from '../../src/utils/communitiesSnapshot';
import { getJsonItem, setJsonItem } from '../../src/utils/storage';

jest.mock('../../src/utils/storage', () => ({
  getJsonItem: jest.fn(),
  setJsonItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockedGetJsonItem = getJsonItem as jest.MockedFunction<typeof getJsonItem>;
const mockedSetJsonItem = setJsonItem as jest.MockedFunction<typeof setJsonItem>;

const sampleCommunities: Community[] = [
  {
    id: '1',
    slug: 'dev',
    name: 'Dev',
    description: 'Developers',
    memberCount: 100,
    postCount: 10,
    isJoined: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    category: 'Tech',
  },
  {
    id: '2',
    slug: 'design',
    name: 'Design',
    description: 'Designers',
    memberCount: 80,
    postCount: 8,
    isJoined: true,
    createdAt: '2024-02-01T00:00:00.000Z',
    category: 'Creative',
  },
];

describe('communitiesSnapshot', () => {
  beforeEach(() => {
    mockedGetJsonItem.mockResolvedValue(null);
    mockedSetJsonItem.mockResolvedValue(undefined);
  });

  it('saves communities snapshot to storage', async () => {
    await saveCommunitiesSnapshot(sampleCommunities);

    expect(mockedSetJsonItem).toHaveBeenCalledWith(
      '@community_hub/communities_snapshot',
      expect.objectContaining({
        communities: sampleCommunities,
      }),
    );
  });

  it('builds a filtered page from snapshot data', () => {
    const page = buildCommunitiesPageFromList(
      sampleCommunities,
      1,
      { search: 'dev', sort: 'name', joinedOnly: false },
      new Set(['2']),
    );

    expect(page.data).toHaveLength(1);
    expect(page.data[0]?.name).toBe('Dev');
    expect(page.totalCount).toBe(1);
  });

  it('returns a community by id from snapshot with joined state merged', async () => {
    mockedGetJsonItem.mockResolvedValueOnce({
      savedAt: '2024-01-01T00:00:00.000Z',
      communities: sampleCommunities,
    });

    const community = await getCommunityFromSnapshot('2', new Set(['2']));

    expect(community?.name).toBe('Design');
    expect(community?.isJoined).toBe(true);
  });

  it('returns paginated communities from snapshot when storage exists', async () => {
    mockedGetJsonItem.mockResolvedValueOnce({
      savedAt: '2024-01-01T00:00:00.000Z',
      communities: sampleCommunities,
    });

    const page = await getCommunitiesPageFromSnapshot(
      1,
      { search: '', sort: 'members', joinedOnly: false },
      new Set(),
    );

    expect(page?.data).toHaveLength(2);
    expect(page?.data[0]?.name).toBe('Dev');
  });
});
