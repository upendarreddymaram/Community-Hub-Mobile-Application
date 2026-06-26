module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@shopify/flash-list|@tanstack|msw|@mswjs|rettime|until-async)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
