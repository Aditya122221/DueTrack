import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { NetBalanceCard } from '../../components/NetBalanceCard';
import { ContactCard } from '../../components/ContactCard';
import { FilterPills, FilterType } from '../../components/FilterPills';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';

export default function LedgerHomeScreen() {
  const { contacts, isLoading, refreshData, triggerHaptic } = useLedger();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  // Compute filter counts
  const counts = useMemo(() => {
    let youGet = 0;
    let youGive = 0;
    let settled = 0;

    contacts.forEach((c) => {
      const net = c.net_balance || 0;
      if (net > 0) youGet++;
      else if (net < 0) youGive++;
      else settled++;
    });

    return {
      all: contacts.length,
      youGet,
      youGive,
      settled,
    };
  }, [contacts]);

  // Filter & Search contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Search matching
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery));

      if (!matchesSearch) return false;

      // Filter matching
      const net = c.net_balance || 0;
      if (activeFilter === 'YOU_GET') return net > 0;
      if (activeFilter === 'YOU_GIVE') return net < 0;
      if (activeFilter === 'SETTLED') return net === 0;
      return true;
    });
  }, [contacts, searchQuery, activeFilter]);

  const renderHeader = () => (
    <View>
      <NetBalanceCard />

      {/* Action Strip: Add Contact */}
      <View style={styles.actionStrip}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => {
            triggerHaptic();
            router.push('/contact/add');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={16} color={Colors.obsidian} />
          <Text style={styles.primaryActionText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by friend name or phone..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={Colors.champagne}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <FilterPills
        activeFilter={activeFilter}
        onSelect={setActiveFilter}
        counts={counts}
      />

      <View style={styles.listHeaderRow}>
        <Text style={styles.listSectionTitle}>
          {activeFilter === 'ALL'
            ? 'ALL CONTACTS'
            : activeFilter === 'YOU_GET'
            ? "PENDING TO RECEIVE (YOU'LL GET)"
            : activeFilter === 'YOU_GIVE'
            ? "PENDING TO PAY (YOU'LL GIVE)"
            : 'SETTLED ACCOUNTS'}
        </Text>
        <Text style={styles.listCountText}>{filteredContacts.length} people</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardPadding}>
            <ContactCard
              contact={item}
              onPress={() => router.push(`/contact/${item.id}`)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={searchQuery ? 'search-outline' : 'people-outline'}
              title={searchQuery ? 'No contacts found' : 'No contacts yet'}
              description={
                searchQuery
                  ? `No friends matched "${searchQuery}". Try a different name or clear the search.`
                  : 'Add your friends, colleagues, or business partners to start tracking gave/got money.'
              }
              actionTitle={searchQuery ? undefined : 'Add First Contact'}
              onAction={searchQuery ? undefined : () => router.push('/contact/add')}
            />
          ) : undefined
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={Colors.champagne}
            colors={[Colors.champagne]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  cardPadding: {
    paddingHorizontal: Spacing.md,
  },
  actionStrip: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.champagne,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  primaryActionText: {
    fontFamily: Typography.uiBold,
    fontSize: 13,
    color: Colors.obsidian,
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.data,
    fontSize: 14,
    color: Colors.warmIvory,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs + 2,
  },
  listSectionTitle: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 11,
    color: Colors.champagne,
    letterSpacing: 1.1,
  },
  listCountText: {
    fontFamily: Typography.dataRegular,
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
