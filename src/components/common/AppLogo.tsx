import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { radii, spacing } from '../../theme';

const appLogo = require('../../assets/images/applogo.png');

const LOGO_SIZES = {
  sm: 40,
  md: 64,
  lg: 96,
  xl: 140,
} as const;

type AppLogoSize = keyof typeof LOGO_SIZES;

interface AppLogoProps {
  size?: AppLogoSize;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  rounded?: boolean;
  /** White card behind logo — use on dark/colored backgrounds (logo PNG has a light backdrop). */
  elevated?: boolean;
}

export function AppLogo({
  size = 'md',
  style,
  containerStyle,
  rounded = true,
  elevated = false,
}: AppLogoProps) {
  const { colors, isDark } = useTheme();
  const dimension = LOGO_SIZES[size];

  return (
    <View
      style={[
        styles.wrapper,
        rounded && styles.rounded,
        elevated && {
          backgroundColor: colors.logoBackdrop,
          borderRadius: radii.lg,
          padding: spacing.sm,
          borderWidth: 1,
          borderColor: colors.logoBorder,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 8,
          elevation: isDark ? 6 : 4,
        },
        containerStyle,
      ]}
    >
      <Image
        accessibilityLabel="Community Hub logo"
        source={appLogo}
        style={[styles.image, { width: dimension, height: dimension }, style]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rounded: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
});
