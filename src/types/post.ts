export interface Post {
  id: string;
  communityId: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  isLocal?: boolean;
  isOptimistic?: boolean;
}

export interface UpdatePostPayload {
  communityId: string;
  postId: string;
  title: string;
  body: string;
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
