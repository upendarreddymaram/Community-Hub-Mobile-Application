import type { CommunitySortOption } from '../types/community';

export function sortCommunities<
  T extends { name: string; memberCount: number; createdAt: string },
>(items: T[], sort: CommunitySortOption): T[] {
  const copy = [...items];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'members':
      return copy.sort((a, b) => b.memberCount - a.memberCount);
    case 'newest':
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    default:
      return copy;
  }
}
