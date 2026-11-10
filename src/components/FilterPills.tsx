import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useLedger } from '../context/LedgerContext';

export type FilterType = 'ALL' | 'YOU_GET' | 'YOU_GIVE' | 'SETTLED';

interface FilterPillsProps {
  activeFilter: FilterType;
  onSelect: (filter: FilterType) => void;
  counts: {
    all: number;
    youGet: number;
    youGive: number;
    settled: number;
  };
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  activeFilter,
  onSelect,
  counts,
}) => {
  const { triggerHaptic } = useLedger();

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Contacts', count: counts.all },
    { key: 'YOU_GET', label: "You'll Get", count: counts.youGet },
    { key: 'YOU_GIVE', label: "You'll Give", count: counts.youGive },
    { key: 'SETTLED', label: 'Settled', count: counts.settled },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.pill, isActive && styles.activePill]}
              onPress={() => {
                triggerHaptic();
                onSelect(f.key);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.activePillText]}>
                {f.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isActive ? styles.activeBadgeText : styles.inactiveBadgeText,
                  ]}
                >
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs + 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  activePill: {
    backgroundColor: Colors.champagneMuted,
    borderColor: Colors.champagne,
  },
  pillText: {
    fontFamily: Typography.uiMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activePillText: {
    color: Colors.champagneLight,
    fontFamily: Typography.uiBold,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  inactiveBadge: {
    backgroundColor: Colors.surfaceInput,
  },
  activeBadge: {
    backgroundColor: Colors.champagne,
  },
  badgeText: {
    fontFamily: Typography.uiBold,
    fontSize: 10,
  },
  inactiveBadgeText: {
    color: Colors.textSecondary,
  },
  activeBadgeText: {
    color: Colors.obsidian,
  },
});

