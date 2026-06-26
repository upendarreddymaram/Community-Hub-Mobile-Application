import { mapDiscourseCategory, mapDiscourseTopic } from '../../src/api/discourseApi';
import type { DiscourseCategory, DiscourseTopic } from '../../src/api/discourseTypes';

describe('discourseApi mappers', () => {
  const parent: DiscourseCategory = {
    id: 1,
    name: 'Support',
    slug: 'support',
    topic_count: 10,
    post_count: 100,
  };

  const category: DiscourseCategory = {
    id: 7,
    name: 'Dev',
    slug: 'dev',
    description_text: 'Developer discussions',
    topic_count: 20,
    post_count: 200,
    parent_category_id: 1,
  };

  it('maps a Discourse category to a Community model', () => {
    const categoriesById = new Map<number, DiscourseCategory>([[1, parent]]);
    const community = mapDiscourseCategory(category, categoriesById, true);

    expect(community).toMatchObject({
      id: '7',
      slug: 'dev',
      name: 'Dev',
      description: 'Developer discussions',
      postCount: 20,
      category: 'Support',
      isJoined: true,
    });
    expect(community.memberCount).toBeGreaterThanOrEqual(200);
  });

  it('maps a Discourse topic to a Post model', () => {
    const topic: DiscourseTopic = {
      id: 42,
      title: 'Welcome',
      slug: 'welcome',
      excerpt: '<p>Hello &amp; welcome</p>',
      created_at: '2024-05-01T12:00:00.000Z',
      last_poster_username: 'alice',
      category_id: 7,
    };

    const post = mapDiscourseTopic(topic, '7', []);

    expect(post).toEqual({
      id: '42',
      communityId: '7',
      title: 'Welcome',
      body: 'Hello & welcome',
      authorName: 'alice',
      createdAt: '2024-05-01T12:00:00.000Z',
    });
  });
});
