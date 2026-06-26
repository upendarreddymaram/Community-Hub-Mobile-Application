import React, { memo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type View as ViewType,
} from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { Community, CommunitySortOption } from '../../../types/community';
import type { ThemeColors } from '../../../theme/colors';
import { SORT_OPTIONS, SortDropdown } from './SortDropdown';
import { radii, spacing, typography } from '../../../theme';

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    pressed: {
      backgroundColor: colors.surfaceMuted,
    },
    content: {
      padding: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    name: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.2,
    },
    joinedPill: {
      backgroundColor: colors.successBackground,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.pill,
    },
    joinedText: {
      ...typography.small,
      color: colors.success,
      fontWeight: '600',
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 21,
      marginBottom: spacing.md,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    meta: {
      ...typography.small,
      color: colors.textMuted,
      fontWeight: '500',
    },
    dot: {
      marginHorizontal: spacing.xs,
      color: colors.textMuted,
    },
    filterContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? 14 : spacing.sm + 2,
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    sortTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    sortTriggerActive: {
      borderColor: colors.primary,
    },
    sortTriggerText: {
      ...typography.small,
      color: colors.text,
      fontWeight: '600',
    },
    sortChevron: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    chip: {
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipText: {
      ...typography.small,
      color: colors.text,
      fontWeight: '600',
    },
    chipTextActive: {
      color: colors.surface,
    },
  });
}

interface CommunityCardProps {
  community: Community;
  onPress: (community: Community) => void;
}

function CommunityCardComponent({ community, onPress }: CommunityCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${community.name}, ${community.memberCount} members`}
      onPress={() => onPress(community)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {community.name}
          </Text>
          {community.isJoined ? (
            <View style={styles.joinedPill}>
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {community.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.meta}>{community.memberCount.toLocaleString()} members</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{community.category}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export const CommunityCard = memo(CommunityCardComponent);

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: CommunitySortOption;
  onSortChange: (value: CommunitySortOption) => void;
  joinedOnly: boolean;
  onToggleJoined: () => void;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  joinedOnly,
  onToggleJoined,
}: SearchFilterBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const sortTriggerRef = useRef<ViewType>(null);
  const [sortExpanded, setSortExpanded] = useState(false);
  const [sortAnchor, setSortAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Members';

  const handleSortToggle = () => {
    sortTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setSortAnchor({ x, y, width, height });
      setSortExpanded(true);
    });
  };

  const handleSortSelect = (value: CommunitySortOption) => {
    onSortChange(value);
    setSortExpanded(false);
  };

  return (
    <View style={styles.filterContainer}>
      <TextInput
        accessibilityLabel="Search communities"
        placeholder="Search communities"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={onSearchChange}
        style={styles.searchInput}
        returnKeyType="search"
      />

      <View style={styles.chipRow}>
        <View ref={sortTriggerRef} collapsable={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: sortExpanded }}
            accessibilityLabel={`Sort communities, currently ${activeSortLabel}`}
            onPress={handleSortToggle}
            style={({ pressed }) => [
              styles.sortTrigger,
              sortExpanded && styles.sortTriggerActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={styles.sortTriggerText}>Sort · {activeSortLabel}</Text>
            <Text style={styles.sortChevron}>▾</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: joinedOnly }}
          accessibilityLabel={joinedOnly ? 'Show all communities' : 'Show joined communities only'}
          onPress={onToggleJoined}
          style={({ pressed }) => [
            styles.chip,
            joinedOnly && styles.chipActive,
            pressed && styles.chipPressed,
          ]}
        >
          <Text style={[styles.chipText, joinedOnly && styles.chipTextActive]}>
            Joined
          </Text>
        </Pressable>
      </View>

      <SortDropdown
        visible={sortExpanded}
        anchor={sortAnchor}
        sort={sort}
        onSelect={handleSortSelect}
        onClose={() => setSortExpanded(false)}
      />
    </View>
  );
}
