import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radii } from '../../theme';

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
}

export function AppLogo({
  size = 'md',
  style,
  containerStyle,
  rounded = true,
}: AppLogoProps) {
  const dimension = LOGO_SIZES[size];

  return (
    <View
      style={[
        rounded && styles.rounded,
        { width: dimension, height: dimension },
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
  rounded: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
});
