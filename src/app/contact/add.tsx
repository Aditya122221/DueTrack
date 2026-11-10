import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';

export default function AddContactScreen() {
  const { addContact, triggerHaptic } = useLedger();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    const trimmedPhone = phone.trim();
    const digitsOnly = trimmedPhone.replace(/[^0-9]/g, '');

    if (!trimmedPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (digitsOnly.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addContact({
        name: name.trim(),
        phone: trimmedPhone,
        relationship: 'Friend',
      });

      router.back();
    } catch (err) {
      console.warn('Failed to add contact:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              router.back();
            }}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={Colors.warmIvory} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Contact</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Field */}
          <CustomInput
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.champagne} />}
          />

          {/* Phone Field */}
          <CustomInput
            label="Phone Number *"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            error={errors.phone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={Colors.champagne} />}
          />

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Save Contact to Ledger"
              onPress={handleSubmit}
              loading={isSubmitting}
              icon="checkmark-outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  keyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalTitle: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 17,
    color: Colors.warmIvory,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
});
