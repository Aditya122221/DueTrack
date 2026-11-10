import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LedgerProvider } from '../context/LedgerContext';
import { Colors } from '../constants/theme';
import { AnimatedSplash } from '../components/AnimatedSplash';

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LedgerProvider>
          <RootShell />
        </LedgerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootShell() {
  const { user, isReady } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide native splash screen so AnimatedSplash takes over smoothly
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  const appReady = fontsLoaded && isReady;

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.rootContainer}>
        {appReady ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.obsidian },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Protected guard={!!user} redirectTo="/login">
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="contact/[id]"
                options={{
                  presentation: 'card',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="contact/add"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="transaction/add"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="transaction/share"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="transaction/import"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!user} redirectTo="/">
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack>
        ) : (
          <View style={styles.fallbackBackground} />
        )}

        {isSplashVisible && (
          <AnimatedSplash
            isReady={appReady}
            fontsLoaded={fontsLoaded}
            onFinish={() => setIsSplashVisible(false)}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  fallbackBackground: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
});
