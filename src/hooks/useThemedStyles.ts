import { useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

export function useThemedStyles<T>(create: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => create(colors), [colors, create]);
}
