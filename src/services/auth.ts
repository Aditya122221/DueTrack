import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig } from './supabase';

/** Internal Auth identity only. Never shown in the UI. */
const AUTH_EMAIL_DOMAIN = 'users.duetrack.app';

export type AuthResult = { ok: true } | { ok: false; message: string };

type AuthSettings = {
  disable_signup?: boolean;
};

type AuthErrorLike = {
  message: string;
  code?: string;
};

export function normalizePhone(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, '');
  if (!compact) return null;

  let digits = compact.replace(/\D/g, '');
  if (!compact.startsWith('+') && digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (compact.startsWith('+')) {
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;
  const digits = normalized.slice(1);
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return normalized;
}

/** Maps a phone number to the hidden Auth login identity. */
export function phoneToAuthEmail(phone: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `${normalized.replace(/\D/g, '')}@${AUTH_EMAIL_DOMAIN}`;
}

export function accountFromUser(user: User): { id: string; name: string; phone: string } {
  const metadata = user.user_metadata ?? {};
  const metaPhone = typeof metadata.phone === 'string' ? metadata.phone : '';
  const metaName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  return {
    id: user.id,
    name: metaName || 'Member',
    phone: metaPhone || user.phone || '',
  };
}

export function accountFromSession(session: Session | null): { id: string; name: string; phone: string } | null {
  if (!session?.user) return null;
  return accountFromUser(session.user);
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function getAuthSettings(): Promise<AuthSettings | null> {
  try {
    const { url, anonKey } = await getSupabaseConfig();
    if (!url || !anonKey) return null;
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    if (!response.ok) return null;
    return (await response.json()) as AuthSettings;
  } catch {
    return null;
  }
}

function mapAuthError(error: AuthErrorLike): string {
  const code = error.code ?? '';
  const message = error.message || 'Something went wrong. Try again.';

  if (code === 'user_already_exists' || /already registered|already been registered|already exists/i.test(message)) {
    return 'An account with this phone number already exists. Log in instead.';
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'That phone number and password do not match.';
  }
  if (code === 'weak_password' || (/password/i.test(message) && /at least|weak|short|characters/i.test(message))) {
    return 'Use a password of at least 6 characters.';
  }
  if (/signup.*disabled|signups not allowed/i.test(message)) {
    return 'New accounts are turned off for this database.';
  }
  if (code === 'email_address_invalid' || /email address/i.test(message)) {
    return 'Could not create the account. Try again in a moment.';
  }
  if (
    code === 'phone_provider_disabled' ||
    /phone signups are disabled|phone provider is disabled|unsupported phone provider/i.test(message)
  ) {
    return 'Could not create the account. Try again in a moment.';
  }
  if (code === 'sms_send_failed' || /confirmation sms|error sending sms|sms provider/i.test(message)) {
    return 'Could not create the account. Try again in a moment.';
  }
  return message;
}

async function saveProfile(userId: string, name: string, phone: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const withPhone = await supabase.from('profiles').upsert({
    id: userId,
    full_name: name,
    phone,
    updated_at: new Date().toISOString(),
  });

  if (!withPhone.error) return;

  if (/phone/i.test(withPhone.error.message)) {
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: name,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function signUpWithPhone(input: {
  name: string;
  phone: string;
  password: string;
}): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, message: 'Database is not configured. Add the Supabase URL and key in the project .env file.' };
  }

  const phone = normalizePhone(input.phone);
  const authEmail = phoneToAuthEmail(input.phone);
  if (!phone || !authEmail) return { ok: false, message: 'Enter a valid phone number.' };

  const name = input.name.trim();
  const settings = await getAuthSettings();
  if (settings?.disable_signup) {
    return { ok: false, message: 'New accounts are turned off for this database.' };
  }

  const metadata = { full_name: name, phone };

  // Prefer native phone auth when the provider is enabled.
  const phoneSignUp = await supabase.auth.signUp({
    phone,
    password: input.password,
    options: { data: metadata },
  });

  if (!phoneSignUp.error) {
    if (phoneSignUp.data.user && (phoneSignUp.data.user.identities?.length ?? 0) === 0) {
      return { ok: false, message: 'An account with this phone number already exists. Log in instead.' };
    }
    if (phoneSignUp.data.session?.user) {
      await saveProfile(phoneSignUp.data.session.user.id, name, phone);
      return { ok: true };
    }
    const phoneSignIn = await supabase.auth.signInWithPassword({ phone, password: input.password });
    if (!phoneSignIn.error && phoneSignIn.data.session?.user) {
      await saveProfile(phoneSignIn.data.session.user.id, name, phone);
      return { ok: true };
    }
  }

  const phoneDisabled =
    phoneSignUp.error &&
    (phoneSignUp.error.code === 'phone_provider_disabled' ||
      /phone signups are disabled|phone provider is disabled|unsupported phone provider/i.test(
        phoneSignUp.error.message
      ));

  if (phoneSignUp.error && !phoneDisabled) {
    return { ok: false, message: mapAuthError(phoneSignUp.error) };
  }

  // Fallback: phone-number login identity with no OTP (auto-confirmed in the database).
  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: input.password,
    options: { data: metadata },
  });

  if (error) return { ok: false, message: mapAuthError(error) };
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { ok: false, message: 'An account with this phone number already exists. Log in instead.' };
  }
  if (data.session?.user) {
    await saveProfile(data.session.user.id, name, phone);
    return { ok: true };
  }

  const emailSignIn = await supabase.auth.signInWithPassword({ email: authEmail, password: input.password });
  if (!emailSignIn.error && emailSignIn.data.session?.user) {
    await saveProfile(emailSignIn.data.session.user.id, name, phone);
    return { ok: true };
  }

  return {
    ok: false,
    message: 'Account was created but could not be signed in. Try logging in with the same phone number and password.',
  };
}

export async function signInWithPhone(phoneInput: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, message: 'Database is not configured. Add the Supabase URL and key in the project .env file.' };
  }

  const phone = normalizePhone(phoneInput);
  const authEmail = phoneToAuthEmail(phoneInput);
  if (!phone || !authEmail) return { ok: false, message: 'Enter a valid phone number.' };

  const phoneSignIn = await supabase.auth.signInWithPassword({ phone, password });
  if (!phoneSignIn.error && phoneSignIn.data.session?.user) {
    const account = accountFromUser(phoneSignIn.data.session.user);
    await saveProfile(account.id, account.name, account.phone || phone);
    return { ok: true };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
  if (error) {
    if (
      phoneSignIn.error &&
      phoneSignIn.error.code !== 'phone_provider_disabled' &&
      !/phone provider is disabled|unsupported phone provider/i.test(phoneSignIn.error.message)
    ) {
      return { ok: false, message: mapAuthError(phoneSignIn.error) };
    }
    return { ok: false, message: mapAuthError(error) };
  }
  if (!data.session?.user) return { ok: false, message: 'Could not start a session. Try again.' };

  const account = accountFromUser(data.session.user);
  await saveProfile(account.id, account.name, account.phone || phone);
  return { ok: true };
}

export async function signOutAccount(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
