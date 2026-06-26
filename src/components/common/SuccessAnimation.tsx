import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';
import { useAnimatedValue } from '../../utils/animatedValue';
import { spacing, typography } from '../../theme';

interface SuccessAnimationProps {
  title: string;
  subtitle?: string;
  onComplete: () => void;
  durationMs?: number;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      zIndex: 10,
    },
    iconStack: {
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    ripple: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: colors.success,
    },
    circle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.successBackground,
      borderWidth: 3,
      borderColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      fontSize: 42,
      fontWeight: '700',
      color: colors.success,
      lineHeight: 46,
    },
    title: {
      ...typography.title,
      fontSize: 24,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    dotRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  });
}

export function SuccessAnimation({
  title,
  subtitle,
  onComplete,
  durationMs = 2000,
}: SuccessAnimationProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const circleScale = useAnimatedValue(0);
  const checkScale = useAnimatedValue(0);
  const rippleScale = useAnimatedValue(0.6);
  const rippleOpacity = useAnimatedValue(0.8);
  const contentOpacity = useAnimatedValue(0);
  const contentTranslateY = useAnimatedValue(16);
  const dot1 = useAnimatedValue(0.3);
  const dot2 = useAnimatedValue(0.3);
  const dot3 = useAnimatedValue(0.3);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const entrance = Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.6,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(contentTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    entrance.start();
    const dotAnimation = Animated.parallel([
      pulse(dot1, 0),
      pulse(dot2, 160),
      pulse(dot3, 320),
    ]);
    dotAnimation.start();

    const timer = setTimeout(() => onCompleteRef.current(), durationMs);

    return () => {
      clearTimeout(timer);
      entrance.stop();
      dotAnimation.stop();
    };
  }, [
    checkScale,
    circleScale,
    contentOpacity,
    contentTranslateY,
    dot1,
    dot2,
    dot3,
    durationMs,
    rippleOpacity,
    rippleScale,
  ]);

  return (
    <View style={styles.overlay} accessibilityLiveRegion="polite">
      <View style={styles.iconStack}>
        <Animated.View
          style={[
            styles.ripple,
            {
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        />
        <Animated.View style={[styles.circle, { transform: [{ scale: circleScale }] }]}>
          <Animated.Text
            style={[styles.checkmark, { transform: [{ scale: checkScale }] }]}
          >
            ✓
          </Animated.Text>
        </Animated.View>
      </View>

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
          alignItems: 'center',
        }}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.dotRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </Animated.View>
    </View>
  );
}
