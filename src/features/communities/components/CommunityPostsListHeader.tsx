import React, { memo } from 'react';
import { CommunityDetailHeader } from './CommunityDetailHeader';
import { CommunityPostsToolbar } from './CommunityPostsToolbar';
import type { Community } from '../../../types/community';

interface CommunityPostsListHeaderProps {
  community: Community;
  isWide: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  membershipError: unknown;
  onToggleMembership: () => void;
  onCreatePost: () => void;
  onRetryMembership: () => void;
  onRefreshPosts: () => void;
}

function CommunityPostsListHeaderComponent({
  community,
  isWide,
  isJoining,
  isLeaving,
  membershipError,
  onToggleMembership,
  onCreatePost,
  onRetryMembership,
  onRefreshPosts,
}: CommunityPostsListHeaderProps) {
  return (
    <>
      <CommunityDetailHeader
        community={community}
        isWide={isWide}
        isJoining={isJoining}
        isLeaving={isLeaving}
        membershipError={membershipError}
        onToggleMembership={onToggleMembership}
        onCreatePost={onCreatePost}
        onRetryMembership={onRetryMembership}
      />
      <CommunityPostsToolbar onRefreshPosts={onRefreshPosts} />
    </>
  );
}

export const CommunityPostsListHeader = memo(CommunityPostsListHeaderComponent);
