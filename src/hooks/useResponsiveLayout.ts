import { useMemo } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';
import { spacing } from '../theme';

export const TABLET_BREAKPOINT = 768;
export const MAX_CONTENT_WIDTH = 720;

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isWide = width >= TABLET_BREAKPOINT;

    const contentContainerStyle: ViewStyle | undefined = isWide
      ? {
          alignSelf: 'center',
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          paddingHorizontal: spacing.xl,
        }
      : undefined;

    return {
      isWide,
      screenWidth: width,
      contentMaxWidth: isWide ? MAX_CONTENT_WIDTH : width,
      contentContainerStyle,
    };
  }, [width]);
}
