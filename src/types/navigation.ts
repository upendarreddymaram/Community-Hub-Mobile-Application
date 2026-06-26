export type OfflineActionType = 'join' | 'leave' | 'create_post';

export interface CreatePostOfflinePayload {
  postId: string;
  title: string;
  body: string;
  authorName: string;
}

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  communityId: string;
  createdAt: string;
  payload?: CreatePostOfflinePayload;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  CommunityList: undefined;
  CommunityDetail: { communityId: string };
  CreatePost: { communityId: string; communityName: string };
  Profile: undefined;
};
