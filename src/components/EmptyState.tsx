import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { CustomButton } from './CustomButton';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'wallet-outline',
  title,
  description,
  actionTitle,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={Colors.champagne} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <CustomButton
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.graphite,
    borderWidth: 1.5,
    borderColor: Colors.champagneBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 17,
    color: Colors.warmIvory,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Typography.dataRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    minWidth: 160,
  },
});

