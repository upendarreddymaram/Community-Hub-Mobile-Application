import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Input, OfflineSyncBanner } from '../../../components/common';
import { useCreatePost, useSavePostDraft, useUpdatePost } from '../hooks/usePosts';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';
import { hasValidationErrors, validateCreatePost } from '../../../utils/validation';
import { trackEvent } from '../../../utils/analytics';

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

export interface PostFormProps {
  communityId: string;
  communityName: string;
  mode: 'create' | 'edit';
  postId?: string;
  initialTitle: string;
  initialBody: string;
  enableDraftSave: boolean;
  onSuccess: (mode: 'create' | 'edit') => void;
}

export function PostForm({
  communityId,
  communityName,
  mode,
  postId,
  initialTitle,
  initialBody,
  enableDraftSave,
  onSuccess,
}: PostFormProps) {
  const styles = useThemedStyles(createStyles);
  const { isOnline } = useNetworkStatus();
  const { pendingCount, isSyncing, syncError, retrySync } = useOfflineSync();
  const saveDraft = useSavePostDraft(communityId);
  const createPost = useCreatePost(communityId);
  const updatePost = useUpdatePost(communityId);

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const hasSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = mode === 'edit';
  const mutation = isEditing ? updatePost : createPost;
  const isPending = mutation.isPending;

  const persistDraft = (nextTitle: string, nextBody: string) => {
    if (!enableDraftSave) {
      return;
    }

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
    if (isPending || hasSubmittedRef.current) {
      return;
    }

    const validationErrors = validateCreatePost(title, body);
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      return;
    }

    hasSubmittedRef.current = true;

    if (isEditing && postId) {
      updatePost.mutate(
        { communityId, postId, title, body },
        {
          onSuccess: () => {
            trackEvent('post_edit', { communityId, postId });
            onSuccess('edit');
          },
          onSettled: () => {
            hasSubmittedRef.current = false;
          },
        },
      );
      return;
    }

    createPost.mutate(
      { communityId, title, body },
      {
        onSuccess: () => {
          trackEvent('post_create', { communityId, offline: !isOnline });
          onSuccess('create');
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
      <OfflineSyncBanner
        isOnline={isOnline}
        pendingActions={pendingCount}
        isSyncing={isSyncing}
        syncError={syncError}
        onRetrySync={retrySync}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>{isEditing ? 'Edit post' : 'Create post'}</Text>
        <Text style={styles.subheading}>
          {isEditing ? 'Update your post in' : 'Posting in'} {communityName}
        </Text>

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
          error={errors.body}
        />

        {mutation.isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {mutation.error instanceof Error
                ? mutation.error.message
                : isEditing
                  ? 'Failed to update post'
                  : 'Failed to create post'}
            </Text>
            <Button label="Retry" variant="secondary" onPress={handleSubmit} />
          </View>
        ) : null}

        <Button
          label={isEditing ? 'Save Changes' : 'Publish Post'}
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
