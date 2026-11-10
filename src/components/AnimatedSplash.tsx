import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography } from '../constants/theme';

const { width } = Dimensions.get('window');

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
  fontsLoaded?: boolean;
}

const STATUS_MESSAGES = [
  'Initializing luxury ledger...',
  'Securing offline vault...',
  'Syncing balances...',
  'Welcome',
];

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
  isReady,
  onFinish,
  fontsLoaded = false,
}) => {
  // Stable Animated Values via useState initializer (React 19 hook safe)
  const [auraScale] = useState(() => new Animated.Value(0.6));
  const [auraOpacity] = useState(() => new Animated.Value(0));

  const [logoScale] = useState(() => new Animated.Value(0.3));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoFloat] = useState(() => new Animated.Value(0));

  const [titleOpacity] = useState(() => new Animated.Value(0));
  const [titleTranslateY] = useState(() => new Animated.Value(24));

  const [lineWidth] = useState(() => new Animated.Value(0));

  const [taglineOpacity] = useState(() => new Animated.Value(0));
  const [taglineTranslateY] = useState(() => new Animated.Value(15));

  const [progress] = useState(() => new Animated.Value(0));
  const [footerOpacity] = useState(() => new Animated.Value(0));

  const [exitOpacity] = useState(() => new Animated.Value(1));
  const [exitScale] = useState(() => new Animated.Value(1));

  const [statusText, setStatusText] = useState(STATUS_MESSAGES[0]);
  const hasTriggeredExit = useRef(false);

  useEffect(() => {
    // 1. Trigger light haptic on entry
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // ignore
    }

    // 2. Start entrance animations sequence
    Animated.parallel([
      // Aura Entrance
      Animated.timing(auraOpacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(auraScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),

      // Logo Scale & Pop
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Title reveal
      Animated.sequence([
        Animated.delay(450),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(titleTranslateY, {
            toValue: 0,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Accent divider expand
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(lineWidth, {
          toValue: 140,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),

      // Tagline reveal
      Animated.sequence([
        Animated.delay(850),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Footer reveal
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Luxury progress bar fill
      Animated.timing(progress, {
        toValue: 1,
        duration: 2100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    // 3. Ambient Idle Floating & Breathing Loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // 4. Status messages cycling
    const t1 = setTimeout(() => setStatusText(STATUS_MESSAGES[1]), 650);
    const t2 = setTimeout(() => setStatusText(STATUS_MESSAGES[2]), 1300);
    const t3 = setTimeout(() => setStatusText(STATUS_MESSAGES[3]), 1900);

    return () => {
      floatLoop.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    auraOpacity,
    auraScale,
    footerOpacity,
    lineWidth,
    logoFloat,
    logoOpacity,
    logoScale,
    progress,
    taglineOpacity,
    taglineTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  const triggerExit = useCallback(() => {
    if (hasTriggeredExit.current) return;
    hasTriggeredExit.current = true;

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // ignore
    }

    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 1.08,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [exitOpacity, exitScale, onFinish]);

  // Handle exit when ready and minimum presentation time has elapsed
  useEffect(() => {
    if (!isReady || hasTriggeredExit.current) return;

    // Allow user to appreciate the animation for at least ~2.2s
    const exitTimer = setTimeout(() => {
      triggerExit();
    }, 2200);

    return () => clearTimeout(exitTimer);
  }, [isReady, triggerExit]);

  const progressInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: exitOpacity,
          transform: [{ scale: exitScale }],
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Tap anywhere to skip if ready */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={isReady ? triggerExit : undefined}
        style={styles.touchableArea}
      >
        {/* Ambient Radial Glowing Aura Rings */}
        <Animated.View
          style={[
            styles.auraOuter,
            {
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.auraMiddle,
            {
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.auraInner,
            {
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />

        {/* Central Logo with Float & Scale */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoFloat }],
            },
          ]}
        >
          {/* Subtle Golden Glow Disc Behind Logo */}
          <View style={styles.logoBackdropGlow} />

          {/* Logo Frame */}
          <View style={styles.logoFrame}>
            <Animated.Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.brandSection,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {/* Animated Gold Expansion Line */}
          <View style={styles.dividerContainer}>
            <Animated.View style={[styles.goldLine, { width: lineWidth }]} />
            <View style={styles.dividerDiamond} />
          </View>

          {/* Tagline */}
          <Animated.View
            style={{
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            }}
          >
            <Text
              style={[
                styles.tagline,
                fontsLoaded ? { fontFamily: Typography.uiBold } : undefined,
              ]}
            >
              LUXURY LEDGER
            </Text>
            <Text
              style={[
                styles.subTagline,
                fontsLoaded ? { fontFamily: Typography.dataRegular } : undefined,
              ]}
            >
              Smart Credit & Debit Financial Vault
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Bottom Loading Progress & Footer */}
        <Animated.View style={[styles.bottomSection, { opacity: footerOpacity }]}>
          {/* Minimalist Gold Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressInterpolate }]}
            />
          </View>

          {/* Dynamic Status Text */}
          <Text
            style={[
              styles.statusText,
              fontsLoaded ? { fontFamily: Typography.dataRegular } : undefined,
            ]}
          >
            {statusText}
          </Text>

          {/* Security & Private Ledger Badge */}
          <View style={styles.securityBadge}>
            <Ionicons
              name="shield-checkmark"
              size={13}
              color={Colors.champagne}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.securityText,
                fontsLoaded ? { fontFamily: Typography.uiMedium } : undefined,
              ]}
            >
              100% PRIVATE • LOCAL-FIRST ENCRYPTION
            </Text>
          </View>

          <Text
            style={[
              styles.versionText,
              fontsLoaded ? { fontFamily: Typography.dataRegular } : undefined,
            ]}
          >
            v1.0.0
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.obsidian,
    zIndex: 99999,
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  // Ambient Glowing Aura Rings
  auraOuter: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: (width * 0.95) / 2,
    borderWidth: 1,
    borderColor: 'rgba(198, 165, 107, 0.08)',
    backgroundColor: 'rgba(198, 165, 107, 0.02)',
  },
  auraMiddle: {
    position: 'absolute',
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: (width * 0.72) / 2,
    borderWidth: 1,
    borderColor: 'rgba(198, 165, 107, 0.16)',
    backgroundColor: 'rgba(198, 165, 107, 0.04)',
  },
  auraInner: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    backgroundColor: 'rgba(198, 165, 107, 0.08)',
  },
  // Central Logo
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoBackdropGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.champagneMuted,
    shadowColor: Colors.champagne,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
  },
  logoFrame: {
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: 'rgba(41, 41, 41, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(198, 165, 107, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  logoImage: {
    width: 95,
    height: 95,
  },
  // Brand Section
  brandSection: {
    alignItems: 'center',
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 14,
    height: 10,
  },
  goldLine: {
    height: 1.5,
    backgroundColor: Colors.champagne,
    opacity: 0.6,
    borderRadius: 1,
  },
  dividerDiamond: {
    position: 'absolute',
    width: 5,
    height: 5,
    backgroundColor: Colors.champagneLight,
    transform: [{ rotate: '45deg' }],
  },
  tagline: {
    fontSize: 11,
    color: Colors.champagneLight,
    letterSpacing: 3.5,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 4,
  },
  subTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  progressTrack: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.champagne,
    borderRadius: 2,
    shadowColor: Colors.champagne,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 165, 107, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 165, 107, 0.22)',
    marginBottom: 10,
  },
  securityText: {
    fontSize: 9.5,
    color: Colors.champagneLight,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
});
