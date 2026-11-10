import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { TransactionRow } from '../../components/TransactionRow';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';
import { confirmAction } from '../../utils/confirm';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    contacts,
    transactions,
    currency,
    deleteTransaction,
    deleteContact,
    triggerHaptic,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<'ALL' | 'GAVE' | 'GOT'>('ALL');

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

  const handleDeleteContact = async () => {
    triggerHaptic();
    const confirmed = await confirmAction({
      title: 'Delete Contact',
      message: `Delete ${contact.name} and all ${contactTransactions.length} transaction records? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    const contactId = contact.id;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
    await deleteContact(contactId);
  };

  const handleDeleteTransaction = async (txnId: string) => {
    const confirmed = await confirmAction({
      title: 'Delete Entry',
      message: 'Remove this ledger entry? This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    await deleteTransaction(txnId);
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
        subtitle={`${contact.relationship}${contact.phone ? ` · ${contact.phone}` : ''}`}
        rightAction={
          <TouchableOpacity
            style={styles.moreHeaderBtn}
            onPress={handleDeleteContact}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.gave} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rowWrapper}>
            <TransactionRow
              transaction={item}
              balanceTillDate={balanceTillDateById.get(item.id) ?? 0}
              onDelete={() => handleDeleteTransaction(item.id)}
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
  moreHeaderBtn: {
    padding: Spacing.xs,
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

