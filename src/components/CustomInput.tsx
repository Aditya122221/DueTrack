import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          Boolean(error) && styles.errorBorder,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={Colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={Colors.champagne}
          {...props}
          style={[styles.input, props.style]}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.uiMedium,
    fontSize: 12,
    color: Colors.champagneLight,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  focused: {
    borderColor: Colors.champagne,
    backgroundColor: '#262626',
  },
  errorBorder: {
    borderColor: Colors.gave,
  },
  input: {
    flex: 1,
    fontFamily: Typography.data,
    fontSize: 15,
    color: Colors.warmIvory,
    height: '100%',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontFamily: Typography.dataRegular,
    fontSize: 11,
    color: Colors.gave,
    marginTop: 4,
  },
});

