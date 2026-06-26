import { useMemo } from 'react';
import { Animated } from 'react-native';

/** Stable Animated.Value for the component lifetime (initial value captured once). */
export function useAnimatedValue(initialValue: number): Animated.Value {
  return useMemo(() => new Animated.Value(initialValue), [initialValue]);
}
