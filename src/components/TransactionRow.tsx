import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

interface TransactionRowProps {
  transaction: Transaction;
  balanceTillDate: number;
  onDelete?: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  balanceTillDate,
  onDelete,
}) => {
  const { currency, triggerHaptic } = useLedger();
  const isGave = transaction.type === 'GAVE';
  const willGet = balanceTillDate > 0;
  const toGive = balanceTillDate < 0;
  const isSettled = balanceTillDate === 0;

  const dateObj = new Date(transaction.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.detailsCol}>
        <Text style={styles.dateText}>
          {formattedDate} · {formattedTime}
        </Text>
        <Text
          style={[
            styles.balanceText,
            willGet && { color: Colors.gave },
            toGive && { color: Colors.got },
            isSettled && { color: Colors.textSecondary },
          ]}
        >
          {isSettled
            ? 'Settled'
            : `Bal. ${currency.symbol}${Math.abs(balanceTillDate).toLocaleString('en-IN')}`}
        </Text>
        {transaction.note?.trim() ? (
          <Text style={styles.noteText} numberOfLines={2}>
            {transaction.note.trim()}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightCol}>
        <View style={styles.amountRow}>
          <Text style={[styles.amountText, { color: isGave ? Colors.gave : Colors.got }]}>
            {currency.symbol}
            {Number(transaction.amount).toLocaleString('en-IN')}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                onDelete();
              }}
              style={styles.deleteBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={13} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  dateText: {
    fontFamily: Typography.data,
    fontSize: 14,
    color: Colors.warmIvory,
  },
  balanceText: {
    fontFamily: Typography.dataRegular,
    fontSize: 12,
    marginTop: 4,
  },
  noteText: {
    fontFamily: Typography.dataRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountText: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 15,
  },
  deleteBtn: {
    padding: 2,
  },
});
