import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

export const NetBalanceCard: React.FC = () => {
  const { summary, currency } = useLedger();

  const isPositive = summary.netBalance > 0;
  const isNegative = summary.netBalance < 0;
  const isSettled = summary.netBalance === 0;

  const formattedNet = Math.abs(summary.netBalance).toLocaleString('en-IN');
  const formattedReceivable = summary.totalReceivable.toLocaleString('en-IN');
  const formattedPayable = summary.totalPayable.toLocaleString('en-IN');

  return (
    <View style={styles.cardContainer}>
      {/* Luxury Gold Ambient Gradient Strip */}
      <View style={styles.goldTopAccent} />

      <View style={styles.innerContent}>
        {/* Top Header & Status */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionCaption}>NET PORTFOLIO BALANCE</Text>
          <View
            style={[
              styles.statusPill,
              isPositive && styles.statusPositive,
              isNegative && styles.statusNegative,
              isSettled && styles.statusSettled,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isPositive && { color: Colors.champagneLight },
                isNegative && { color: Colors.gave },
                isSettled && { color: Colors.textSecondary },
              ]}
            >
              {isPositive ? 'Net Receivable' : isNegative ? 'Net Payable' : 'Balanced'}
            </Text>
          </View>
        </View>

        {/* Big Net Balance Display */}
        <View style={styles.balanceRow}>
          <Text style={styles.currencySymbol}>{currency.symbol}</Text>
          <Text style={styles.balanceAmount}>{formattedNet}</Text>
        </View>

        {/* Sub-cards Row: You'll Get vs You'll Give */}
        <View style={styles.splitRow}>
          {/* You'll Get (Receivable) */}
          <View style={styles.subCard}>
            <View style={styles.subCardHeader}>
              <View style={[styles.arrowCircle, { backgroundColor: Colors.gaveLight }]}>
                <Ionicons name="arrow-up-outline" size={14} color={Colors.gave} />
              </View>
              <Text style={styles.subCardLabel}>{"YOU'LL GET"}</Text>
            </View>
            <Text style={[styles.subCardValue, { color: Colors.gave }]}>
              {currency.symbol}{formattedReceivable}
            </Text>
            <Text style={styles.subCardSubtext}>
              {summary.activeContactsCount} pending debtors
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.verticalDivider} />

          {/* You'll Give (Payable) */}
          <View style={styles.subCard}>
            <View style={styles.subCardHeader}>
              <View style={[styles.arrowCircle, { backgroundColor: Colors.gotLight }]}>
                <Ionicons name="arrow-down-outline" size={14} color={Colors.got} />
              </View>
              <Text style={styles.subCardLabel}>{"YOU'LL GIVE"}</Text>
            </View>
            <Text style={[styles.subCardValue, { color: Colors.got }]}>
              {currency.symbol}{formattedPayable}
            </Text>
            <Text style={styles.subCardSubtext}>Payable to lenders</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.graphite,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
    overflow: 'hidden',
    shadowColor: Colors.champagne,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  goldTopAccent: {
    height: 3,
    backgroundColor: Colors.champagne,
    width: '100%',
  },
  innerContent: {
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionCaption: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 11,
    color: Colors.champagne,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPositive: {
    backgroundColor: Colors.champagneMuted,
    borderColor: Colors.champagneBorder,
  },
  statusNegative: {
    backgroundColor: Colors.gaveLight,
    borderColor: Colors.gaveBorder,
  },
  statusSettled: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
  statusPillText: {
    fontFamily: Typography.uiMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontFamily: Typography.brand,
    fontSize: 24,
    color: Colors.champagneLight,
    marginRight: 4,
  },
  balanceAmount: {
    fontFamily: Typography.brand,
    fontSize: 36,
    color: Colors.warmIvory,
    letterSpacing: -0.5,
  },
  splitRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subCard: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCardLabel: {
    fontFamily: Typography.uiMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  subCardValue: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 18,
    marginTop: 2,
  },
  subCardSubtext: {
    fontFamily: Typography.dataRegular,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});

