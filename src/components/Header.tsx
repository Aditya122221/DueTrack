import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { triggerHaptic } = useLedger();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic();
              onBack?.();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.warmIvory} />
          </TouchableOpacity>
        )}
        <View>
          {title ? (
            <Text style={styles.customTitle}>{title}</Text>
          ) : (
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="DueTrack"
            />
          )}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {rightAction ? <View style={styles.rightRow}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.obsidian,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  brandLogo: {
    width: 44,
    height: 44,
  },
  customTitle: {
    fontFamily: Typography.heading,
    fontSize: 20,
    color: Colors.warmIvory,
  },
  subtitle: {
    fontFamily: Typography.dataRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
