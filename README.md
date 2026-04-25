# Personal Finance Tracker

A sleek UK personal finance dashboard for tracking salary, bills, cash flow, and savings goals.

## Setup

1. Copy `.env.example` to `.env.local`
2. Add your Supabase project URL and publishable key
3. In Supabase, run `supabase/schema.sql` in the SQL Editor
4. Run `npm install`
5. Run `npm run dev`

## Auth Notes

- Password auth is enabled through Supabase email + password sign-in
- Optional email confirmation redirects back through `/auth/callback`
- New users create a `public.profiles` row automatically through the `handle_new_user` trigger
- Protected routes redirect unauthenticated visitors to `/login`

## Test Commands

- `npm run test`
- `npx playwright test`
- `npm run build`

## Database Verification

- [ ] Tables exist for profiles, salary_profiles, accounts, transactions, categories, recurring_items, pots, saving_goals, and wishlist_items
- [ ] Each table has a user_id where appropriate
- [ ] Cross-table account/category references are ownership-aware and cannot cross tenants
- [ ] RLS is enabled on every user-owned table
- [ ] Policies scope rows to auth.uid()
- [ ] Profiles bootstrap automatically for new auth users
- [ ] `updated_at` is maintained by reusable database trigger logic
