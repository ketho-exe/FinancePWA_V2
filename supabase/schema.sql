create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null default 'Personal Workspace',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense', 'savings')),
  color text not null default '#C0C0C0',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  description text not null,
  amount numeric(12, 2) not null,
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, category_id, month_key)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  linked_goal_id uuid references public.savings_goals (id) on delete set null,
  name text not null,
  estimated_cost numeric(12, 2) not null,
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  amount numeric(12, 2) not null,
  billing_cycle text not null check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'annual')),
  next_run_date date not null,
  provider_name text,
  is_subscription boolean not null default false,
  is_paused boolean not null default false,
  trial_end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.allocation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  percentage numeric(5, 2) not null check (percentage >= 0 and percentage <= 100),
  category_ids uuid[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.allocation_rules enable row level security;

drop policy if exists "profiles self access" on public.profiles;
drop policy if exists "workspaces owner access" on public.workspaces;
drop policy if exists "categories owner access" on public.categories;
drop policy if exists "transactions owner access" on public.transactions;
drop policy if exists "budgets owner access" on public.budgets;
drop policy if exists "savings goals owner access" on public.savings_goals;
drop policy if exists "wishlist owner access" on public.wishlist_items;
drop policy if exists "recurring owner access" on public.recurring_transactions;
drop policy if exists "allocations owner access" on public.allocation_rules;

create or replace function public.workspace_ids_for_user(user_id uuid)
returns setof uuid
language sql
stable
as $$
  select w.id from public.workspaces w where w.owner_id = user_id
$$;

create policy "profiles self access" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "workspaces owner access" on public.workspaces
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "categories owner access" on public.categories
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "transactions owner access" on public.transactions
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "budgets owner access" on public.budgets
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "savings goals owner access" on public.savings_goals
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "wishlist owner access" on public.wishlist_items
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "recurring owner access" on public.recurring_transactions
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "allocations owner access" on public.allocation_rules
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));
