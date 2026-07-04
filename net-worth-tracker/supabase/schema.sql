-- Net Worth Tracker schema for Supabase.
-- Run this in the Supabase SQL editor (or `supabase db push` with this file
-- as a migration) after creating a new project.

create extension if not exists "pgcrypto";

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('asset', 'liability')),
  category text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null,
  total_assets numeric not null,
  total_liabilities numeric not null,
  net_worth numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create table if not exists cash_flow_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  description text not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on accounts (user_id);
create index if not exists net_worth_snapshots_user_id_idx on net_worth_snapshots (user_id);
create index if not exists cash_flow_entries_user_id_idx on cash_flow_entries (user_id);

alter table accounts enable row level security;
alter table net_worth_snapshots enable row level security;
alter table cash_flow_entries enable row level security;

create policy "Users manage their own accounts"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own snapshots"
  on net_worth_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own cash flow entries"
  on cash_flow_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
