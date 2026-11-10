import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'gave' | 'got' | 'danger';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { triggerHaptic } = useLedger();

  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'gave':
        return styles.gave;
      case 'got':
        return styles.got;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.textPrimary;
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'gave':
      case 'got':
      case 'danger':
        return styles.textWhite;
      default:
        return styles.textPrimary;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return Colors.obsidian;
      case 'secondary':
      case 'outline':
        return Colors.champagne;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? Colors.obsidian : Colors.champagne} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <Text style={[styles.textBase, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  primary: {
    backgroundColor: Colors.champagne,
    shadowColor: Colors.champagne,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  secondary: {
    backgroundColor: Colors.graphite,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.champagne,
  },
  gave: {
    backgroundColor: Colors.gave,
  },
  got: {
    backgroundColor: Colors.got,
  },
  danger: {
    backgroundColor: 'rgba(224, 109, 83, 0.2)',
    borderWidth: 1,
    borderColor: Colors.gave,
  },
  disabled: {
    opacity: 0.45,
  },
  textBase: {
    fontFamily: Typography.uiBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  textPrimary: {
    color: Colors.obsidian,
  },
  textSecondary: {
    color: Colors.warmIvory,
  },
  textOutline: {
    color: Colors.champagne,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  icon: {
    marginRight: 8,
  },
});

