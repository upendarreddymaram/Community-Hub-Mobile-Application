import { sortCommunities } from '../../src/utils/communitySort';

const sample = [
  { name: 'Beta', memberCount: 100, createdAt: '2024-01-01T00:00:00.000Z' },
  { name: 'Alpha', memberCount: 500, createdAt: '2024-06-01T00:00:00.000Z' },
  { name: 'Gamma', memberCount: 50, createdAt: '2025-01-01T00:00:00.000Z' },
];

describe('sortCommunities', () => {
  it('sorts by name alphabetically', () => {
    const sorted = sortCommunities(sample, 'name');
    expect(sorted.map((item) => item.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('sorts by member count descending', () => {
    const sorted = sortCommunities(sample, 'members');
    expect(sorted.map((item) => item.memberCount)).toEqual([500, 100, 50]);
  });

  it('sorts by newest created date first', () => {
    const sorted = sortCommunities(sample, 'newest');
    expect(sorted[0]?.name).toBe('Gamma');
  });
});
