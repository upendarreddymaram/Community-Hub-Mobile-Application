export type OfflineActionType = 'join' | 'leave';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  communityId: string;
  createdAt: string;
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
};
