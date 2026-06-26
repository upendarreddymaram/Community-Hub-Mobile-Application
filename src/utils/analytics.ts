import type { NavigationState, PartialState } from '@react-navigation/native';

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

type AnalyticsSink = (
  kind: 'screen' | 'event',
  name: string,
  params?: AnalyticsParams,
) => void;

let sink: AnalyticsSink = (kind, name, params) => {
  if (__DEV__) {
    console.log(`[Analytics] ${kind}: ${name}`, params ?? {});
  }
};

/** Swap for Firebase Analytics, Amplitude, etc. in production builds. */
export function setAnalyticsSink(nextSink: AnalyticsSink): void {
  sink = nextSink;
}

export function trackScreen(name: string, params?: AnalyticsParams): void {
  sink('screen', name, params);
}

export function trackEvent(name: string, params?: AnalyticsParams): void {
  sink('event', name, params);
}

export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined {
  if (!state?.routes?.length) {
    return undefined;
  }

  const index = state.index ?? 0;
  const route = state.routes[index];

  if (!route) {
    return undefined;
  }

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
}
