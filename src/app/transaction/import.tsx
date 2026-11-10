import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useLedger } from '../../context/LedgerContext';
import {
  IMPORT_JSON_EXAMPLE,
  parseImportEntries,
} from '../../services/importEntries';

export default function ImportEntriesScreen() {
  const { contactId } = useLocalSearchParams<{ contactId?: string }>();
  const { contacts, addTransactions, triggerHaptic } = useLedger();

  const contact = contacts.find((c) => c.id === contactId);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    triggerHaptic();
    router.back();
  };

  const handleFillExample = () => {
    triggerHaptic();
    setJsonText(IMPORT_JSON_EXAMPLE);
    setError(undefined);
  };

  const handleImport = async () => {
    if (!contactId) {
      setError('Missing contact');
      return;
    }

    const parsed = parseImportEntries(jsonText);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    try {
      await addTransactions(
        parsed.entries.map((entry) => ({
          contact_id: contactId,
          type: entry.type,
          amount: entry.amount,
          date: entry.date,
          note: entry.note,
        }))
      );

      Alert.alert(
        'Import complete',
        `Added ${parsed.entries.length} entr${parsed.entries.length === 1 ? 'y' : 'ies'}${
          contact ? ` for ${contact.name}` : ''
        }.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      console.warn('Failed to import entries:', e);
      setError('Failed to save entries. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={Colors.warmIvory} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {contact ? `Import · ${contact.name}` : 'Import JSON'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.hint}>
            Paste one object or an array. Use gave for money you gave, get for money you
            received. reason becomes the note.
          </Text>

          <View style={styles.editorCard}>
            <TextInput
              value={jsonText}
              onChangeText={(value) => {
                setJsonText(value);
                if (error) setError(undefined);
              }}
              placeholder={IMPORT_JSON_EXAMPLE}
              placeholderTextColor={Colors.textTertiary}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
              selectionColor={Colors.champagne}
              style={styles.editor}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.exampleBtn} onPress={handleFillExample}>
            <Ionicons name="code-slash-outline" size={14} color={Colors.champagne} />
            <Text style={styles.exampleText}>Insert example</Text>
          </TouchableOpacity>

          <CustomButton
            title="Import Entries"
            icon="cloud-upload-outline"
            onPress={handleImport}
            loading={isSubmitting}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  keyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalTitle: {
    fontFamily: Typography.headingSemiBold,
    fontSize: 17,
    color: Colors.warmIvory,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  hint: {
    fontFamily: Typography.dataRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  editorCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.champagneBorder,
    padding: Spacing.md,
    minHeight: 260,
  },
  editor: {
    fontFamily: Typography.dataRegular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.warmIvory,
    minHeight: 230,
    padding: 0,
  },
  errorText: {
    fontFamily: Typography.dataRegular,
    fontSize: 12,
    color: Colors.gave,
    marginTop: Spacing.sm,
  },
  exampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  exampleText: {
    fontFamily: Typography.uiMedium,
    fontSize: 13,
    color: Colors.champagne,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
