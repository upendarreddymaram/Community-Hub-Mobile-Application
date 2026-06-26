/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/providers/AppProviders', () => ({
  AppProviders: () => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text>Community Hub</Text>
      </View>
    );
  },
}));

test('renders app root without crashing', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});
