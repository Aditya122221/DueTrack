import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_STORAGE_URL_KEY = '@duetrack_supabase_url';
const SUPABASE_STORAGE_ANON_KEY = '@duetrack_supabase_anon_key';

// Default / fallback placeholder (can be configured via app settings or env)
let currentUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
let currentAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = async () => {
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

  try {
    const storedUrl = await AsyncStorage.getItem(SUPABASE_STORAGE_URL_KEY);
    const storedKey = await AsyncStorage.getItem(SUPABASE_STORAGE_ANON_KEY);
    return {
      url: envUrl || storedUrl || currentUrl,
      anonKey: envKey || storedKey || currentAnonKey,
    };
  } catch {
    return { url: envUrl || currentUrl, anonKey: envKey || currentAnonKey };
  }
};

export const saveSupabaseConfig = async (url: string, anonKey: string) => {
  currentUrl = url.trim();
  currentAnonKey = anonKey.trim();
  await AsyncStorage.setItem(SUPABASE_STORAGE_URL_KEY, currentUrl);
  await AsyncStorage.setItem(SUPABASE_STORAGE_ANON_KEY, currentAnonKey);
  supabaseInstance = null; // Reset so next getClient reinitializes
};

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const url = (currentUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (currentAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!url || !anonKey) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
};

export const initSupabaseClient = async () => {
  const { url, anonKey } = await getSupabaseConfig();
  if (url && anonKey) {
    currentUrl = url;
    currentAnonKey = anonKey;
    return getSupabase();
  }
  return null;
};

export const testConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }
    const testClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { error } = await testClient.from('contacts').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      // Check if table missing
      if (error.message.includes('relation "public.contacts" does not exist')) {
        return { 
          success: false, 
          message: 'Connected to Supabase, but "contacts" table is missing! Please execute schema.sql in Supabase SQL Editor.' 
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Connection established successfully!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
};

