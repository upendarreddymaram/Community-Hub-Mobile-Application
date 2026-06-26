import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../../theme';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = '100%',
  height,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CommunityListSkeleton() {
  return (
    <View style={styles.listSkeleton} accessibilityRole="progressbar">
      <SkeletonBox height={48} borderRadius={12} style={styles.searchSkeleton} />
      <View style={styles.chipRow}>
        <SkeletonBox width={120} height={36} borderRadius={18} />
        <SkeletonBox width={80} height={36} borderRadius={18} />
      </View>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.cardSkeleton}>
          <SkeletonBox height={18} width="70%" style={styles.line} />
          <SkeletonBox height={14} width="100%" style={styles.line} />
          <SkeletonBox height={14} width="88%" style={styles.line} />
          <SkeletonBox height={12} width="45%" />
        </View>
      ))}
    </View>
  );
}

export function CommunityDetailSkeleton() {
  return (
    <View style={styles.detailSkeleton} accessibilityRole="progressbar">
      <View style={styles.headerSkeleton}>
        <SkeletonBox height={24} width="75%" style={styles.line} />
        <SkeletonBox height={14} width="100%" style={styles.line} />
        <SkeletonBox height={14} width="92%" style={styles.line} />
        <View style={styles.statsRow}>
          <SkeletonBox width={72} height={40} borderRadius={8} />
          <SkeletonBox width={72} height={40} borderRadius={8} />
          <SkeletonBox width={72} height={40} borderRadius={8} />
        </View>
        <SkeletonBox height={48} borderRadius={10} />
      </View>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.postSkeleton}>
          <SkeletonBox height={16} width="80%" style={styles.line} />
          <SkeletonBox height={12} width="100%" style={styles.line} />
          <SkeletonBox height={12} width="60%" />
        </View>
      ))}
    </View>
  );
}

export function PostListSkeleton() {
  return (
    <View accessibilityRole="progressbar">
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.postSkeleton}>
          <SkeletonBox height={16} width="80%" style={styles.line} />
          <SkeletonBox height={12} width="100%" style={styles.line} />
          <SkeletonBox height={12} width="60%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listSkeleton: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  searchSkeleton: {
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardSkeleton: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  detailSkeleton: {
    padding: spacing.md,
  },
  headerSkeleton: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  postSkeleton: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  line: {
    marginBottom: spacing.sm,
  },
});
