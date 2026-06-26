jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
  })),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, bottom: 0, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const Context = React.createContext({ insets: inset, frame });

  return {
    SafeAreaInsetsContext: Context,
    SafeAreaFrameContext: React.createContext(frame),
    SafeAreaProvider: ({ children }) =>
      React.createElement(
        Context.Provider,
        { value: { insets: inset, frame } },
        children,
      ),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: React.forwardRef((props, ref) =>
      React.createElement(FlatList, { ...props, ref }),
    ),
  };
});
