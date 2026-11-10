import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';
import { TransactionType } from '../../types';

export default function AddTransactionScreen() {
  const { contactId, defaultType } = useLocalSearchParams<{
    contactId?: string;
    defaultType?: TransactionType;
  }>();

  const { contacts, currency, addTransaction, triggerHaptic } = useLedger();

  const contact = contacts.find((c) => c.id === contactId);
  const [type, setType] = useState<TransactionType>(defaultType === 'GOT' ? 'GOT' : 'GAVE');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const handleSubmit = async () => {
    const errs: { amount?: string } = {};

    if (!contactId) {
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        contact_id: contactId,
        type,
        amount: parsedAmount,
        date: new Date().toISOString(),
        note: note.trim() || undefined,
      });

      router.replace({
        pathname: '/transaction/share',
        params: {
          contactId,
          type,
          amount: String(parsedAmount),
          note: note.trim(),
        },
      });
    } catch (e) {
      console.warn('Failed to save transaction:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGave = type === 'GAVE';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Modal Header */}
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
          <Text style={styles.modalTitle}>
            {contact
              ? isGave
                ? `Gave to ${contact.name}`
                : `Got from ${contact.name}`
              : isGave
              ? 'Record Money Given'
              : 'Record Money Received'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Khatabook Type Toggle: YOU GAVE vs YOU GOT */}
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[styles.typeOption, isGave && styles.typeOptionGaveActive]}
              onPress={() => {
                triggerHaptic();
                setType('GAVE');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={isGave ? '#FFFFFF' : Colors.textTertiary}
              />
              <Text style={[styles.typeOptionText, isGave && styles.typeOptionTextActive]}>
                YOU GAVE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeOption, !isGave && styles.typeOptionGotActive]}
              onPress={() => {
                triggerHaptic();
                setType('GOT');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={!isGave ? '#FFFFFF' : Colors.textTertiary}
              />
              <Text style={[styles.typeOptionText, !isGave && styles.typeOptionTextActive]}>
                YOU GOT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Big Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountCardCaption}>AMOUNT</Text>
            <View style={styles.bigAmountRow}>
              <Text
                style={[
                  styles.currencyBig,
                  { color: isGave ? Colors.gave : Colors.got },
                ]}
              >
                {currency.symbol}
              </Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                value={amount}
                onChangeText={(val) => {
                  setAmount(val);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                keyboardType="decimal-pad"
                autoFocus
                selectionColor={Colors.champagne}
                style={styles.bigAmountInput}
              />
            </View>
            {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
          </View>

          {/* Note / Reason Field */}
          <CustomInput
            label="Note / Purpose"
            placeholder="e.g. Dinner bill, concert ticket, rental share"
            value={note}
            onChangeText={setNote}
            leftIcon={<Ionicons name="chatbubble-outline" size={18} color={Colors.champagne} />}
          />

          <CustomButton
            title={`Confirm Entry (${isGave ? 'You Gave' : 'You Got'})`}
            onPress={handleSubmit}
            loading={isSubmitting}
            variant={isGave ? 'gave' : 'got'}
            style={styles.submitBtn}
          />
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
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    gap: 8,
  },
  typeOptionGaveActive: {
    backgroundColor: Colors.gave,
  },
  typeOptionGotActive: {
    backgroundColor: Colors.got,
  },
  typeOptionText: {
    fontFamily: Typography.uiBold,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  amountCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
    marginBottom: Spacing.md,
  },
  amountCardCaption: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 11,
    color: Colors.champagne,
    letterSpacing: 1,
  },
  bigAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 52,
  },
  currencyBig: {
    fontFamily: Typography.brand,
    fontSize: 32,
    lineHeight: 40,
    marginRight: 8,
  },
  bigAmountInput: {
    flex: 1,
    fontFamily: Typography.brand,
    fontSize: 28,
    lineHeight: 36,
    color: '#FFFFFF',
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    minHeight: 44,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
  errorText: {
    fontFamily: Typography.dataRegular,
    fontSize: 11,
    color: Colors.gave,
    marginTop: 4,
  },
});

