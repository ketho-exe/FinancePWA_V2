alter table public.profiles enable row level security;
alter table public.salary_profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_items enable row level security;
alter table public.pots enable row level security;
alter table public.saving_goals enable row level security;
alter table public.wishlist_items enable row level security;

create policy "profiles_own_rows" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "salary_profiles_own_rows" on public.salary_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "accounts_own_rows" on public.accounts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_own_rows" on public.categories
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_own_rows" on public.transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring_items_own_rows" on public.recurring_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pots_own_rows" on public.pots
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "saving_goals_own_rows" on public.saving_goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wishlist_items_own_rows" on public.wishlist_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
