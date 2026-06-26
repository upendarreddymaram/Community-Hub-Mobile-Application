import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { PostCard } from './PostCard';
import { useAnimatedValue } from '../../../utils/animatedValue';
import type { Post } from '../../../types/post';

interface AnimatedPostCardProps {
  post: Post;
  isDeleting?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onDeleteAnimationComplete?: (postId: string) => void;
}

function AnimatedPostCardComponent({
  post,
  isDeleting = false,
  onEdit,
  onDelete,
  onDeleteAnimationComplete,
}: AnimatedPostCardProps) {
  const opacity = useAnimatedValue(1);
  const scale = useAnimatedValue(1);
  const translateX = useAnimatedValue(0);
  const maxHeight = useAnimatedValue(500);
  const marginBottom = useAnimatedValue(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!isDeleting) {
      hasAnimatedRef.current = false;
      opacity.setValue(1);
      scale.setValue(1);
      translateX.setValue(0);
      maxHeight.setValue(500);
      marginBottom.setValue(0);
      return;
    }

    if (hasAnimatedRef.current) {
      return;
    }

    hasAnimatedRef.current = true;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(translateX, {
          toValue: -6,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0.88,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(translateX, {
          toValue: 48,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(maxHeight, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(marginBottom, {
          toValue: -12,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        onDeleteAnimationComplete?.(post.id);
      }
    });
  }, [
    isDeleting,
    marginBottom,
    maxHeight,
    onDeleteAnimationComplete,
    opacity,
    post.id,
    scale,
    translateX,
  ]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          maxHeight,
          marginBottom,
          transform: [{ scale }, { translateX }],
        },
      ]}
    >
      <View style={isDeleting ? styles.deletingCard : undefined}>
        <PostCard
          post={post}
          onEdit={isDeleting ? undefined : onEdit}
          onDelete={isDeleting ? undefined : onDelete}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  deletingCard: {
    opacity: 0.85,
  },
});

export const AnimatedPostCard = memo(AnimatedPostCardComponent);
