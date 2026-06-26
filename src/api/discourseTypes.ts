export interface DiscourseCategory {
  id: number;
  name: string;
  slug: string;
  description_text?: string;
  description_excerpt?: string;
  topic_count: number;
  post_count: number;
  read_restricted?: boolean;
  parent_category_id?: number | null;
  topic_url?: string;
}

export interface DiscourseSiteResponse {
  categories: DiscourseCategory[];
}

export interface DiscourseUser {
  id: number;
  username: string;
  name?: string;
}

export interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  created_at: string;
  last_poster_username?: string;
  posters?: Array<{ user_id: number; description: string }>;
  category_id: number;
  pinned?: boolean;
  closed?: boolean;
}

export interface DiscourseCategoryTopicsResponse {
  users: DiscourseUser[];
  topic_list: {
    topics: DiscourseTopic[];
    more_topics_url?: string | null;
  };
  category?: DiscourseCategory;
}
