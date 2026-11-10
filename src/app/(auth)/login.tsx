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

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextErrors: { phone?: string; password?: string } = {};
    if (!normalizePhone(phone)) {
      nextErrors.phone = 'Enter a valid phone number';
    }
    if (!password) {
      nextErrors.password = 'Password is required';
    }
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await signIn(phone, password);
      if (!result.ok) setFormError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Log in with your phone number and password. No verification code needed."
      banner={formError || undefined}
      footerPrompt="New here?"
      footerLabel="Create an account"
      onFooterPress={() => router.push('/signup')}
    >
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
        placeholder="Your password"
      />
      <CustomButton
        title="Log in"
        onPress={handleSubmit}
        loading={isSubmitting}
        icon="log-in-outline"
        style={{ marginTop: 8 }}
      />
    </AuthScaffold>
  );
}
