import type { ReactNode } from "react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  label: string;
  detail: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", detail: "Overview and daily pulse", href: "/dashboard" },
  { label: "Salary", detail: "Income and pay cadence", href: "/salary" },
  { label: "Accounts", detail: "Cash, cards, and balances", href: "/accounts" },
  {
    label: "Transactions",
    detail: "Spending history",
    href: "/transactions"
  },
  { label: "Bills", detail: "Recurring commitments", href: "/bills" },
  { label: "Pots", detail: "Short-term savings", href: "/pots" },
  { label: "Goals", detail: "Milestones and progress", href: "/goals" },
  { label: "Wishlist", detail: "Planned future spends", href: "/wishlist" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 md:grid-cols-[280px_1fr] md:px-6 md:py-6">
        <aside
          className="rounded-[32px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur"
          style={{
            background: "var(--panel)",
            borderColor: "var(--panel-border)"
          }}
        >
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <span
                className="block text-xs uppercase tracking-[0.32em]"
                style={{ color: "var(--muted)" }}
              >
                Finance
              </span>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                Homebase
              </p>
            </div>
            <ThemeToggle />
          </div>

          <nav aria-label="Primary" className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                className="block rounded-[24px] px-4 py-3 transition-colors"
                href={item.href}
                style={{ background: "var(--nav-item)" }}
              >
                <div className="font-medium">{item.label}</div>
                <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {item.detail}
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        <main
          className="rounded-[32px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur md:p-8"
          style={{
            background: "var(--panel)",
            borderColor: "var(--panel-border)"
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
