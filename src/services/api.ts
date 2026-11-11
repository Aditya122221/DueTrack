import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId } from './auth';
import { getSupabase } from './supabase';
import { Contact, Transaction, LedgerSummary } from '../types';

const LEGACY_CONTACTS_KEY = '@duetrack_local_contacts';
const LEGACY_TRANSACTIONS_KEY = '@duetrack_local_transactions';
const LEGACY_OWNER_KEY = '@duetrack_legacy_owner';

const contactsKey = (userId: string) => `@duetrack_local_contacts_${userId}`;
const transactionsKey = (userId: string) => `@duetrack_local_transactions_${userId}`;

// Generate UUID fallback for offline / mock
const generateId = () => {
  return 'dt_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Demo / Test Data identifiers for automatic purging
const DEMO_CONTACT_IDS = new Set(['c1', 'c2', 'c3', 'c4']);
const DEMO_CONTACT_NAMES = new Set([
  'Alexander Wright',
  'Sophia Laurent',
  'Vikram Malhotra',
  'Elena Rostova',
]);
const DEMO_TXN_IDS = new Set(['t1', 't2', 't3', 't4', 't5', 't6']);

export const isDemoContact = (contact: { id?: string; name?: string }): boolean => {
  if (!contact) return false;
  if (contact.id && DEMO_CONTACT_IDS.has(contact.id)) return true;
  if (contact.name && DEMO_CONTACT_NAMES.has(contact.name)) return true;
  return false;
};

export const isDemoTransaction = (txn: { id?: string; contact_id?: string; note?: string }): boolean => {
  if (!txn) return false;
  if (txn.id && DEMO_TXN_IDS.has(txn.id)) return true;
  if (txn.contact_id && DEMO_CONTACT_IDS.has(txn.contact_id)) return true;
  if (
    txn.note &&
    (txn.note.includes('watch auction bid') ||
      txn.note.includes('Italian marble selection') ||
      txn.note.includes('dining club bill settlement') ||
      txn.note.includes('Suite booking share') ||
      txn.note.includes('Partial repayment') ||
      txn.note.includes('Reimbursed in full'))
  ) {
    return true;
  }
  return false;
};

// Helper to calculate totals for contacts
export const computeContactBalances = (
  contacts: Contact[],
  transactions: Transaction[]
): Contact[] => {
  return contacts.map((contact) => {
    const contactTxns = transactions.filter((t) => t.contact_id === contact.id);
    let gave = 0;
    let got = 0;
    let lastDate: string | undefined = undefined;

    contactTxns.forEach((txn) => {
      const amt = Number(txn.amount) || 0;
      if (txn.type === 'GAVE') {
        gave += amt;
      } else {
        got += amt;
      }
      if (!lastDate || new Date(txn.date) > new Date(lastDate)) {
        lastDate = txn.date;
      }
    });

    return {
      ...contact,
      total_gave: gave,
      total_got: got,
      net_balance: gave - got,
      last_transaction_date: lastDate,
    };
  });
};

export const computeLedgerSummary = (contactsWithBalances: Contact[]): LedgerSummary => {
  let totalReceivable = 0;
  let totalPayable = 0;
  let settledCount = 0;
  let activeCount = 0;

  contactsWithBalances.forEach((c) => {
    const net = c.net_balance || 0;
    if (net > 0) {
      totalReceivable += net;
      activeCount++;
    } else if (net < 0) {
      totalPayable += Math.abs(net);
      activeCount++;
    } else {
      settledCount++;
    }
  });

  return {
    totalReceivable,
    totalPayable,
    netBalance: totalReceivable - totalPayable,
    activeContactsCount: activeCount,
    settledContactsCount: settledCount,
  };
};

export const ApiService = {
  // Give pre-login rows on this device to the first account that signs in.
  async adoptLegacyData(userId: string): Promise<void> {
    try {
      const flag = await AsyncStorage.getItem(LEGACY_OWNER_KEY);
      if (!flag) {
        const [legacyContacts, legacyTxns, scopedContacts, scopedTxns] = await Promise.all([
          AsyncStorage.getItem(LEGACY_CONTACTS_KEY),
          AsyncStorage.getItem(LEGACY_TRANSACTIONS_KEY),
          AsyncStorage.getItem(contactsKey(userId)),
          AsyncStorage.getItem(transactionsKey(userId)),
        ]);
        if (legacyContacts && !scopedContacts) {
          await AsyncStorage.setItem(contactsKey(userId), legacyContacts);
        }
        if (legacyTxns && !scopedTxns) {
          await AsyncStorage.setItem(transactionsKey(userId), legacyTxns);
        }
        await AsyncStorage.multiRemove([LEGACY_CONTACTS_KEY, LEGACY_TRANSACTIONS_KEY]);
        await AsyncStorage.setItem(LEGACY_OWNER_KEY, userId);
      }

      if ((flag ?? userId) !== userId) return;

      const supabase = getSupabase();
      if (!supabase) return;
      await supabase
        .from('contacts')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .is('user_id', null);
      await supabase.from('transactions').update({ user_id: userId }).is('user_id', null);
    } catch (error) {
      console.warn('Could not adopt existing ledger rows:', error);
    }
  },

  // Load Contacts
  async getContacts(): Promise<Contact[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (!error && data) {
          // Filter out any demo data
          const cleaned = data.filter((c: Contact) => !isDemoContact(c));
          // Sync with local cache
          await AsyncStorage.setItem(contactsKey(userId), JSON.stringify(cleaned));
          return cleaned;
        }
      } catch (err) {
        console.warn('Supabase getContacts error, falling back to local cache:', err);
      }
    }

    // Local AsyncStorage fallback
    const local = await AsyncStorage.getItem(contactsKey(userId));
    if (local) {
      const parsed: Contact[] = JSON.parse(local);
      const cleaned = parsed.filter((c: Contact) => !isDemoContact(c));
      if (cleaned.length !== parsed.length) {
        await AsyncStorage.setItem(contactsKey(userId), JSON.stringify(cleaned));
      }
      return cleaned;
    }

    // Default initialization is empty array for real data
    await AsyncStorage.setItem(contactsKey(userId), JSON.stringify([]));
    return [];
  },

  // Save/Create Contact
  async createContact(contact: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
    const newContact: Contact = {
      id: generateId(),
      name: contact.name.trim(),
      phone: contact.phone?.trim(),
      notes: contact.notes?.trim(),
      created_at: new Date().toISOString(),
    };

    const userId = await getCurrentUserId();
    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert([
            {
              user_id: userId,
              name: newContact.name,
              phone: newContact.phone,
              notes: newContact.notes,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newContact.id = data.id;
          newContact.created_at = data.created_at;
        }
      } catch (err) {
        console.warn('Supabase createContact error:', err);
      }
    }

    // Always update local cache
    const current = await this.getContacts();
    const updated = [newContact, ...current.filter((contact) => contact.id !== newContact.id)];
    const ownerId = userId ?? (await getCurrentUserId());
    if (ownerId) {
      await AsyncStorage.setItem(contactsKey(ownerId), JSON.stringify(updated));
    }
    return newContact;
  },

  // Update Contact
  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const userId = await getCurrentUserId();
    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        await supabase
          .from('contacts')
          .update({
            name: updates.name,
            phone: updates.phone,
            notes: updates.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase updateContact error:', err);
      }
    }

    const contacts = await this.getContacts();
    let updatedContact: Contact | null = null;
    const nextList = contacts.map((c) => {
      if (c.id === id) {
        updatedContact = { ...c, ...updates, updated_at: new Date().toISOString() };
        return updatedContact;
      }
      return c;
    });

    if (userId) {
      await AsyncStorage.setItem(contactsKey(userId), JSON.stringify(nextList));
    }
    return updatedContact;
  },

  // Delete Contact
  async deleteContact(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const { error: txnError } = await supabase
          .from('transactions')
          .delete()
          .eq('contact_id', id)
          .eq('user_id', userId);
        if (txnError) {
          console.warn('Supabase delete contact transactions error:', txnError.message);
        }

        const { error: contactError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (contactError) {
          console.warn('Supabase deleteContact error:', contactError.message);
        }
      } catch (err) {
        console.warn('Supabase deleteContact error:', err);
      }
    }

    // Always clear local cache for this contact + their entries
    if (userId) {
      const contactsLocal = await AsyncStorage.getItem(contactsKey(userId));
      if (contactsLocal) {
        const contacts: Contact[] = JSON.parse(contactsLocal);
        await AsyncStorage.setItem(
          contactsKey(userId),
          JSON.stringify(contacts.filter((c) => c.id !== id))
        );
      }

      const txnsLocal = await AsyncStorage.getItem(transactionsKey(userId));
      if (txnsLocal) {
        const txns: Transaction[] = JSON.parse(txnsLocal);
        await AsyncStorage.setItem(
          transactionsKey(userId),
          JSON.stringify(txns.filter((t) => t.contact_id !== id))
        );
      }
    }

    return true;
  },

  // Load Transactions
  async getTransactions(contactId?: string): Promise<Transaction[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        if (contactId) {
          query = query.eq('contact_id', contactId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const cleaned = data.filter((t: Transaction) => !isDemoTransaction(t));
          if (!contactId) {
            await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify(cleaned));
          }
          return cleaned;
        }
      } catch (err) {
        console.warn('Supabase getTransactions error, falling back to local cache:', err);
      }
    }

    const local = await AsyncStorage.getItem(transactionsKey(userId));
    let list: Transaction[] = [];
    if (local) {
      const parsed: Transaction[] = JSON.parse(local);
      list = parsed.filter((t: Transaction) => !isDemoTransaction(t));
      if (list.length !== parsed.length && !contactId) {
        await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify(list));
      }
    } else {
      await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify([]));
    }

    if (contactId) {
      return list.filter((t) => t.contact_id === contactId);
    }
    return list;
  },

  // Create Transaction (Gave or Got)
  async createTransaction(
    txn: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<Transaction> {
    const created = await this.createTransactions([txn]);
    if (!created[0]) {
      throw new Error('Failed to create transaction');
    }
    return created[0];
  },

  // Create multiple transactions in one pass
  async createTransactions(
    txns: Omit<Transaction, 'id' | 'created_at'>[]
  ): Promise<Transaction[]> {
    if (txns.length === 0) return [];

    const userId = await getCurrentUserId();
    const now = new Date().toISOString();
    const newTxns: Transaction[] = txns.map((txn) => ({
      ...txn,
      id: generateId(),
      amount: Number(txn.amount),
      created_at: now,
    }));

    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert(
            newTxns.map((txn) => ({
              user_id: userId,
              contact_id: txn.contact_id,
              type: txn.type,
              amount: txn.amount,
              date: txn.date,
              due_date: txn.due_date || null,
              note: txn.note || null,
              category: txn.category || null,
              is_settled: !!txn.is_settled,
            }))
          )
          .select();

        if (!error && data && data.length > 0) {
          data.forEach((row, index) => {
            if (newTxns[index]) {
              newTxns[index].id = row.id;
              newTxns[index].created_at = row.created_at;
            }
          });
        }
      } catch (err) {
        console.warn('Supabase createTransactions error:', err);
      }
    }

    const allTxns = await this.getTransactions();
    const createdIds = new Set(newTxns.map((txn) => txn.id));
    const updated = [...newTxns, ...allTxns.filter((txn) => !createdIds.has(txn.id))];
    const ownerId = userId ?? (await getCurrentUserId());
    if (ownerId) {
      await AsyncStorage.setItem(transactionsKey(ownerId), JSON.stringify(updated));
    }
    return newTxns;
  },

  // Update Transaction
  async updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'created_at'>>
  ): Promise<Transaction | null> {
    const userId = await getCurrentUserId();
    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.contact_id !== undefined) payload.contact_id = updates.contact_id;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.amount !== undefined) payload.amount = Number(updates.amount);
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.due_date !== undefined) payload.due_date = updates.due_date || null;
        if (updates.note !== undefined) payload.note = updates.note || null;
        if (updates.category !== undefined) payload.category = updates.category || null;
        if (updates.is_settled !== undefined) payload.is_settled = !!updates.is_settled;

        await supabase
          .from('transactions')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase updateTransaction error:', err);
      }
    }

    const allTxns = await this.getTransactions();
    let updatedTxn: Transaction | null = null;
    const nextList = allTxns.map((t) => {
      if (t.id !== id) return t;
      updatedTxn = {
        ...t,
        ...updates,
        amount: updates.amount !== undefined ? Number(updates.amount) : t.amount,
      };
      return updatedTxn;
    });

    if (userId) {
      await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify(nextList));
    }
    return updatedTxn;
  },

  // Delete Transaction
  async deleteTransaction(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase deleteTransaction error:', err);
      }
    }

    const allTxns = await this.getTransactions();
    const filtered = allTxns.filter((t) => t.id !== id);
    if (userId) {
      await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify(filtered));
    }
    return true;
  },

  // Settle Outstanding Balance in 1-Click
  async settleContactBalance(
    contactId: string,
    currentNetBalance: number,
    note?: string
  ): Promise<Transaction | null> {
    if (Math.abs(currentNetBalance) < 0.01) return null;

    // If net_balance > 0 (they owe you), you record a 'GOT' of that amount.
    // If net_balance < 0 (you owe them), you record a 'GAVE' of that amount.
    const settleType = currentNetBalance > 0 ? 'GOT' : 'GAVE';
    const amount = Math.abs(currentNetBalance);

    return this.createTransaction({
      contact_id: contactId,
      type: settleType,
      amount,
      date: new Date().toISOString(),
      note: note || 'Settled full balance',
      is_settled: true,
    });
  },

  // Purge any residual demo records from local cache & Supabase
  async purgeDemoData(): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        const localContacts = await AsyncStorage.getItem(contactsKey(userId));
        if (localContacts) {
          const parsed: Contact[] = JSON.parse(localContacts);
          const filtered = parsed.filter((c) => !isDemoContact(c));
          await AsyncStorage.setItem(contactsKey(userId), JSON.stringify(filtered));
        } else {
          await AsyncStorage.setItem(contactsKey(userId), JSON.stringify([]));
        }

        const localTxns = await AsyncStorage.getItem(transactionsKey(userId));
        if (localTxns) {
          const parsed: Transaction[] = JSON.parse(localTxns);
          const filtered = parsed.filter((t) => !isDemoTransaction(t));
          await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify(filtered));
        } else {
          await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify([]));
        }
      }

      const supabase = getSupabase();
      if (supabase && userId) {
        try {
          await supabase
            .from('transactions')
            .delete()
            .eq('user_id', userId)
            .in('id', Array.from(DEMO_TXN_IDS));
          await supabase
            .from('contacts')
            .delete()
            .eq('user_id', userId)
            .in('id', Array.from(DEMO_CONTACT_IDS));
          await supabase
            .from('contacts')
            .delete()
            .eq('user_id', userId)
            .in('name', Array.from(DEMO_CONTACT_NAMES));
        } catch {
          // Ignore offline / schema error
        }
      }
    } catch (e) {
      console.warn('Error purging demo data:', e);
    }
  },

  // Reset demo data - Disabled to keep system clean for real data
  async resetToDemoData() {
    await this.clearAll();
    return { contacts: [], transactions: [] };
  },

  // Clear all local & cloud records
  async clearAll() {
    const userId = await getCurrentUserId();
    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        await supabase.from('transactions').delete().eq('user_id', userId);
        await supabase.from('contacts').delete().eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase clearAll error:', err);
      }
    }
    if (userId) {
      await AsyncStorage.setItem(contactsKey(userId), JSON.stringify([]));
      await AsyncStorage.setItem(transactionsKey(userId), JSON.stringify([]));
    }
  },
};

