import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/common';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { ThemeColors } from '../../../theme/colors';
import { spacing, typography } from '../../../theme';

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    postsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.subtitle,
      color: colors.text,
    },
  });
}

interface CommunityPostsToolbarProps {
  onRefreshPosts: () => void;
}

function CommunityPostsToolbarComponent({ onRefreshPosts }: CommunityPostsToolbarProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.postsHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Posts
      </Text>
      <Button
        label="Refresh"
        variant="secondary"
        onPress={onRefreshPosts}
        accessibilityLabel="Refresh posts only"
      />
    </View>
  );
}

export const CommunityPostsToolbar = memo(CommunityPostsToolbarComponent);
