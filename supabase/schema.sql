-- ==============================================================================
-- DueTrack - Supabase Database Schema
-- Luxury Ledger & Debt Tracking (Khatabook Style)
--
-- Accounts sign in with a phone number and password. No OTP or confirmation.
-- The number the user types is accepted as-is; login is phone + password only.
-- Run this whole file in the Supabase SQL editor. It is safe to run again.
-- ==============================================================================

create extension if not exists "uuid-ossp";
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, supabase_auth_admin;

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  currency text default 'INR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles drop column if exists email;
alter table public.profiles enable row level security;

create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null;

drop policy if exists "Users can view their own profile." on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;

create policy "Users can view their own profile."
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ((select auth.uid()) = id);

-- 2. CONTACTS TABLE
create table if not exists public.contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  phone text,
  relationship text default 'Friend',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contacts drop column if exists email;
alter table public.contacts enable row level security;
create index if not exists contacts_user_id_idx on public.contacts (user_id);

-- True once any ledger row belongs to an account. Security definer avoids
-- RLS recursion when a policy on contacts needs to look at contacts.
create or replace function private.ledger_has_owner()
returns boolean
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  return exists (select 1 from public.contacts where user_id is not null)
      or exists (select 1 from public.transactions where user_id is not null);
end;
$$;

revoke all on function private.ledger_has_owner() from public;
grant execute on function private.ledger_has_owner() to anon, authenticated;

drop policy if exists "Users can view their own contacts." on public.contacts;
drop policy if exists "Users can insert their own contacts." on public.contacts;
drop policy if exists "Users can update their own contacts." on public.contacts;
drop policy if exists "Users can delete their own contacts." on public.contacts;
drop policy if exists "First account can read unowned contacts." on public.contacts;
drop policy if exists "First account can claim unowned contacts." on public.contacts;

create policy "Users can view their own contacts."
  on public.contacts for select
  using ((select auth.uid()) = user_id);

create policy "First account can read unowned contacts."
  on public.contacts for select
  using (
    (select auth.uid()) is not null
    and user_id is null
    and not (select private.ledger_has_owner())
  );

create policy "Users can insert their own contacts."
  on public.contacts for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own contacts."
  on public.contacts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "First account can claim unowned contacts."
  on public.contacts for update
  using (
    (select auth.uid()) is not null
    and user_id is null
    and not (select private.ledger_has_owner())
  )
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own contacts."
  on public.contacts for delete
  using ((select auth.uid()) = user_id);

-- 3. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  contact_id uuid references public.contacts on delete cascade not null,
  type text not null check (type in ('GAVE', 'GOT')),
  amount numeric(12, 2) not null check (amount > 0),
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  due_date timestamp with time zone,
  note text,
  category text,
  is_settled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_contact_id_idx on public.transactions (contact_id);
create index if not exists transactions_date_idx on public.transactions (date desc);

drop policy if exists "Users can view their own transactions." on public.transactions;
drop policy if exists "Users can insert their own transactions." on public.transactions;
drop policy if exists "Users can update their own transactions." on public.transactions;
drop policy if exists "Users can delete their own transactions." on public.transactions;
drop policy if exists "First account can read unowned transactions." on public.transactions;
drop policy if exists "First account can claim unowned transactions." on public.transactions;

create policy "Users can view their own transactions."
  on public.transactions for select
  using ((select auth.uid()) = user_id);

create policy "First account can read unowned transactions."
  on public.transactions for select
  using (
    (select auth.uid()) is not null
    and user_id is null
    and not (select private.ledger_has_owner())
  );

create policy "Users can insert their own transactions."
  on public.transactions for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.contacts
      where id = contact_id
        and user_id = (select auth.uid())
    )
  );

create policy "Users can update their own transactions."
  on public.transactions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "First account can claim unowned transactions."
  on public.transactions for update
  using (
    (select auth.uid()) is not null
    and user_id is null
    and (
      not (select private.ledger_has_owner())
      or exists (
        select 1
        from public.contacts
        where id = contact_id
          and user_id = (select auth.uid())
      )
    )
  )
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own transactions."
  on public.transactions for delete
  using ((select auth.uid()) = user_id);

-- 4. Keep a profile row for every account. Display name is copied out of
-- user metadata; authorization still uses auth.uid(), never metadata.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(coalesce(new.phone, new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accept phone/email identities immediately. No SMS or confirmation email.
create or replace function private.auto_confirm_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and btrim(new.email) <> '' and new.email_confirmed_at is null then
    new.email_confirmed_at := timezone('utc'::text, now());
  end if;
  if new.phone is not null and btrim(new.phone) <> '' and new.phone_confirmed_at is null then
    new.phone_confirmed_at := timezone('utc'::text, now());
  end if;
  return new;
end;
$$;

revoke all on function private.auto_confirm_auth_user() from public, anon, authenticated;
grant execute on function private.auto_confirm_auth_user() to supabase_auth_admin;

drop trigger if exists auto_confirm_auth_user on auth.users;
create trigger auto_confirm_auth_user
  before insert on auth.users
  for each row execute function private.auto_confirm_auth_user();

drop trigger if exists confirm_duetrack_phone_login on auth.users;
drop function if exists private.confirm_phone_login();

-- Realtime publication for instant sync
do $$
begin
  alter publication supabase_realtime add table public.contacts;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception
  when duplicate_object then null;
  when others then null;
end $$;
