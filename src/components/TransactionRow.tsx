import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

interface TransactionRowProps {
  transaction: Transaction;
  balanceTillDate: number;
  onPress?: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  balanceTillDate,
  onPress,
}) => {
  const { currency } = useLedger();
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

  const content = (
    <>
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
        <Text style={[styles.amountText, { color: isGave ? Colors.gave : Colors.got }]}>
          {currency.symbol}
          {Number(transaction.amount).toLocaleString('en-IN')}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
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
  amountText: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 15,
  },
});
