import { SpendingChart } from "@/components/dashboard/spending-chart";
import { SummaryCards } from "@/components/dashboard/summary-cards";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Overview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-[var(--muted)]">
          Start with the big picture: how much room you have this month, what is
          coming due next, and whether your savings rhythm is holding steady.
        </p>
      </header>

      <SummaryCards />
      <SpendingChart />
    </div>
  );
}
