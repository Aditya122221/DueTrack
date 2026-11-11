import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';

export default function ReportsScreen() {
  const { contacts, transactions, currency, triggerHaptic } = useLedger();

  // Top Debtors (People who owe you the most money)
  const topDebtors = useMemo(() => {
    return contacts
      .filter((c) => (c.net_balance || 0) > 0)
      .sort((a, b) => (b.net_balance || 0) - (a.net_balance || 0))
      .slice(0, 5);
  }, [contacts]);

  // Top Creditors (People you owe the most money)
  const topCreditors = useMemo(() => {
    return contacts
      .filter((c) => (c.net_balance || 0) < 0)
      .sort((a, b) => (a.net_balance || 0) - (b.net_balance || 0))
      .slice(0, 5);
  }, [contacts]);

  // Aggregate totals
  const totalGaveEver = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'GAVE')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [transactions]);

  const totalGotEver = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'GOT')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [transactions]);

  const totalTransactionsCount = transactions.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title="Analytics" subtitle="Luxury Debt & Portfolio Insights" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cumulative Volume Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>LIFETIME TRANSACTED VOLUME</Text>
          <View style={styles.volumeRow}>
            <View style={styles.volumeCol}>
              <View style={styles.volumeLabelRow}>
                <View style={[styles.dot, { backgroundColor: Colors.gave }]} />
                <Text style={styles.volumeLabel}>Total Lent (Gave)</Text>
              </View>
              <Text style={[styles.volumeValue, { color: Colors.gave }]}>
                {currency.symbol}{totalGaveEver.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.volumeCol}>
              <View style={styles.volumeLabelRow}>
                <View style={[styles.dot, { backgroundColor: Colors.got }]} />
                <Text style={styles.volumeLabel}>Total Repaid (Got)</Text>
              </View>
              <Text style={[styles.volumeValue, { color: Colors.got }]}>
                {currency.symbol}{totalGotEver.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Simple Ratio Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBarGave,
                {
                  flex: totalGaveEver || 1,
                },
              ]}
            />
            <View
              style={[
                styles.progressBarGot,
                {
                  flex: totalGotEver || 1,
                },
              ]}
            />
          </View>
        </View>

        {/* Portfolio Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Active Debtors</Text>
            <Text style={styles.statValue}>{topDebtors.length}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Active Creditors</Text>
            <Text style={styles.statValue}>{topCreditors.length}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Entries</Text>
            <Text style={styles.statValue}>{totalTransactionsCount}</Text>
          </View>
        </View>

        {/* Top Debtors List (Who owes you) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP OUTSTANDING RECEIVABLES</Text>
          <Text style={styles.sectionSubtitle}>Friends who owe you</Text>
        </View>

        {topDebtors.length > 0 ? (
          <View style={styles.listCard}>
            {topDebtors.map((c, idx) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.debtorRow,
                  idx < topDebtors.length - 1 && styles.rowDivider,
                ]}
                onPress={() => {
                  triggerHaptic();
                  router.push(`/contact/${c.id}`);
                }}
              >
                <View style={styles.leftDebtor}>
                  <Text style={styles.rankIndex}>#{idx + 1}</Text>
                  <View>
                    <Text style={styles.debtorName}>{c.name}</Text>
                    {c.phone ? <Text style={styles.debtorPhone}>{c.phone}</Text> : null}
                  </View>
                </View>

                <View style={styles.rightDebtor}>
                  <Text style={styles.debtorAmount}>
                    +{currency.symbol}{(c.net_balance || 0).toLocaleString('en-IN')}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={28} color={Colors.champagne} />
            <Text style={styles.emptyText}>No pending receivables from anyone!</Text>
          </View>
        )}

        {/* Top Creditors List (Whom you owe) */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>TOP OUTSTANDING PAYABLES</Text>
          <Text style={styles.sectionSubtitle}>Friends you owe</Text>
        </View>

        {topCreditors.length > 0 ? (
          <View style={styles.listCard}>
            {topCreditors.map((c, idx) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.debtorRow,
                  idx < topCreditors.length - 1 && styles.rowDivider,
                ]}
                onPress={() => {
                  triggerHaptic();
                  router.push(`/contact/${c.id}`);
                }}
              >
                <View style={styles.leftDebtor}>
                  <Text style={styles.rankIndex}>#{idx + 1}</Text>
                  <View>
                    <Text style={styles.debtorName}>{c.name}</Text>
                    {c.phone ? <Text style={styles.debtorPhone}>{c.phone}</Text> : null}
                  </View>
                </View>

                <View style={styles.rightDebtor}>
                  <Text style={[styles.debtorAmount, { color: Colors.got }]}>
                    -{currency.symbol}{Math.abs(c.net_balance || 0).toLocaleString('en-IN')}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="shield-checkmark-outline" size={28} color={Colors.got} />
            <Text style={styles.emptyText}>You owe money to zero people. Debt-free!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.graphite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 11,
    color: Colors.champagne,
    letterSpacing: 1.1,
    marginBottom: Spacing.sm,
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  volumeCol: {
    flex: 1,
  },
  volumeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  volumeLabel: {
    fontFamily: Typography.uiMedium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  volumeValue: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 18,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceInput,
    marginTop: Spacing.md,
  },
  progressBarGave: {
    backgroundColor: Colors.gave,
  },
  progressBarGot: {
    backgroundColor: Colors.got,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Typography.uiMedium,
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: Typography.brand,
    fontSize: 20,
    color: Colors.warmIvory,
  },
  sectionHeader: {
    marginBottom: Spacing.xs + 2,
  },
  sectionTitle: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 12,
    color: Colors.champagne,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontFamily: Typography.dataRegular,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  listCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  debtorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  leftDebtor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  rankIndex: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 13,
    color: Colors.champagne,
    width: 24,
  },
  debtorName: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 14,
    color: Colors.warmIvory,
  },
  debtorPhone: {
    fontFamily: Typography.dataRegular,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  rightDebtor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  debtorAmount: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 15,
    color: Colors.gave,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  emptyText: {
    fontFamily: Typography.data,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

