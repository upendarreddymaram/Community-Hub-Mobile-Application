export type CommunitySortOption = 'name' | 'members' | 'newest';

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  createdAt: string;
  category: string;
}

export interface CommunitiesResponse {
  data: Community[];
  page: number;
  totalPages: number;
  totalCount: number;
}

export interface CommunityFilters {
  search: string;
  sort: CommunitySortOption;
  joinedOnly: boolean;
}

export interface JoinLeavePayload {
  communityId: string;
  action: 'join' | 'leave';
}
