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
  currency text not null default 'GBP',
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('bank', 'credit_card', 'cash', 'loan', 'savings', 'investment')),
  institution text,
  currency text not null default 'GBP',
  opening_balance numeric(12, 2) not null default 0,
  current_balance numeric(12, 2) not null default 0,
  masked_reference text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense', 'savings')),
  color text not null default '#C0C0C0',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  goal_type text not null default 'savings' check (goal_type in ('savings', 'debt_payoff')),
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
  linked_account_id uuid references public.accounts (id) on delete set null,
  name text not null,
  amount numeric(12, 2) not null,
  billing_cycle text not null check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'annual')),
  next_run_date date not null,
  provider_name text,
  is_subscription boolean not null default false,
  is_bill boolean not null default false,
  is_paused boolean not null default false,
  autopost_enabled boolean not null default false,
  trial_end_date date,
  last_paid_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  recurring_transaction_id uuid references public.recurring_transactions (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  description text not null,
  amount numeric(12, 2) not null,
  transaction_date date not null,
  source text not null default 'manual' check (source in ('manual', 'salary_auto', 'bill_payment')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  amount numeric(12, 2) not null,
  rollover_enabled boolean not null default false,
  warning_threshold numeric(5, 2) not null default 85,
  created_at timestamptz not null default now(),
  unique (workspace_id, category_id, month_key)
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

create table if not exists public.salary_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  country text not null default 'UK',
  tax_region text not null default 'england_wales_ni' check (tax_region in ('england_wales_ni', 'scotland')),
  annual_gross_salary numeric(12, 2) not null,
  tax_code text not null default '1257L',
  pay_frequency text not null check (pay_frequency in ('weekly', 'biweekly', 'four_weekly', 'monthly')),
  pay_date_rule text not null,
  pension_contribution numeric(5, 2),
  student_loan_plan text,
  postgraduate_loan boolean not null default false,
  effective_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('bill_due', 'budget_alert', 'large_transaction', 'salary')),
  title text not null,
  body text not null,
  dedupe_key text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, dedupe_key)
);

create table if not exists public.transaction_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  color text not null default '#94A3B8',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.transaction_tag_map (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  tag_id uuid not null references public.transaction_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (transaction_id, tag_id)
);

create table if not exists public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_backups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  label text not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  source_name text not null,
  status text not null default 'preview' check (status in ('preview', 'validated', 'committed', 'failed')),
  file_name text,
  row_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  import_job_id uuid not null references public.import_jobs (id) on delete cascade,
  raw_json jsonb not null,
  normalized_json jsonb,
  status text not null default 'preview' check (status in ('preview', 'valid', 'duplicate', 'error', 'committed')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.workspace_ids_for_user(user_id uuid)
returns setof uuid
language sql
stable
as $$
  select w.id from public.workspaces w where w.owner_id = user_id
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.savings_goals enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.allocation_rules enable row level security;
alter table public.salary_profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.transaction_tag_map enable row level security;
alter table public.transaction_attachments enable row level security;
alter table public.workspace_backups enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.audit_history enable row level security;

drop policy if exists "profiles self access" on public.profiles;
drop policy if exists "workspaces owner access" on public.workspaces;
drop policy if exists "accounts owner access" on public.accounts;
drop policy if exists "categories owner access" on public.categories;
drop policy if exists "savings goals owner access" on public.savings_goals;
drop policy if exists "wishlist owner access" on public.wishlist_items;
drop policy if exists "recurring owner access" on public.recurring_transactions;
drop policy if exists "transactions owner access" on public.transactions;
drop policy if exists "budgets owner access" on public.budgets;
drop policy if exists "allocations owner access" on public.allocation_rules;
drop policy if exists "salary profiles owner access" on public.salary_profiles;
drop policy if exists "notifications owner access" on public.notifications;
drop policy if exists "transaction tags owner access" on public.transaction_tags;
drop policy if exists "transaction tag map owner access" on public.transaction_tag_map;
drop policy if exists "transaction attachments owner access" on public.transaction_attachments;
drop policy if exists "workspace backups owner access" on public.workspace_backups;
drop policy if exists "import jobs owner access" on public.import_jobs;
drop policy if exists "import rows owner access" on public.import_rows;
drop policy if exists "audit history owner access" on public.audit_history;

create policy "profiles self access" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "workspaces owner access" on public.workspaces
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "accounts owner access" on public.accounts
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "categories owner access" on public.categories
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

create policy "transactions owner access" on public.transactions
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "budgets owner access" on public.budgets
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "allocations owner access" on public.allocation_rules
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "salary profiles owner access" on public.salary_profiles
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "notifications owner access" on public.notifications
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "transaction tags owner access" on public.transaction_tags
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "transaction tag map owner access" on public.transaction_tag_map
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "transaction attachments owner access" on public.transaction_attachments
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "workspace backups owner access" on public.workspace_backups
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "import jobs owner access" on public.import_jobs
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "import rows owner access" on public.import_rows
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));

create policy "audit history owner access" on public.audit_history
for all using (workspace_id in (select public.workspace_ids_for_user(auth.uid())))
with check (workspace_id in (select public.workspace_ids_for_user(auth.uid())));
