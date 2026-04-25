"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[300px_1fr] lg:gap-6 lg:px-6 lg:py-6">
        <aside
          className="rounded-[32px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-hidden"
          style={{
            background: "var(--panel)",
            borderColor: "var(--panel-border)"
          }}
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8 lg:flex-col lg:items-start">
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
              <p className="mt-2 max-w-xs text-sm" style={{ color: "var(--muted)" }}>
                A calm place to check balances, bills, and savings momentum.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <nav
            aria-label="Primary"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1 lg:overflow-y-auto lg:pr-1"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className="block rounded-[24px] border px-4 py-3 transition-colors"
                  href={item.href}
                  style={{
                    background: isActive ? "var(--panel)" : "var(--nav-item)",
                    borderColor: isActive
                      ? "rgba(214, 139, 87, 0.55)"
                      : "transparent"
                  }}
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    {item.detail}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main
          className="rounded-[32px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur md:p-7 lg:p-8"
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
