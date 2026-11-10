import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface AuthScaffoldProps {
  title: string;
  subtitle: string;
  banner?: string;
  children: React.ReactNode;
  footerPrompt: string;
  footerLabel: string;
  onFooterPress: () => void;
}

export const AuthScaffold: React.FC<AuthScaffoldProps> = ({
  title,
  subtitle,
  banner,
  children,
  footerPrompt,
  footerLabel,
  onFooterPress,
}) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="DueTrack"
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {banner ? <Text style={styles.banner}>{banner}</Text> : null}

          {children}

          <View style={styles.footer}>
            <Text style={styles.footerPrompt}>{footerPrompt}</Text>
            <TouchableOpacity onPress={onFooterPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.footerLink}>{footerLabel}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontFamily: Typography.heading,
    fontSize: 26,
    color: Colors.warmIvory,
  },
  subtitle: {
    fontFamily: Typography.dataRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: Spacing.lg,
  },
  banner: {
    fontFamily: Typography.dataRegular,
    fontSize: 13,
    color: Colors.gave,
    backgroundColor: Colors.gaveLight,
    borderColor: Colors.gaveBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  footerPrompt: {
    fontFamily: Typography.dataRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontFamily: Typography.uiBold,
    fontSize: 13,
    color: Colors.champagne,
  },
});
