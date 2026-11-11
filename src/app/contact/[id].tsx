import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { TransactionRow } from '../../components/TransactionRow';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLedger } from '../../context/LedgerContext';
import { sharePaymentReminder, MissingPhoneError, PaymentReminderInput } from '../../services/paymentReminder';
import { ReminderImageCapture } from '../../components/ReminderImageCapture';

function notify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    contacts,
    transactions,
    currency,
    triggerHaptic,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<'ALL' | 'GAVE' | 'GOT'>('ALL');
  const [sharingReminder, setSharingReminder] = useState(false);
  const [captureInput, setCaptureInput] = useState<PaymentReminderInput | null>(null);
  const [captureAttempt, setCaptureAttempt] = useState(0);
  const captureWait = useRef<{
    resolve: (dataUrl: string) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const contact = contacts.find((c) => c.id === id);

  const contactTransactions = useMemo(() => {
    return transactions.filter((t) => t.contact_id === id);
  }, [transactions, id]);

  const balanceTillDateById = useMemo(() => {
    const chronological = [...contactTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const balances = new Map<string, number>();
    let running = 0;
    chronological.forEach((txn) => {
      running += txn.type === 'GAVE' ? Number(txn.amount) : -Number(txn.amount);
      balances.set(txn.id, running);
    });
    return balances;
  }, [contactTransactions]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'GAVE') return contactTransactions.filter((t) => t.type === 'GAVE');
    if (activeTab === 'GOT') return contactTransactions.filter((t) => t.type === 'GOT');
    return contactTransactions;
  }, [contactTransactions, activeTab]);

  if (!contact) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack onBack={() => router.back()} title="Contact" />
        <EmptyState
          title="Contact Not Found"
          description="The selected contact might have been deleted or removed."
          actionTitle="Go Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const net = contact.net_balance || 0;
  const isOwed = net > 0;
  const owes = net < 0;
  const isSettled = net === 0;

  const handleImportJson = () => {
    triggerHaptic();
    router.push({
      pathname: '/transaction/import',
      params: { contactId: contact.id },
    });
  };

  const captureNativeImage = (input: PaymentReminderInput) =>
    new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        captureWait.current = null;
        setCaptureInput(null);
        reject(new Error('Could not create the reminder image.'));
      }, 12000);

      captureWait.current = {
        resolve: (dataUrl) => {
          clearTimeout(timer);
          captureWait.current = null;
          setCaptureInput(null);
          resolve(dataUrl);
        },
        reject: (error) => {
          clearTimeout(timer);
          captureWait.current = null;
          setCaptureInput(null);
          reject(error);
        },
      };
      setCaptureAttempt((attempt) => attempt + 1);
      setCaptureInput(input);
    });

  const handleShareWhatsApp = async () => {
    if (!isOwed || sharingReminder) return;
    triggerHaptic();
    setSharingReminder(true);
    const reminder = {
      amount: net,
      currencySymbol: currency.symbol,
      contactPhone: contact.phone,
      senderName: user?.name || 'DueTrack',
      senderPhone: user?.phone,
    };
    try {
      const nativeImage =
        Platform.OS === 'web' ? undefined : await captureNativeImage(reminder);
      const result = await sharePaymentReminder(reminder, nativeImage);
      if (result === 'attached') {
        return;
      }
      if (result === 'copied') {
        notify(
          'Send the reminder',
          'WhatsApp is open on their chat. Paste the reminder image, then send it.',
        );
      } else if (result === 'downloaded') {
        notify(
          'Send the reminder',
          'WhatsApp is open on their chat. Attach the downloaded reminder image, then send it.',
        );
      }
    } catch (error) {
      if (error instanceof MissingPhoneError) {
        notify(
          'No phone number',
          'Add a phone number for this contact before sending a WhatsApp reminder.',
        );
      } else {
        notify('Unable to share', 'Could not share the payment reminder. Please try again.');
      }
    } finally {
      setSharingReminder(false);
    }
  };

  const handleEditContact = () => {
    router.push({
      pathname: '/contact/add',
      params: { contactId: contact.id },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Contact Summary Hero Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.balanceCaption}>
            {isOwed ? 'OWED TO YOU' : owes ? 'YOU OWE' : 'STATUS'}
          </Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>{currency.symbol}</Text>
            <Text
              style={[
                styles.heroAmount,
                isOwed && { color: Colors.gave },
                owes && { color: Colors.got },
                isSettled && { color: Colors.textSecondary },
              ]}
            >
              {Math.abs(net).toLocaleString('en-IN')}
            </Text>
          </View>
          <Text style={styles.balanceStatusSubtext}>
            {isOwed
              ? `${contact.name} will pay you`
              : owes
              ? `You will pay ${contact.name}`
              : 'All dues settled'}
          </Text>
        </View>

        {/* Breakdown bar */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCol}>
            <Text style={styles.breakdownLabel}>TOTAL GAVE</Text>
            <Text style={[styles.breakdownValue, { color: Colors.gave }]}>
              {currency.symbol}{(contact.total_gave || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownCol}>
            <Text style={styles.breakdownLabel}>TOTAL GOT</Text>
            <Text style={[styles.breakdownValue, { color: Colors.got }]}>
              {currency.symbol}{(contact.total_got || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Quick action bar */}
        <View style={styles.actionRow}>
          {isOwed ? (
            <TouchableOpacity
              style={[styles.exportPillBtn, sharingReminder && styles.pillBusy]}
              onPress={handleShareWhatsApp}
              disabled={sharingReminder}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share payment reminder on WhatsApp"
            >
              {sharingReminder ? (
                <ActivityIndicator size="small" color="#25D366" />
              ) : (
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              )}
              <Text style={styles.exportPillText}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.exportPillBtn} onPress={handleImportJson}>
            <Ionicons name="code-slash-outline" size={15} color={Colors.warmIvory} />
            <Text style={styles.exportPillText}>Import JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs for this contact: ALL / GAVE / GOT */}
      <View style={styles.tabFilterRow}>
        <TouchableOpacity
          style={[styles.tabFilter, activeTab === 'ALL' && styles.tabFilterActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab('ALL');
          }}
        >
          <Text style={[styles.tabFilterText, activeTab === 'ALL' && styles.tabFilterTextActive]}>
            All ({contactTransactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabFilter, activeTab === 'GAVE' && styles.tabFilterActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab('GAVE');
          }}
        >
          <Text style={[styles.tabFilterText, activeTab === 'GAVE' && styles.tabFilterTextActive]}>
            Gave ({contactTransactions.filter((t) => t.type === 'GAVE').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabFilter, activeTab === 'GOT' && styles.tabFilterActive]}
          onPress={() => {
            triggerHaptic();
            setActiveTab('GOT');
          }}
        >
          <Text style={[styles.tabFilterText, activeTab === 'GOT' && styles.tabFilterTextActive]}>
            Got ({contactTransactions.filter((t) => t.type === 'GOT').length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        showBack
        onBack={() => router.back()}
        title={contact.name}
        subtitle={contact.phone || undefined}
        onTitlePress={handleEditContact}
      />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rowWrapper}>
            <TransactionRow
              transaction={item}
              balanceTillDate={balanceTillDateById.get(item.id) ?? 0}
              onPress={() => {
                triggerHaptic();
                router.push({
                  pathname: '/transaction/add',
                  params: {
                    contactId: contact.id,
                    transactionId: item.id,
                  },
                });
              }}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Entries Yet"
            description="Use the buttons below to log money given or received."
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 90 + Math.max(insets.bottom, Spacing.sm) },
        ]}
      />

      {/* Signature Khatabook Dual Action Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, Spacing.sm) + Spacing.sm },
        ]}
      >
        <TouchableOpacity
          style={styles.gaveButton}
          onPress={() => {
            triggerHaptic();
            router.push({
              pathname: '/transaction/add',
              params: { contactId: contact.id, defaultType: 'GAVE' },
            });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
          <Text style={styles.bottomButtonText}>YOU GAVE {currency.symbol}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gotButton}
          onPress={() => {
            triggerHaptic();
            router.push({
              pathname: '/transaction/add',
              params: { contactId: contact.id, defaultType: 'GOT' },
            });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-down-circle" size={20} color="#FFFFFF" />
          <Text style={styles.bottomButtonText}>YOU GOT {currency.symbol}</Text>
        </TouchableOpacity>
      </View>
      <ReminderImageCapture
        input={captureInput}
        attempt={captureAttempt}
        onImage={(dataUrl) => captureWait.current?.resolve(dataUrl)}
        onError={(message) => captureWait.current?.reject(new Error(message))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.graphite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
  },
  balanceCaption: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 10,
    color: Colors.champagne,
    letterSpacing: 1.2,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  heroCurrency: {
    fontFamily: Typography.brand,
    fontSize: 22,
    color: Colors.champagneLight,
    marginRight: 4,
  },
  heroAmount: {
    fontFamily: Typography.brand,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  balanceStatusSubtext: {
    fontFamily: Typography.dataRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontFamily: Typography.uiMedium,
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 0.6,
  },
  breakdownValue: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 15,
    marginTop: 2,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  exportPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceInput,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  exportPillText: {
    fontFamily: Typography.uiMedium,
    fontSize: 12,
    color: Colors.warmIvory,
  },
  pillBusy: {
    opacity: 0.7,
  },
  tabFilterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabFilter: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabFilterActive: {
    backgroundColor: Colors.graphite,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
  },
  tabFilterText: {
    fontFamily: Typography.uiMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabFilterTextActive: {
    fontFamily: Typography.uiBold,
    color: Colors.champagneLight,
  },
  rowWrapper: {
    paddingHorizontal: Spacing.md,
  },
  listContent: {
    paddingBottom: 90,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#161616',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: Spacing.sm,
  },
  gaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gave,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    shadowColor: Colors.gave,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  gotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.got,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    shadowColor: Colors.got,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomButtonText: {
    fontFamily: Typography.uiBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
});

