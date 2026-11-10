import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

interface ContactCardProps {
  contact: Contact;
  onPress: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onPress }) => {
  const { currency, triggerHaptic } = useLedger();

  const net = contact.net_balance || 0;
  const isOwed = net > 0;   // Friend owes user (You'll get)
  const owes = net < 0;     // User owes friend (You'll give)
  const isSettled = net === 0;

  // Generate 2 initials from contact name
  const initials = contact.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const formattedDate = contact.last_transaction_date
    ? new Date(contact.last_transaction_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'No entries';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
    >
      <View style={styles.leftSection}>
        {/* Luxury Monogram Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'DT'}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </View>

      {/* Right Section: Balance status */}
      <View style={styles.rightSection}>
        {isOwed && (
          <View style={styles.balanceCol}>
            <Text style={styles.amountReceivable}>
              {currency.symbol}{Math.abs(net).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.labelReceivable}>{"YOU'LL GET"}</Text>
          </View>
        )}

        {owes && (
          <View style={styles.balanceCol}>
            <Text style={styles.amountPayable}>
              {currency.symbol}{Math.abs(net).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.labelPayable}>{"YOU'LL GIVE"}</Text>
          </View>
        )}

        {isSettled && (
          <View style={styles.settledBadge}>
            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.settledText}>SETTLED</Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.graphite,
    borderWidth: 1.5,
    borderColor: Colors.champagneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm + 2,
  },
  avatarText: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 14,
    color: Colors.champagne,
    letterSpacing: 0.5,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 15,
    color: Colors.warmIvory,
  },
  dateText: {
    fontFamily: Typography.dataRegular,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  amountReceivable: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 15,
    color: Colors.gave,
  },
  labelReceivable: {
    fontFamily: Typography.uiBold,
    fontSize: 9,
    color: Colors.gave,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  amountPayable: {
    fontFamily: Typography.brandSemiBold,
    fontSize: 15,
    color: Colors.got,
  },
  labelPayable: {
    fontFamily: Typography.uiBold,
    fontSize: 9,
    color: Colors.got,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.full,
  },
  settledText: {
    fontFamily: Typography.uiMedium,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  chevron: {
    marginLeft: Spacing.xs + 2,
  },
});

