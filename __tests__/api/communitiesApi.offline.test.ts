import { communitiesApi } from '../../src/features/communities/api/communitiesApi';
import { discourseApi } from '../../src/api/discourseApi';
import {
  getCommunitiesPageFromSnapshot,
  getCommunityFromSnapshot,
} from '../../src/utils/communitiesSnapshot';
import { ensureJoinedCommunitiesHydrated } from '../../src/features/communities/store/joinedCommunitiesStore';

jest.mock('../../src/api/discourseApi', () => ({
  discourseApi: {
    getCommunitiesPage: jest.fn(),
    getCommunityById: jest.fn(),
  },
}));

jest.mock('../../src/utils/communitiesSnapshot', () => ({
  getCommunitiesPageFromSnapshot: jest.fn(),
  getCommunityFromSnapshot: jest.fn(),
}));

jest.mock('../../src/features/communities/store/joinedCommunitiesStore', () => ({
  ensureJoinedCommunitiesHydrated: jest.fn(),
  useJoinedCommunitiesStore: {
    getState: jest.fn(),
  },
}));

const mockedGetCommunitiesPage = discourseApi.getCommunitiesPage as jest.MockedFunction<
  typeof discourseApi.getCommunitiesPage
>;
const mockedGetCommunityById = discourseApi.getCommunityById as jest.MockedFunction<
  typeof discourseApi.getCommunityById
>;
const mockedGetCommunitiesPageFromSnapshot =
  getCommunitiesPageFromSnapshot as jest.MockedFunction<
    typeof getCommunitiesPageFromSnapshot
  >;
const mockedGetCommunityFromSnapshot = getCommunityFromSnapshot as jest.MockedFunction<
  typeof getCommunityFromSnapshot
>;
const mockedEnsureJoined = ensureJoinedCommunitiesHydrated as jest.MockedFunction<
  typeof ensureJoinedCommunitiesHydrated
>;

describe('communitiesApi offline fallbacks', () => {
  beforeEach(() => {
    mockedEnsureJoined.mockResolvedValue(new Set(['7']));
    mockedGetCommunitiesPageFromSnapshot.mockResolvedValue(null);
    mockedGetCommunityFromSnapshot.mockResolvedValue(null);
  });

  it('falls back to snapshot when live communities fetch fails', async () => {
    mockedGetCommunitiesPage.mockRejectedValueOnce(new Error('Network request failed'));
    mockedGetCommunitiesPageFromSnapshot.mockResolvedValueOnce({
      data: [
        {
          id: '7',
          slug: 'dev',
          name: 'Dev',
          description: 'Developers',
          memberCount: 10,
          postCount: 2,
          isJoined: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          category: 'Tech',
        },
      ],
      page: 1,
      totalPages: 1,
      totalCount: 1,
    });

    const page = await communitiesApi.getCommunities(1, {
      search: '',
      sort: 'name',
      joinedOnly: false,
    });

    expect(page.data).toHaveLength(1);
    expect(mockedGetCommunitiesPageFromSnapshot).toHaveBeenCalled();
  });

  it('falls back to snapshot when live community detail fetch fails', async () => {
    mockedGetCommunityById.mockRejectedValueOnce(new Error('Network request failed'));
    mockedGetCommunityFromSnapshot.mockResolvedValueOnce({
      id: '7',
      slug: 'dev',
      name: 'Dev',
      description: 'Developers',
      memberCount: 10,
      postCount: 2,
      isJoined: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      category: 'Tech',
    });

    const community = await communitiesApi.getCommunityById('7');

    expect(community.name).toBe('Dev');
    expect(mockedGetCommunityFromSnapshot).toHaveBeenCalledWith('7', new Set(['7']));
  });
});
