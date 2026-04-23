## Database verification

- [ ] Tables exist for profiles, salary_profiles, accounts, transactions, categories, recurring_items, pots, saving_goals, and wishlist_items
- [ ] Each table has a user_id where appropriate
- [ ] RLS is enabled on every user-owned table
- [ ] Policies scope rows to auth.uid()
