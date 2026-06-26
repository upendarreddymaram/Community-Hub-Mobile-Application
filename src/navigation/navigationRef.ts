import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetRootNavigation(routeName: keyof RootStackParamList): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: routeName }],
    }),
  );
}

export function resetToAuthFlow(): void {
  resetRootNavigation('Auth');
}

export function resetToMainFlow(): void {
  resetRootNavigation('Main');
}
