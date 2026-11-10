import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';
import { useAuth } from '../../context/AuthContext';
import { formatPhone } from '../../services/auth';
import { confirmAction } from '../../utils/confirm';

export default function SettingsScreen() {
  const { triggerHaptic } = useLedger();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    triggerHaptic();
    const confirmed = await confirmAction({
      title: 'Log out',
      message: 'You will need your phone number and password to open this ledger again.',
      confirmLabel: 'Log out',
    });
    if (!confirmed) return;
    signOut().catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title="Settings" subtitle={user?.name || 'Account'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={18} color={Colors.champagne} />
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
          </View>
          <Text style={styles.accountName}>{user?.name || 'Signed in'}</Text>
          <Text style={styles.accountPhone}>
            {user?.phone ? formatPhone(user.phone) : 'Phone number unavailable'}
          </Text>
          <Text style={styles.sectionDescription}>
            Contacts and balances on this account stay separate from every other person.
          </Text>
          <CustomButton
            title="Log out"
            onPress={handleSignOut}
            icon="log-out-outline"
            variant="outline"
          />
        </View>
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
  sectionCard: {
    backgroundColor: Colors.graphite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 12,
    color: Colors.champagne,
    letterSpacing: 1.1,
  },
  accountName: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 18,
    color: Colors.warmIvory,
    marginTop: Spacing.sm,
  },
  accountPhone: {
    fontFamily: Typography.data,
    fontSize: 14,
    color: Colors.champagneLight,
    marginTop: 2,
  },
  sectionDescription: {
    fontFamily: Typography.dataRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: Spacing.md,
  },
});
