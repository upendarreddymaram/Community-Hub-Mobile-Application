import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input, LoadingView, OfflineBanner } from '../../../components/common';
import { useCreatePost, usePostDraft, useSavePostDraft } from '../hooks/usePosts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { MainStackParamList } from '../../../types/navigation';
import type { PostDraft } from '../../../types/post';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';
import { hasValidationErrors, validateCreatePost } from '../../../utils/validation';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
    },
    heading: {
      ...typography.title,
      fontSize: 22,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subheading: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    bodyInput: {
      minHeight: 140,
      textAlignVertical: 'top',
    },
    errorBox: {
      backgroundColor: colors.errorBackground,
      borderRadius: 10,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      color: colors.error,
      ...typography.caption,
      marginBottom: spacing.sm,
    },
  });
}

interface CreatePostFormProps {
  communityId: string;
  communityName: string;
  initialDraft: PostDraft | null | undefined;
  onSuccess: () => void;
}

function CreatePostForm({
  communityId,
  communityName,
  initialDraft,
  onSuccess,
}: CreatePostFormProps) {
  const styles = useThemedStyles(createStyles);
  const { isOnline } = useNetworkStatus();
  const saveDraft = useSavePostDraft(communityId);
  const createPost = useCreatePost(communityId);

  const [title, setTitle] = useState(initialDraft?.title ?? '');
  const [body, setBody] = useState(initialDraft?.body ?? '');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const hasSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistDraft = (nextTitle: string, nextBody: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (nextTitle.trim() || nextBody.trim()) {
        saveDraft.mutate({ title: nextTitle, body: nextBody });
      }
    }, 500);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    persistDraft(value, body);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    persistDraft(title, value);
  };

  const handleSubmit = () => {
    if (createPost.isPending || hasSubmittedRef.current) {
      return;
    }

    const validationErrors = validateCreatePost(title, body);
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      return;
    }

    hasSubmittedRef.current = true;

    createPost.mutate(
      { communityId, title, body },
      {
        onSuccess: () => {
          onSuccess();
        },
        onSettled: () => {
          hasSubmittedRef.current = false;
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {!isOnline ? <OfflineBanner /> : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create post</Text>
        <Text style={styles.subheading}>Posting in {communityName}</Text>

        <Input
          label="Title"
          value={title}
          onChangeText={handleTitleChange}
          placeholder="Enter a descriptive title"
          error={errors.title}
        />
        <Input
          label="Body"
          value={body}
          onChangeText={handleBodyChange}
          placeholder="Share your thoughts..."
          multiline
          numberOfLines={6}
          style={styles.bodyInput}
          error={errors.body}
        />

        {createPost.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {createPost.error instanceof Error
                ? createPost.error.message
                : 'Failed to create post'}
            </Text>
            <Button label="Retry" variant="secondary" onPress={handleSubmit} />
          </View>
        ) : null}

        <Button
          label="Publish Post"
          onPress={handleSubmit}
          loading={createPost.isPending}
          disabled={createPost.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function CreatePostScreen({ route, navigation }: Props) {
  const { communityId, communityName } = route.params;
  const draftQuery = usePostDraft(communityId);

  if (draftQuery.isLoading) {
    return <LoadingView message="Loading draft..." />;
  }

  return (
    <CreatePostForm
      communityId={communityId}
      communityName={communityName}
      initialDraft={draftQuery.data}
      onSuccess={() => navigation.goBack()}
    />
  );
}
