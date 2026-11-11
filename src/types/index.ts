export type TransactionType = 'GAVE' | 'GOT';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Computed fields:
  total_gave?: number;   // Amount you gave them (they owe you)
  total_got?: number;    // Amount they gave you (you owe them)
  net_balance?: number;  // total_gave - total_got (>0 means they owe you, <0 means you owe them)
  last_transaction_date?: string;
}

export interface Transaction {
  id: string;
  contact_id: string;
  type: TransactionType; // GAVE = you gave money, GOT = you received money
  amount: number;
  date: string;          // ISO string
  due_date?: string;     // ISO string for repayment due date
  note?: string;
  category?: string;
  is_settled?: boolean;
  created_at: string;
}

export interface LedgerSummary {
  totalReceivable: number; // You will get (Sum of positive balances)
  totalPayable: number;    // You will give (Sum of negative balances)
  netBalance: number;      // totalReceivable - totalPayable
  activeContactsCount: number;
  settledContactsCount: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}

export interface AuthAccount {
  id: string;
  name: string;
  phone: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'SGD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

