import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorView, LoadingView, SuccessAnimation } from '../../../components/common';
import { PostForm } from '../components/PostForm';
import { useLocalPost, usePostDraft } from '../hooks/usePosts';
import type { MainStackParamList } from '../../../types/navigation';
import type { PostDraft } from '../../../types/post';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

export function CreatePostScreen({ route, navigation }: Props) {
  const { communityId, communityName, postId } = route.params;
  const isEditing = Boolean(postId);
  const draftQuery = usePostDraft(communityId);
  const localPostQuery = useLocalPost(communityId, postId ?? '');
  const [successMode, setSuccessMode] = useState<'create' | 'edit' | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Post' : 'New Post' });
  }, [isEditing, navigation]);

  const handleSuccess = (mode: 'create' | 'edit') => {
    setSuccessMode(mode);
  };

  if (successMode) {
    const isCreate = successMode === 'create';

    return (
      <View style={styles.successContainer}>
        <SuccessAnimation
          title={isCreate ? 'Post published!' : 'Changes saved!'}
          subtitle={
            isCreate
              ? `Your post is live in ${communityName}.`
              : 'Your post has been updated on this device.'
          }
          durationMs={isCreate ? 2200 : 1600}
          onComplete={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (isEditing) {
    if (localPostQuery.isLoading) {
      return <LoadingView message="Loading post..." />;
    }

    if (localPostQuery.isError || !localPostQuery.data) {
      return (
        <ErrorView
          message={
            localPostQuery.error instanceof Error
              ? localPostQuery.error.message
              : 'Unable to load post for editing'
          }
          onRetry={() => void localPostQuery.refetch()}
        />
      );
    }

    return (
      <PostForm
        communityId={communityId}
        communityName={communityName}
        mode="edit"
        postId={postId}
        initialTitle={localPostQuery.data.title}
        initialBody={localPostQuery.data.body}
        enableDraftSave={false}
        onSuccess={handleSuccess}
      />
    );
  }

  if (draftQuery.isLoading) {
    return <LoadingView message="Loading draft..." />;
  }

  const initialDraft: PostDraft | null | undefined = draftQuery.data;

  return (
    <PostForm
      communityId={communityId}
      communityName={communityName}
      mode="create"
      initialTitle={initialDraft?.title ?? ''}
      initialBody={initialDraft?.body ?? ''}
      enableDraftSave
      onSuccess={handleSuccess}
    />
  );
}

const styles = StyleSheet.create({
  successContainer: {
    flex: 1,
  },
});
