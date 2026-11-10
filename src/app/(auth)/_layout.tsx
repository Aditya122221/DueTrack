import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.obsidian },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
