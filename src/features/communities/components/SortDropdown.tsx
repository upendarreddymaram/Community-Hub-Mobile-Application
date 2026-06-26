import React, { useCallback } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';
import type { CommunitySortOption } from '../../../types/community';
import { radii, spacing, typography } from '../../../theme';

export const SORT_OPTIONS: { value: CommunitySortOption; label: string }[] = [
  { value: 'members', label: 'Members' },
  { value: 'name', label: 'Name' },
  { value: 'newest', label: 'Newest' },
];

interface SortDropdownProps {
  visible: boolean;
  anchor: LayoutRectangle | null;
  sort: CommunitySortOption;
  onSelect: (value: CommunitySortOption) => void;
  onClose: () => void;
}

export function SortDropdown({
  visible,
  anchor,
  sort,
  onSelect,
  onClose,
}: SortDropdownProps) {
  const renderItem = useCallback(
    ({ item }: { item: (typeof SORT_OPTIONS)[number] }) => {
      const isSelected = sort === item.value;

      return (
        <Pressable
          accessibilityRole="menuitem"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`Sort by ${item.label}`}
          onPress={() => onSelect(item.value)}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.checkSlot}>
            {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.optionText}>{item.label}</Text>
        </Pressable>
      );
    },
    [onSelect, sort],
  );

  const keyExtractor = useCallback(
    (item: (typeof SORT_OPTIONS)[number]) => item.value,
    [],
  );

  if (!anchor) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close sort menu" />
        <View
          style={[
            styles.dropdown,
            {
              top: anchor.y + anchor.height + spacing.xs,
              left: anchor.x,
              minWidth: Math.max(anchor.width, 180),
            },
          ]}
        >
          <FlatList
            data={SORT_OPTIONS}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            accessibilityRole="menu"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#464646',
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingRight: spacing.md,
  },
  optionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionText: {
    ...typography.body,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
