# Personal Finance Tracker Design

Date: 2026-04-23
Status: Approved in conversation, written for user review

## Summary

This project is a personal finance tracker built with Next.js, deployed on Vercel, and backed by Supabase for authentication, database storage, and row-level security.

The product is designed for UK-based users and centers on a clean, modern dashboard that helps users understand salary, spending, bills, debts, savings, and financial goals at a glance. The initial release should support private per-user accounts, manual financial tracking, user-defined categories, recurring bills, and a polished responsive UI in both light and dark mode. Bank syncing is not part of the core launch scope, but the system should be designed so optional free bank syncing can be added later without restructuring the app.

## Goals

1. Let users enter an annual salary and automatically estimate UK tax, National Insurance, pension deductions, and net pay.
2. Let users track multiple financial accounts, including savings, current accounts, credit accounts, and overdraft-enabled accounts.
3. Let users manually record and categorize transactions, with categories created on demand.
4. Let users manage bills, subscriptions, and recurring payments.
5. Let users manage three kinds of savings intent:
   - Pots for general reserved money such as emergency funds.
   - Saving goals for active planned savings.
   - Wishlist items for non-essential future purchases.
6. Provide a sleek reporting dashboard that visualizes financial health clearly on both desktop and mobile.
7. Support Supabase authentication and strict per-user data isolation.
8. Support both light and dark mode from the start.

## Non-Goals For V1

1. Paid bank integrations or any feature that depends on a recurring third-party cost.
2. Full accounting or bookkeeping workflows.
3. Shared household budgeting, team finance workflows, or admin tooling for many users.
4. Tax filing, payslip ingestion, or legally binding payroll calculations.
5. Complex investment portfolio management.

## Recommended Approach

The recommended approach is a manual-first core with a sync-ready architecture.

The app should deliver real day-to-day value without relying on bank integrations. That means the first release focuses on manual entry and clean derived calculations across salary, balances, recurring obligations, and savings progress. To avoid painting the system into a corner, the account and transaction model should still allow future import or sync sources to attach later. This gives the best balance of speed, cost control, and product quality.

## Product Areas

### 1. Dashboard

The dashboard is the anchor view of the product. It should summarize the current financial state in a way that feels immediate and calm rather than dense or intimidating.

Primary dashboard elements:

1. Estimated monthly net pay from the salary model.
2. Account overview showing cash, savings, credit usage, and overdraft usage.
3. Upcoming bills and recurring payments.
4. Recent transactions and spending by category.
5. Progress for pots, saving goals, and wishlist items.
6. Monthly trend indicators showing money in, money out, and projected position.

The dashboard should answer these questions quickly:

1. How much money do I effectively have?
2. What is already committed?
3. What is due soon?
4. What am I saving for?
5. How healthy is this month compared with my salary and spending?

### 2. Salary

Users can enter an annual salary and optional pension settings. The system then estimates:

1. Gross monthly pay.
2. Income Tax.
3. National Insurance.
4. Pension deduction.
5. Estimated monthly net pay.

The salary engine is UK-specific for v1. It should be described in the UI as an estimate, not a payroll substitute. The model should be structured so tax-year constants can be updated in one place.

### 3. Accounts

Users can create multiple accounts, each belonging only to themselves. Supported account behavior in v1:

1. Current or cash accounts.
2. Savings accounts.
3. Credit accounts.
4. Overdraft-enabled accounts.

Each account stores a current balance and relevant account metadata. Credit balances and overdraft usage must be reflected in summaries and projections so the user sees effective financial position, not just positive balances.

### 4. Transactions

Transactions are first-class records and the center of the app's financial model.

Each transaction should support:

1. Linked account.
2. Amount.
3. Date.
4. Type such as income, expense, or transfer.
5. Category.
6. Optional notes.
7. Optional links to a bill, pot, saving goal, or wishlist item when relevant.

Transactions are entered manually in v1. The system should still be designed so imported or synced transactions can be added later with a source field and deduplication strategy.

### 5. Categories

Users should be able to create categories on demand while entering or editing transactions. The app may seed sensible defaults, but categories ultimately belong to the user and remain fully editable.

Category behavior:

1. Private per user.
2. Reusable across transactions.
3. Available in dashboard reports and filters.
4. Designed to support future grouping or custom icons/colors if desired.

### 6. Bills And Recurring Payments

Users can create recurring financial obligations such as rent, subscriptions, loan payments, and utilities.

Each recurring item should include:

1. Name.
2. Amount.
3. Frequency.
4. Next due date.
5. Optional linked account.
6. Optional linked category.

These records should feed projected monthly obligations and upcoming due views on the dashboard.

### 7. Pots, Saving Goals, And Wishlist

These three concepts are distinct and should stay distinct in the UI and data model:

1. Pots: reserved money buckets such as emergency fund or holiday buffer.
2. Saving goals: active structured goals with a target amount and target timeline.
3. Wishlist: wants rather than needs, with optional target amount and optional priority.

All three should track progress, accept manual contribution tracking, and appear in dashboard summaries.

## Users And Access Model

The app should support multiple user accounts, but each user's data is private to that user. The expected user count is small, so the system should prioritize simplicity and strong isolation over enterprise multi-tenancy patterns.

Supabase Auth is required. A user signs in and can only access their own:

1. Salary settings.
2. Accounts.
3. Transactions.
4. Categories.
5. Bills and recurring payments.
6. Pots.
7. Saving goals.
8. Wishlist items.
9. Dashboard data derived from those records.

Supabase Row Level Security policies should enforce this isolation at the database layer.

## Architecture

### Stack

1. Next.js App Router for frontend and server-side application logic.
2. Vercel for deployment.
3. Supabase Auth for authentication.
4. Supabase Postgres for primary storage.
5. Supabase Row Level Security for authorization.

### Application Structure

Suggested major areas:

1. Marketing or auth entry page.
2. Auth flow.
3. Authenticated app shell.
4. Feature pages for dashboard, salary, accounts, transactions, bills, pots, goals, and wishlist.
5. Shared UI system and design tokens.

### Data Flow

1. Users authenticate through Supabase.
2. App fetches user-scoped records from Supabase.
3. Derived financial summaries are calculated from salary, account, bill, and transaction data.
4. Dashboard reads from those summaries and presents both current state and near-term projections.

### Sync Readiness

The schema should preserve room for future optional bank syncing by allowing:

1. External source metadata on accounts.
2. External transaction identifiers.
3. Import status metadata.
4. Deduplication rules for imported transactions.

V1 should not depend on any sync provider.

## Data Model Outline

The exact schema can evolve during implementation, but the core entities should be:

1. `profiles`
2. `salary_profiles`
3. `accounts`
4. `transactions`
5. `categories`
6. `recurring_items`
7. `pots`
8. `saving_goals`
9. `wishlist_items`

Common patterns:

1. Every user-owned table includes `user_id`.
2. Auditing fields include `created_at` and `updated_at`.
3. Soft-delete is optional, but archiving may be useful for categories and recurring items.

## UX Direction

The visual direction should feel modern, rounded, and premium, inspired by current iOS-influenced interface design but adapted for the web.

Key UX traits:

1. Strong rounded geometry.
2. Clear card-based layout.
3. Spacious composition on desktop.
4. Compact but touch-friendly layouts on mobile.
5. Smooth theme switching between light and dark modes.
6. High contrast and readable typography.
7. Charts and summaries that prioritize clarity over raw density.

This should not look like a generic admin dashboard. It should feel intentional, calm, and sleek while still being practical for frequent use.

## Responsive Design

The app must be equally strong on desktop and mobile.

Mobile requirements:

1. Fast access to dashboard summary, transactions, and upcoming bills.
2. Comfortable touch targets.
3. Quick data entry flows.

Desktop requirements:

1. Better overview density for reporting and planning.
2. Multi-card dashboard layouts.
3. Easier review of account and transaction history.

The responsive strategy should not simply stack desktop cards into a long column without rethinking layout priority.

## Error Handling And Edge Cases

The design should explicitly account for:

1. Users with no salary yet.
2. Users with no transactions yet.
3. Empty dashboard states.
4. Negative balances, overdraft usage, and credit debt.
5. Missing optional pension values.
6. Recurring items that have not yet been paid this cycle.
7. Incomplete goals or wishlist items without deadlines.

The product should remain calm and understandable in empty and partially configured states.

## Reporting

The dashboard and reporting layer should rely on categorized transactions, account balances, salary estimates, and recurring obligations.

Useful reporting outputs for v1:

1. Spending by category.
2. Income versus spending for the month.
3. Upcoming committed outgoings.
4. Savings progress across pots and goals.
5. Estimated leftover money after bills and planned savings.

The system should favor a small number of highly legible visuals over many low-value charts.

## Security And Privacy

1. All user financial data is private by default.
2. Access control must be enforced both in the app and in Supabase RLS policies.
3. Secrets and environment variables must be managed through Vercel and Supabase configuration, never exposed to the client.
4. The app should avoid storing unnecessary sensitive data beyond what the product needs.

## Testing Strategy

The implementation should include:

1. Unit tests for UK salary calculations and derived financial summary logic.
2. Integration coverage for Supabase-authenticated data access and user scoping.
3. UI coverage for key flows such as creating accounts, entering transactions, adding bills, and viewing dashboard summaries.
4. Responsive checks for major breakpoints and both themes.

## Open Decisions Resolved In This Spec

1. Region-specific salary support is UK-only for v1.
2. Authentication is required and uses Supabase.
3. The product supports multiple users with private isolated data.
4. Core tracking is manual-first.
5. Optional bank syncing may be added later only if it can be done without paid dependency pressure.
6. Dark mode and light mode are both first-class requirements.

## Delivery Boundary For Initial Version

The first version should deliver:

1. Authentication.
2. User-scoped data model.
3. Salary estimator.
4. Account management.
5. Manual transaction tracking with custom categories.
6. Bills and recurring payments.
7. Pots, saving goals, and wishlist tracking.
8. Reporting dashboard.
9. Responsive polished UI with light and dark mode.

This is a complete, focused v1 and should not be expanded with unrelated financial features before launch.
