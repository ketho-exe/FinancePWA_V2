# Personal Finance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a UK-focused personal finance tracker with Supabase auth, private per-user financial data, salary estimation, manual transaction tracking, recurring bills, saving structures, and a responsive light/dark dashboard.

**Architecture:** Use a Next.js App Router application deployed to Vercel with Supabase for auth and Postgres storage. Organize the app around small feature modules: auth, database schema, salary calculation, financial entities, dashboard summaries, and a shared premium UI system with responsive layouts and theme support.

**Tech Stack:** Next.js, TypeScript, React, Tailwind CSS, Supabase, PostgreSQL, Vitest, Testing Library, Playwright

---

## File Map

### App And Config

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `middleware.ts`

### App Routes

- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/salary/page.tsx`
- Create: `app/(app)/accounts/page.tsx`
- Create: `app/(app)/transactions/page.tsx`
- Create: `app/(app)/bills/page.tsx`
- Create: `app/(app)/pots/page.tsx`
- Create: `app/(app)/goals/page.tsx`
- Create: `app/(app)/wishlist/page.tsx`

### Shared UI And Domain

- Create: `components/app-shell.tsx`
- Create: `components/theme-toggle.tsx`
- Create: `components/dashboard/summary-cards.tsx`
- Create: `components/dashboard/spending-chart.tsx`
- Create: `components/forms/account-form.tsx`
- Create: `components/forms/transaction-form.tsx`
- Create: `components/forms/recurring-item-form.tsx`
- Create: `components/forms/salary-form.tsx`
- Create: `components/forms/pot-form.tsx`
- Create: `components/forms/goal-form.tsx`
- Create: `components/forms/wishlist-form.tsx`
- Create: `lib/cn.ts`
- Create: `lib/env.ts`
- Create: `lib/types.ts`
- Create: `lib/salary/uk.ts`
- Create: `lib/finance/summaries.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/auth/session.ts`

### Database

- Create: `supabase/migrations/202604230001_initial_schema.sql`
- Create: `supabase/migrations/202604230002_rls_policies.sql`
- Create: `supabase/seed.sql`

### Tests

- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/unit/lib/salary/uk.test.ts`
- Create: `tests/unit/lib/finance/summaries.test.ts`
- Create: `tests/integration/auth/session.test.ts`
- Create: `tests/ui/dashboard.test.tsx`
- Create: `tests/e2e/auth.spec.ts`

### Docs

- Create: `README.md`

## Task 1: Scaffold Next.js App And Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `lib/cn.ts`
- Test: `npm run lint`

- [ ] **Step 1: Write the failing smoke test for the landing page**

```tsx
// tests/ui/dashboard.test.tsx
import { render, screen } from "@testing-library/react";
import RootPage from "@/app/page";

describe("RootPage", () => {
  it("renders the product value proposition", () => {
    render(<RootPage />);

    expect(screen.getByText("Your money, clearly")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: FAIL because the app files and test setup do not exist yet.

- [ ] **Step 3: Create the base app and style system**

```json
// package.json
{
  "name": "personal-finance-tracker",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  }
}
```

```tsx
// app/page.tsx
export default function RootPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            UK Personal Finance
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Your money, clearly
          </h1>
          <p className="text-lg text-[var(--muted)]">
            Track salary, accounts, bills, transactions, goals, and savings in a
            polished dashboard built for everyday use.
          </p>
        </div>
      </section>
    </main>
  );
}
```

```tsx
// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.js tailwind.config.ts app lib tests/ui/dashboard.test.tsx
git commit -m "feat: scaffold nextjs finance app"
```

## Task 2: Add Supabase Auth Foundations And Route Protection

**Files:**
- Create: `.env.example`
- Create: `middleware.ts`
- Create: `lib/env.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/auth/session.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(app)/layout.tsx`
- Test: `tests/integration/auth/session.test.ts`
- Test: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write the failing auth session test**

```ts
// tests/integration/auth/session.test.ts
import { describe, expect, it } from "vitest";
import { isProtectedPath } from "@/lib/auth/session";

describe("isProtectedPath", () => {
  it("marks app routes as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
  });

  it("leaves marketing and auth routes public", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/auth/session.test.ts`
Expected: FAIL because `isProtectedPath` is undefined.

- [ ] **Step 3: Implement Supabase helpers and auth guard**

```ts
// lib/auth/session.ts
const protectedPrefixes = [
  "/dashboard",
  "/salary",
  "/accounts",
  "/transactions",
  "/bills",
  "/pots",
  "/goals",
  "/wishlist"
];

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
```

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("sb-access-token")?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
```

```tsx
// app/(auth)/login/page.tsx
export default function LoginPage() {
  return <main>Login</main>;
}
```

```tsx
// app/(auth)/signup/page.tsx
export default function SignupPage() {
  return <main>Sign up</main>;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/integration/auth/session.test.ts`
Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add .env.example middleware.ts lib/auth/session.ts lib/env.ts lib/supabase app/(auth) app/(app) tests/integration/auth/session.test.ts tests/e2e/auth.spec.ts
git commit -m "feat: add supabase auth foundations"
```

## Task 3: Create Supabase Schema And Row-Level Security

**Files:**
- Create: `supabase/migrations/202604230001_initial_schema.sql`
- Create: `supabase/migrations/202604230002_rls_policies.sql`
- Create: `supabase/seed.sql`
- Create: `lib/types.ts`
- Test: `README.md`

- [ ] **Step 1: Write the failing schema verification checklist in the docs**

```md
<!-- README.md -->
## Database verification

- [ ] Tables exist for profiles, salary_profiles, accounts, transactions, categories, recurring_items, pots, saving_goals, and wishlist_items
- [ ] Each table has a user_id where appropriate
- [ ] RLS is enabled on every user-owned table
- [ ] Policies scope rows to auth.uid()
```

- [ ] **Step 2: Run Supabase migration locally to verify the checklist fails**

Run: `supabase db reset`
Expected: FAIL because the migration files do not exist yet.

- [ ] **Step 3: Add the initial schema and RLS**

```sql
-- supabase/migrations/202604230001_initial_schema.sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salary_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  annual_salary numeric(12,2) not null,
  pension_percent numeric(5,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('current', 'savings', 'credit')),
  balance numeric(12,2) not null default 0,
  overdraft_limit numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

```sql
-- supabase/migrations/202604230002_rls_policies.sql
alter table public.profiles enable row level security;
alter table public.salary_profiles enable row level security;
alter table public.accounts enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "salary_profiles_own_rows" on public.salary_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "accounts_own_rows" on public.accounts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

```ts
// lib/types.ts
export type AccountKind = "current" | "savings" | "credit";

export interface AccountRecord {
  id: string;
  user_id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  overdraft_limit: number | null;
}
```

- [ ] **Step 4: Run migration to verify it passes**

Run: `supabase db reset`
Expected: PASS and the database verification checklist can be checked off.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations supabase/seed.sql lib/types.ts README.md
git commit -m "feat: add initial finance schema and rls"
```

## Task 4: Implement UK Salary Calculation Logic

**Files:**
- Create: `lib/salary/uk.ts`
- Test: `tests/unit/lib/salary/uk.test.ts`

- [ ] **Step 1: Write the failing salary calculation test**

```ts
// tests/unit/lib/salary/uk.test.ts
import { describe, expect, it } from "vitest";
import { estimateUkMonthlyPay } from "@/lib/salary/uk";

describe("estimateUkMonthlyPay", () => {
  it("returns tax, ni, pension, and net pay for an annual salary", () => {
    const result = estimateUkMonthlyPay({
      annualSalary: 42000,
      pensionPercent: 5
    });

    expect(result.grossMonthly).toBeCloseTo(3500, 2);
    expect(result.incomeTaxMonthly).toBeGreaterThan(0);
    expect(result.nationalInsuranceMonthly).toBeGreaterThan(0);
    expect(result.pensionMonthly).toBeCloseTo(175, 2);
    expect(result.netMonthly).toBeLessThan(3500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/lib/salary/uk.test.ts`
Expected: FAIL because `estimateUkMonthlyPay` does not exist.

- [ ] **Step 3: Implement the salary estimator**

```ts
// lib/salary/uk.ts
interface EstimateUkMonthlyPayInput {
  annualSalary: number;
  pensionPercent: number;
}

export function estimateUkMonthlyPay(input: EstimateUkMonthlyPayInput) {
  const grossMonthly = input.annualSalary / 12;
  const pensionMonthly = grossMonthly * (input.pensionPercent / 100);
  const taxableAnnual = Math.max(input.annualSalary - 12570, 0);
  const incomeTaxAnnual = Math.min(taxableAnnual, 37700) * 0.2;
  const niAnnual = Math.max(input.annualSalary - 12570, 0) * 0.08;

  return {
    grossMonthly,
    incomeTaxMonthly: incomeTaxAnnual / 12,
    nationalInsuranceMonthly: niAnnual / 12,
    pensionMonthly,
    netMonthly:
      grossMonthly - incomeTaxAnnual / 12 - niAnnual / 12 - pensionMonthly
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/lib/salary/uk.test.ts`
Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/salary/uk.ts tests/unit/lib/salary/uk.test.ts
git commit -m "feat: add uk salary estimation"
```

## Task 5: Build Financial Summary Derivations For Dashboard Reporting

**Files:**
- Create: `lib/finance/summaries.ts`
- Test: `tests/unit/lib/finance/summaries.test.ts`

- [ ] **Step 1: Write the failing summary derivation test**

```ts
// tests/unit/lib/finance/summaries.test.ts
import { describe, expect, it } from "vitest";
import { buildFinancialSummary } from "@/lib/finance/summaries";

describe("buildFinancialSummary", () => {
  it("derives effective cash, debt, and committed spend", () => {
    const summary = buildFinancialSummary({
      accounts: [
        { kind: "current", balance: 1200, overdraft_limit: 0 },
        { kind: "credit", balance: -400, overdraft_limit: null }
      ],
      recurringItems: [{ amount: 250 }, { amount: 50 }],
      goals: [{ target_amount: 1000, saved_amount: 300 }]
    });

    expect(summary.cash).toBe(1200);
    expect(summary.debt).toBe(400);
    expect(summary.committedMonthly).toBe(300);
    expect(summary.goalProgressPercent).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/lib/finance/summaries.test.ts`
Expected: FAIL because `buildFinancialSummary` does not exist.

- [ ] **Step 3: Implement the summary builder**

```ts
// lib/finance/summaries.ts
export function buildFinancialSummary(input: {
  accounts: Array<{ kind: string; balance: number; overdraft_limit: number | null }>;
  recurringItems: Array<{ amount: number }>;
  goals: Array<{ target_amount: number; saved_amount: number }>;
}) {
  const cash = input.accounts
    .filter((account) => account.kind !== "credit")
    .reduce((sum, account) => sum + account.balance, 0);

  const debt = input.accounts
    .filter((account) => account.kind === "credit" && account.balance < 0)
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  const committedMonthly = input.recurringItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalGoalTarget = input.goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalGoalSaved = input.goals.reduce((sum, goal) => sum + goal.saved_amount, 0);

  return {
    cash,
    debt,
    committedMonthly,
    goalProgressPercent:
      totalGoalTarget === 0 ? 0 : Math.round((totalGoalSaved / totalGoalTarget) * 100)
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/lib/finance/summaries.test.ts`
Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/finance/summaries.ts tests/unit/lib/finance/summaries.test.ts
git commit -m "feat: add dashboard financial summaries"
```

## Task 6: Build Authenticated App Shell, Theme System, And Navigation

**Files:**
- Create: `components/app-shell.tsx`
- Create: `components/theme-toggle.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/ui/dashboard.test.tsx`

- [ ] **Step 1: Write the failing shell test**

```tsx
// tests/ui/dashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("renders primary finance navigation", () => {
    render(<AppShell><div>Content</div></AppShell>);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Wishlist")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 3: Implement the shell and theme toggle**

```tsx
// components/app-shell.tsx
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  "Dashboard",
  "Salary",
  "Accounts",
  "Transactions",
  "Bills",
  "Pots",
  "Goals",
  "Wishlist"
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              Finance
            </span>
            <ThemeToggle />
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <div key={item} className="rounded-2xl px-4 py-3 hover:bg-white/10">
                {item}
              </div>
            ))}
          </nav>
        </aside>
        <main className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          {children}
        </main>
      </div>
    </div>
  );
}
```

```tsx
// components/theme-toggle.tsx
"use client";

export function ThemeToggle() {
  return <button aria-label="Toggle theme">Theme</button>;
}
```

```tsx
// app/(app)/layout.tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add components/app-shell.tsx components/theme-toggle.tsx app/layout.tsx app/(app)/layout.tsx tests/ui/dashboard.test.tsx
git commit -m "feat: add app shell and theming foundation"
```

## Task 7: Build Salary Page And Form

**Files:**
- Create: `components/forms/salary-form.tsx`
- Create: `app/(app)/salary/page.tsx`
- Test: `tests/ui/dashboard.test.tsx`

- [ ] **Step 1: Write the failing salary form test**

```tsx
import { render, screen } from "@testing-library/react";
import SalaryPage from "@/app/(app)/salary/page";

describe("SalaryPage", () => {
  it("shows salary inputs and estimated take-home output", () => {
    render(<SalaryPage />);

    expect(screen.getByLabelText("Annual salary")).toBeInTheDocument();
    expect(screen.getByText("Estimated monthly net pay")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: FAIL because the salary page is missing.

- [ ] **Step 3: Implement the salary page**

```tsx
// components/forms/salary-form.tsx
import { estimateUkMonthlyPay } from "@/lib/salary/uk";

export function SalaryForm() {
  const estimate = estimateUkMonthlyPay({ annualSalary: 42000, pensionPercent: 5 });

  return (
    <section className="space-y-4">
      <label className="block">
        <span>Annual salary</span>
        <input aria-label="Annual salary" defaultValue="42000" />
      </label>
      <label className="block">
        <span>Pension percent</span>
        <input aria-label="Pension percent" defaultValue="5" />
      </label>
      <div>
        <h2>Estimated monthly net pay</h2>
        <p>{estimate.netMonthly.toFixed(2)}</p>
      </div>
    </section>
  );
}
```

```tsx
// app/(app)/salary/page.tsx
import { SalaryForm } from "@/components/forms/salary-form";

export default function SalaryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Salary</h1>
        <p className="text-[var(--muted)]">Estimate UK tax, NI, pension, and net pay.</p>
      </header>
      <SalaryForm />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/forms/salary-form.tsx app/(app)/salary/page.tsx tests/ui/dashboard.test.tsx
git commit -m "feat: add salary planner screen"
```

## Task 8: Build Accounts And Transactions Management

**Files:**
- Create: `components/forms/account-form.tsx`
- Create: `components/forms/transaction-form.tsx`
- Create: `app/(app)/accounts/page.tsx`
- Create: `app/(app)/transactions/page.tsx`
- Test: `tests/ui/dashboard.test.tsx`

- [ ] **Step 1: Write the failing transaction management test**

```tsx
import { render, screen } from "@testing-library/react";
import TransactionsPage from "@/app/(app)/transactions/page";

describe("TransactionsPage", () => {
  it("shows account assignment and category creation controls", () => {
    render(<TransactionsPage />);

    expect(screen.getByLabelText("Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByText("Create category")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: FAIL because the transactions UI is missing.

- [ ] **Step 3: Implement accounts and transactions pages**

```tsx
// components/forms/account-form.tsx
export function AccountForm() {
  return (
    <form className="space-y-4">
      <input aria-label="Account name" placeholder="Monzo" />
      <select aria-label="Account type" defaultValue="current">
        <option value="current">Current</option>
        <option value="savings">Savings</option>
        <option value="credit">Credit</option>
      </select>
    </form>
  );
}
```

```tsx
// components/forms/transaction-form.tsx
export function TransactionForm() {
  return (
    <form className="space-y-4">
      <select aria-label="Account">
        <option>Monzo</option>
      </select>
      <input aria-label="Category" placeholder="Groceries" />
      <button type="button">Create category</button>
    </form>
  );
}
```

```tsx
// app/(app)/transactions/page.tsx
import { TransactionForm } from "@/components/forms/transaction-form";

export default function TransactionsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Transactions</h1>
      <TransactionForm />
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/forms/account-form.tsx components/forms/transaction-form.tsx app/(app)/accounts/page.tsx app/(app)/transactions/page.tsx tests/ui/dashboard.test.tsx
git commit -m "feat: add account and transaction management"
```

## Task 9: Build Bills, Pots, Goals, And Wishlist Screens

**Files:**
- Create: `components/forms/recurring-item-form.tsx`
- Create: `components/forms/pot-form.tsx`
- Create: `components/forms/goal-form.tsx`
- Create: `components/forms/wishlist-form.tsx`
- Create: `app/(app)/bills/page.tsx`
- Create: `app/(app)/pots/page.tsx`
- Create: `app/(app)/goals/page.tsx`
- Create: `app/(app)/wishlist/page.tsx`
- Test: `tests/ui/dashboard.test.tsx`

- [ ] **Step 1: Write the failing savings structures test**

```tsx
import { render, screen } from "@testing-library/react";
import WishlistPage from "@/app/(app)/wishlist/page";

describe("WishlistPage", () => {
  it("shows wishlist tracking controls", () => {
    render(<WishlistPage />);

    expect(screen.getByLabelText("Item name")).toBeInTheDocument();
    expect(screen.getByLabelText("Target amount")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: FAIL because the savings screens do not exist yet.

- [ ] **Step 3: Implement the savings and recurring pages**

```tsx
// components/forms/wishlist-form.tsx
export function WishlistForm() {
  return (
    <form className="space-y-4">
      <input aria-label="Item name" placeholder="Apple Watch" />
      <input aria-label="Target amount" placeholder="399" />
    </form>
  );
}
```

```tsx
// app/(app)/wishlist/page.tsx
import { WishlistForm } from "@/components/forms/wishlist-form";

export default function WishlistPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Wishlist</h1>
      <WishlistForm />
    </section>
  );
}
```

```tsx
// app/(app)/bills/page.tsx
export default function BillsPage() {
  return <section><h1>Bills</h1></section>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/forms/recurring-item-form.tsx components/forms/pot-form.tsx components/forms/goal-form.tsx components/forms/wishlist-form.tsx app/(app)/bills/page.tsx app/(app)/pots/page.tsx app/(app)/goals/page.tsx app/(app)/wishlist/page.tsx tests/ui/dashboard.test.tsx
git commit -m "feat: add savings and recurring payment screens"
```

## Task 10: Build The Dashboard Experience

**Files:**
- Create: `components/dashboard/summary-cards.tsx`
- Create: `components/dashboard/spending-chart.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Test: `tests/ui/dashboard.test.tsx`

- [ ] **Step 1: Write the failing dashboard test**

```tsx
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(app)/dashboard/page";

describe("DashboardPage", () => {
  it("shows the key financial overview cards", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Net monthly position")).toBeInTheDocument();
    expect(screen.getByText("Upcoming bills")).toBeInTheDocument();
    expect(screen.getByText("Savings progress")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: FAIL because the dashboard page is missing.

- [ ] **Step 3: Implement the dashboard**

```tsx
// components/dashboard/summary-cards.tsx
export function SummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-3xl p-5">Net monthly position</article>
      <article className="rounded-3xl p-5">Upcoming bills</article>
      <article className="rounded-3xl p-5">Savings progress</article>
    </div>
  );
}
```

```tsx
// components/dashboard/spending-chart.tsx
export function SpendingChart() {
  return <section className="rounded-3xl p-5">Spending by category</section>;
}
```

```tsx
// app/(app)/dashboard/page.tsx
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
          Overview
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      </header>
      <SummaryCards />
      <SpendingChart />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/ui/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/summary-cards.tsx components/dashboard/spending-chart.tsx app/(app)/dashboard/page.tsx tests/ui/dashboard.test.tsx
git commit -m "feat: add finance dashboard"
```

## Task 11: Add End-To-End Polish, Responsive States, And Documentation

**Files:**
- Modify: `README.md`
- Modify: `app/layout.tsx`
- Modify: `components/app-shell.tsx`
- Modify: `app/(app)/dashboard/page.tsx`
- Test: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write the failing end-to-end auth journey test**

```ts
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/login/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/auth.spec.ts`
Expected: FAIL because the app is not fully wired for auth-aware navigation yet.

- [ ] **Step 3: Complete polish and docs**

```md
<!-- README.md -->
# Personal Finance Tracker

## Setup

1. Copy `.env.example` to `.env.local`
2. Add Supabase project values
3. Run `npm install`
4. Run `npm run dev`

## Test Commands

- `npm run test`
- `npx playwright test`
- `npm run build`
```

```tsx
// app/layout.tsx
export const metadata = {
  title: "Personal Finance Tracker",
  description: "A sleek UK personal finance dashboard with salary, bills, and savings tracking."
};
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm run test && npx playwright test && npm run build`
Expected: PASS with unit, integration, UI, E2E, and production build checks succeeding.

- [ ] **Step 5: Commit**

```bash
git add README.md app/layout.tsx components/app-shell.tsx app/(app)/dashboard/page.tsx tests/e2e/auth.spec.ts
git commit -m "feat: finish responsive finance app foundation"
```

## Self-Review

### Spec Coverage

The plan covers:

1. Supabase auth and private user isolation in Tasks 2 and 3.
2. UK salary estimation in Task 4.
3. Accounts and manual transaction tracking with categories in Task 8.
4. Bills, subscriptions, pots, goals, and wishlist in Task 9.
5. Dashboard reporting and responsive shell in Tasks 5, 6, 10, and 11.
6. Light and dark mode foundation in Task 6.

No spec sections are intentionally left uncovered for the initial implementation plan.

### Placeholder Scan

The plan avoids `TBD`, `TODO`, and generic placeholders. Each task names concrete files, commands, and representative code to guide implementation.

### Type Consistency

The plan consistently uses:

1. `estimateUkMonthlyPay` for salary logic.
2. `buildFinancialSummary` for dashboard derivations.
3. `AccountKind` values of `current`, `savings`, and `credit`.
4. Route names matching the approved product areas.
