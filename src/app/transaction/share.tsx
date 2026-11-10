import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionType } from '../../types';
import {
  generateEntryMessage,
  openSmsWithMessage,
  openWhatsAppWithMessage,
} from '../../services/statement';

export default function ShareEntryScreen() {
  const { contactId, type, amount } = useLocalSearchParams<{
    contactId?: string;
    type?: TransactionType;
    amount?: string;
  }>();

  const { contacts, currency, triggerHaptic } = useLedger();
  const { user } = useAuth();

  const contact = contacts.find((c) => c.id === contactId);
  const entryType: TransactionType = type === 'GOT' ? 'GOT' : 'GAVE';
  const parsedAmount = parseFloat(amount || '0') || 0;
  const isGave = entryType === 'GAVE';

  const currencyLabel = currency.code === 'INR' ? 'Rs' : currency.symbol;

  const defaultMessage = useMemo(
    () =>
      generateEntryMessage({
        type: entryType,
        amount: parsedAmount,
        currencyLabel,
        netBalance: contact?.net_balance ?? 0,
        senderName: user?.name,
      }),
    [contact?.net_balance, currencyLabel, entryType, parsedAmount, user?.name]
  );

  const [message, setMessage] = useState(defaultMessage);
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    if (!hasEdited) {
      setMessage(defaultMessage);
    }
  }, [defaultMessage, hasEdited]);

  const dismiss = () => {
    triggerHaptic();
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.back();
    }
  };

  const handleSendWhatsApp = async () => {
    triggerHaptic();
    try {
      await openWhatsAppWithMessage(contact?.phone, message.trim());
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please make sure WhatsApp is installed and try again.');
    }
  };

  const handleSendSms = async () => {
    triggerHaptic();
    if (!contact?.phone) {
      Alert.alert('No phone number', 'This contact has no phone number saved for SMS.');
      return;
    }
    try {
      await openSmsWithMessage(contact.phone, message.trim());
    } catch {
      Alert.alert('Unable to open Messages', 'Please try again or copy the message manually.');
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
            onPress={dismiss}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={Colors.warmIvory} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notify Contact</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successBanner}>
            <View
              style={[
                styles.successIconWrap,
                { backgroundColor: isGave ? Colors.gaveLight : Colors.gotLight },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={isGave ? Colors.gave : Colors.got}
              />
            </View>
            <Text style={styles.successTitle}>Entry saved</Text>
            <Text style={styles.successSubtitle}>
              {isGave ? 'You gave' : 'You got'} {currency.symbol}
              {parsedAmount.toLocaleString('en-IN')}
              {contact ? ` · ${contact.name}` : ''}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>MESSAGE PREVIEW</Text>
          <Text style={styles.sectionHint}>
            Edit if needed, then send via Messages or WhatsApp
            {contact?.phone ? ` to ${contact.phone}` : ''}.
          </Text>

          <View style={styles.messageCard}>
            <TextInput
              value={message}
              onChangeText={(value) => {
                setHasEdited(true);
                setMessage(value);
              }}
              multiline
              textAlignVertical="top"
              selectionColor={Colors.champagne}
              style={styles.messageInput}
            />
          </View>

          <CustomButton
            title="Send via WhatsApp"
            icon="logo-whatsapp"
            onPress={handleSendWhatsApp}
            variant="got"
            style={styles.actionBtn}
          />

          <CustomButton
            title="Send via Messages"
            icon="chatbubble-ellipses-outline"
            onPress={handleSendSms}
            variant="secondary"
            style={styles.actionBtn}
            disabled={!contact?.phone}
          />

          <TouchableOpacity onPress={dismiss} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
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
  successBanner: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 20,
    color: Colors.warmIvory,
  },
  successSubtitle: {
    fontFamily: Typography.uiMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 11,
    color: Colors.champagne,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: Typography.dataRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  messageCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 180,
  },
  messageInput: {
    fontFamily: Typography.dataRegular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.warmIvory,
    minHeight: 150,
    padding: 0,
  },
  actionBtn: {
    marginBottom: Spacing.sm,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  skipText: {
    fontFamily: Typography.uiMedium,
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
