import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { discourseApi, resetDiscourseCategoryCache } from '../../src/api/discourseApi';
import { API_CONFIG } from '../../src/utils/constants';

const mockSiteResponse = {
  categories: [
    {
      id: 7,
      name: 'Dev',
      slug: 'dev',
      description_text: 'Developer community',
      topic_count: 12,
      post_count: 120,
      read_restricted: false,
    },
    {
      id: 8,
      name: 'Design',
      slug: 'design',
      description_text: 'Design community',
      topic_count: 8,
      post_count: 80,
      read_restricted: false,
    },
    {
      id: 99,
      name: 'Hidden',
      slug: 'hidden',
      topic_count: 0,
      post_count: 0,
      read_restricted: false,
    },
  ],
};

const server = setupServer(
  rest.get(`${API_CONFIG.DISCOURSE_BASE_URL}/site.json`, (_req, res, ctx) =>
    res(ctx.json(mockSiteResponse)),
  ),
  rest.get(`${API_CONFIG.DISCOURSE_BASE_URL}/c/dev/7.json`, (req, res, ctx) => {
    const page = req.url.searchParams.get('page') ?? '1';

    if (page === '1') {
      return res(
        ctx.json({
          users: [{ id: 1, username: 'alice', name: 'Alice' }],
          topic_list: {
            topics: [
              {
                id: 101,
                title: 'First topic',
                slug: 'first-topic',
                excerpt: '<p>Hello world</p>',
                created_at: '2024-05-01T12:00:00.000Z',
                last_poster_username: 'alice',
                category_id: 7,
              },
            ],
            more_topics_url: '/c/dev/7.json?page=2',
          },
          category: mockSiteResponse.categories[0],
        }),
      );
    }

    return res(
      ctx.json({
        users: [],
        topic_list: {
          topics: [
            {
              id: 102,
              title: 'Second page topic',
              slug: 'second-page-topic',
              excerpt: '<p>Page two</p>',
              created_at: '2024-04-01T12:00:00.000Z',
              last_poster_username: 'bob',
              category_id: 7,
            },
          ],
          more_topics_url: null,
        },
      }),
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDiscourseCategoryCache();
});
afterAll(() => server.close());

describe('discourseApi integration (MSW)', () => {
  it('fetches and maps a paginated communities page', async () => {
    const page = await discourseApi.getCommunitiesPage(
      1,
      { search: 'dev', sort: 'name', joinedOnly: false },
      new Set(),
    );

    expect(page.totalCount).toBe(1);
    expect(page.data[0]?.name).toBe('Dev');
    expect(page.data[0]?.slug).toBe('dev');
  });

  it('fetches topic pages with pagination metadata', async () => {
    const firstPage = await discourseApi.getTopicsPage('7', 1);

    expect(firstPage.page).toBe(1);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.data[0]?.title).toBe('First topic');

    const secondPage = await discourseApi.getTopicsPage('7', 2);

    expect(secondPage.hasMore).toBe(false);
    expect(secondPage.data[0]?.title).toBe('Second page topic');
  });
});
