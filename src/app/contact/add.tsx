import React, { useMemo, useState } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';
import { confirmAction } from '../../utils/confirm';

export default function AddContactScreen() {
  const { contactId } = useLocalSearchParams<{ contactId?: string }>();
  const {
    contacts,
    transactions,
    addContact,
    editContact,
    deleteContact,
    triggerHaptic,
  } = useLedger();

  const existing = useMemo(
    () => (contactId ? contacts.find((c) => c.id === contactId) : undefined),
    [contactId, contacts]
  );
  const isEditing = !!existing;
  const existingTxnCount = useMemo(
    () => (existing ? transactions.filter((t) => t.contact_id === existing.id).length : 0),
    [existing, transactions]
  );

  const [name, setName] = useState(() => existing?.name ?? '');
  const [phone, setPhone] = useState(() => existing?.phone ?? '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!existing) return;
    triggerHaptic();
    const confirmed = await confirmAction({
      title: 'Delete Contact',
      message: `Delete ${existing.name} and all ${existingTxnCount} transaction records? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const id = existing.id;
      await deleteContact(id);
      router.dismissTo('/');
    } catch (err) {
      console.warn('Failed to delete contact:', err);
      setIsSubmitting(false);
    }
  };

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
      if (isEditing && existing) {
        await editContact(existing.id, {
          name: name.trim(),
          phone: trimmedPhone,
        });
        router.back();
        return;
      }

      await addContact({
        name: name.trim(),
        phone: trimmedPhone,
      });

      router.back();
    } catch (err) {
      console.warn('Failed to save contact:', err);
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
          <Text style={styles.modalTitle} numberOfLines={1}>
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </Text>
          {isEditing ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteBtn}
              disabled={isSubmitting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              title={isEditing ? 'Save Changes' : 'Save Contact to Ledger'}
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
    flex: 1,
    fontFamily: Typography.headingSemiBold,
    fontSize: 17,
    color: Colors.warmIvory,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  deleteBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
  },
  deleteBtnText: {
    fontFamily: Typography.uiBold,
    fontSize: 14,
    color: Colors.gave,
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
});
