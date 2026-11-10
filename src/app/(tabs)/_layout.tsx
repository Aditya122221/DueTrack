import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants/theme';

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Keep at least 8px when there is no system inset (desktop / some web views)
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161616',
          borderTopColor: 'rgba(245, 241, 232, 0.08)',
          borderTopWidth: 1,
          // Include safe-area so the bar clears Android/iOS system nav buttons
          height: TAB_BAR_CONTENT_HEIGHT + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.champagne,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Typography.uiMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'pie-chart' : 'pie-chart-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={22}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
