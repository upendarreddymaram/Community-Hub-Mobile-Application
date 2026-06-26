import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

function resolveIsOnline(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    void NetInfo.fetch().then((state) => {
      if (!mounted) {
        return;
      }
      setIsOnline(resolveIsOnline(state));
      setIsInitialized(true);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(resolveIsOnline(state));
      setIsInitialized(true);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { isOnline, isInitialized };
}
