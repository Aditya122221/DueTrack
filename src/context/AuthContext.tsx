import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthAccount } from '../types';
import {
  accountFromSession,
  signInWithPhone,
  signOutAccount,
  signUpWithPhone,
  AuthResult,
} from '../services/auth';
import { getSupabase, initSupabaseClient } from '../services/supabase';

interface AuthContextType {
  user: AuthAccount | null;
  isReady: boolean;
  signUp: (input: { name: string; phone: string; password: string }) => Promise<AuthResult>;
  signIn: (phone: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;

    (async () => {
      await initSupabaseClient();
      const supabase = getSupabase();
      if (!supabase) {
        if (active) setIsReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
      setIsReady(true);
    })().catch((error) => {
      console.warn('Auth startup failed:', error);
      if (active) setIsReady(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  };

  const value = useMemo<AuthContextType>(() => {
    return {
      user: accountFromSession(session),
      isReady,
      signUp: async (input) => {
        const result = await signUpWithPhone(input);
        if (result.ok) await refreshSession();
        return result;
      },
      signIn: async (phone, password) => {
        const result = await signInWithPhone(phone, password);
        if (result.ok) await refreshSession();
        return result;
      },
      signOut: async () => {
        await signOutAccount();
        setSession(null);
      },
    };
  }, [session, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
