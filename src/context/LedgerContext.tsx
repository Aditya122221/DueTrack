import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { 
  Contact, 
  Transaction, 
  LedgerSummary, 
  CurrencyCode, 
  SupabaseConfig 
} from '../types';
import { 
  ApiService, 
  computeContactBalances, 
  computeLedgerSummary 
} from '../services/api';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testConnection, 
  initSupabaseClient 
} from '../services/supabase';
import { useAuth } from './AuthContext';
import { Currencies } from '../constants/theme';

interface LedgerContextType {
  contacts: Contact[];
  transactions: Transaction[];
  summary: LedgerSummary;
  currency: { code: CurrencyCode; symbol: string; name: string };
  supabaseConfig: SupabaseConfig;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<Contact>;
  editContact: (id: string, updates: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  addTransaction: (data: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction>;
  addTransactions: (data: Omit<Transaction, 'id' | 'created_at'>[]) => Promise<Transaction[]>;
  editTransaction: (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'created_at'>>
  ) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  settleContact: (contactId: string, currentNetBalance: number) => Promise<Transaction | null>;
  changeCurrency: (code: CurrencyCode) => Promise<void>;
  updateSupabaseCredentials: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  loadDemoData: () => Promise<void>;
  clearData: () => Promise<void>;
  triggerHaptic: (style?: Haptics.ImpactFeedbackStyle) => void;
}

const STORAGE_CURRENCY_KEY = '@duetrack_currency';

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady: isAuthReady } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('INR');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
  });

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch {
      // Ignore on unsupported platforms/web
    }
  };

  const loadInitialSettings = async () => {
    try {
      const storedCurr = await AsyncStorage.getItem(STORAGE_CURRENCY_KEY);
      if (storedCurr && Currencies[storedCurr]) {
        setCurrencyCode(storedCurr as CurrencyCode);
      }

      const { url, anonKey } = await getSupabaseConfig();
      if (url && anonKey) {
        await initSupabaseClient();
        const test = await testConnection(url, anonKey);
        setSupabaseConfig({
          url,
          anonKey,
          isConnected: test.success,
          lastChecked: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error loading initial settings:', e);
    }
  };

  const accountId = user?.id ?? null;
  const [activeAccountId, setActiveAccountId] = useState<string | null | undefined>(undefined);

  if (isAuthReady && activeAccountId !== accountId) {
    setActiveAccountId(accountId);
    setContacts([]);
    setTransactions([]);
    setIsLoading(Boolean(accountId));
  }

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rawContacts, rawTxns] = await Promise.all([
        ApiService.getContacts(),
        ApiService.getTransactions(),
      ]);

      const computedContacts = computeContactBalances(rawContacts, rawTxns);
      setContacts(computedContacts);
      setTransactions(rawTxns);
    } catch (error) {
      console.warn('Error refreshing ledger data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady || !accountId) return;

    let cancelled = false;

    (async () => {
      await loadInitialSettings();
      await ApiService.adoptLegacyData(accountId);
      await ApiService.purgeDemoData();
      if (!cancelled) await refreshData();
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, accountId, refreshData]);

  const addContact = async (data: Omit<Contact, 'id' | 'created_at'>) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const created = await ApiService.createContact(data);
    await refreshData();
    return created;
  };

  const editContact = async (id: string, updates: Partial<Contact>) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const updated = await ApiService.updateContact(id, updates);
    await refreshData();
    return updated;
  };

  const deleteContact = async (id: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    // Drop from UI immediately so the contact screen can leave cleanly.
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.contact_id !== id));
    const success = await ApiService.deleteContact(id);
    await refreshData();
    return success;
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'created_at'>) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const created = await ApiService.createTransaction(data);
    await refreshData();
    return created;
  };

  const addTransactions = async (data: Omit<Transaction, 'id' | 'created_at'>[]) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const created = await ApiService.createTransactions(data);
    await refreshData();
    return created;
  };

  const editTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'created_at'>>
  ) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await ApiService.updateTransaction(id, updates);
    await refreshData();
    return updated;
  };

  const deleteTransaction = async (id: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const success = await ApiService.deleteTransaction(id);
    await refreshData();
    return success;
  };

  const settleContact = async (contactId: string, currentNetBalance: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    const txn = await ApiService.settleContactBalance(contactId, currentNetBalance);
    await refreshData();
    return txn;
  };

  const changeCurrency = async (code: CurrencyCode) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrencyCode(code);
    await AsyncStorage.setItem(STORAGE_CURRENCY_KEY, code);
  };

  const updateSupabaseCredentials = async (url: string, key: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const test = await testConnection(url, key);
    if (test.success) {
      await saveSupabaseConfig(url, key);
      await initSupabaseClient();
      setSupabaseConfig({
        url,
        anonKey: key,
        isConnected: true,
        lastChecked: new Date().toISOString(),
      });
      await refreshData();
    } else {
      setSupabaseConfig((prev) => ({
        ...prev,
        url,
        anonKey: key,
        isConnected: false,
      }));
    }
    return test;
  };

  const loadDemoData = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    await ApiService.resetToDemoData();
    await refreshData();
  };

  const clearData = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    await ApiService.clearAll();
    setContacts([]);
    setTransactions([]);
  };

  const summary = computeLedgerSummary(contacts);
  const activeCurrency = Currencies[currencyCode] || Currencies.INR;

  return (
    <LedgerContext.Provider
      value={{
        contacts,
        transactions,
        summary,
        currency: activeCurrency as any,
        supabaseConfig,
        isLoading,
        refreshData,
        addContact,
        editContact,
        deleteContact,
        addTransaction,
        addTransactions,
        editTransaction,
        deleteTransaction,
        settleContact,
        changeCurrency,
        updateSupabaseCredentials,
        loadDemoData,
        clearData,
        triggerHaptic,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};

