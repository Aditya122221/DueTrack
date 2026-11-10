import React, { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthScaffold } from '../../components/AuthScaffold';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { PasswordInput } from '../../components/PasswordInput';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { normalizePhone } from '../../services/auth';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!normalizePhone(phone)) nextErrors.phone = 'Enter a valid phone number';
    if (password.length < 6) nextErrors.password = 'Use at least 6 characters';
    if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await signUp({ name, phone, password });
      if (!result.ok) setFormError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Use your phone number and password. No verification code is sent."
      banner={formError || undefined}
      footerPrompt="Already have an account?"
      footerLabel="Log in"
      onFooterPress={() => router.replace('/login')}
    >
      <CustomInput
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
        }}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        leftIcon={<Ionicons name="person-outline" size={18} color={Colors.champagne} />}
      />
      <CustomInput
        label="Phone number"
        placeholder="98765 43210"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (errors.phone) setErrors((current) => ({ ...current, phone: undefined }));
        }}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        leftIcon={<Ionicons name="call-outline" size={18} color={Colors.champagne} />}
      />
      <PasswordInput
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
        }}
        error={errors.password}
        textContentType="newPassword"
      />
      <PasswordInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (errors.confirmPassword) {
            setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }
        }}
        error={errors.confirmPassword}
        placeholder="Repeat your password"
        textContentType="newPassword"
      />
      <CustomButton
        title="Create account"
        onPress={handleSubmit}
        loading={isSubmitting}
        icon="person-add-outline"
        style={{ marginTop: 8 }}
      />
    </AuthScaffold>
  );
}
