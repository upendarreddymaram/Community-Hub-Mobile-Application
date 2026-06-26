export interface Post {
  id: string;
  communityId: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  isOptimistic?: boolean;
}

export interface CreatePostPayload {
  communityId: string;
  title: string;
  body: string;
}

export interface CreatePostFormErrors {
  title?: string;
  body?: string;
}

export interface PostDraft {
  communityId: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface PostsPageResponse {
  data: Post[];
  page: number;
  hasMore: boolean;
}
