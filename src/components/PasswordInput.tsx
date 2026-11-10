import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from './CustomInput';
import { Colors } from '../constants/theme';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  textContentType?: 'password' | 'newPassword';
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder = 'At least 6 characters',
  textContentType = 'password',
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <CustomInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      error={error}
      placeholder={placeholder}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={textContentType}
      leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.champagne} />}
      rightIcon={
        <TouchableOpacity
          onPress={() => setVisible((current) => !current)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      }
    />
  );
};
