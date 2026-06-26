import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CommunityDetailScreen,
  CommunityListScreen,
} from '../features/communities';
import { CreatePostScreen } from '../features/posts';
import { ProfileScreen } from '../features/auth';
import type { MainStackParamList } from '../types/navigation';
import { useTheme } from '../providers/ThemeProvider';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="CommunityList"
        component={CommunityListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CommunityDetail"
        component={CommunityDetailScreen}
        options={{ title: 'Community' }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'New Post' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Account' }}
      />
    </Stack.Navigator>
  );
}
