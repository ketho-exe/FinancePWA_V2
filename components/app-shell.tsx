import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { label: "Dashboard", detail: "Overview and daily pulse" },
  { label: "Salary", detail: "Income and pay cadence" },
  { label: "Accounts", detail: "Cash, cards, and balances" },
  { label: "Transactions", detail: "Spending history" },
  { label: "Bills", detail: "Recurring commitments" },
  { label: "Pots", detail: "Short-term savings" },
  { label: "Goals", detail: "Milestones and progress" },
  { label: "Wishlist", detail: "Planned future spends" }
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
              <div
                key={item.label}
                className="rounded-[24px] px-4 py-3 transition-colors"
                style={{ background: "var(--nav-item)" }}
              >
                <div className="font-medium">{item.label}</div>
                <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {item.detail}
                </div>
              </div>
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
