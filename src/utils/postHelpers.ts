import type { Post } from '../types/post';

/** Posts created on-device (not from Discourse). */
export function isLocalPost(post: Post): boolean {
  return post.isLocal === true || post.id.startsWith('local_');
}

/** Local posts the user can edit or delete (not while optimistic/syncing). */
export function canManagePost(post: Post): boolean {
  return isLocalPost(post) && !post.isOptimistic;
}
