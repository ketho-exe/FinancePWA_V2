import { SpendingChart, type SpendingChartItem } from "@/components/dashboard/spending-chart";
import { SummaryCards, type SummaryCardItem } from "@/components/dashboard/summary-cards";
import { buildFinancialSummary } from "@/lib/finance/summaries";

const demoDashboardInput = {
  accounts: [
    { kind: "current" as const, balance: 2800, overdraft_limit: 0 },
    { kind: "savings" as const, balance: 2200, overdraft_limit: 0 },
    { kind: "credit" as const, balance: -600, overdraft_limit: null }
  ],
  recurringItems: [
    { amount: 950 },
    { amount: 220 },
    { amount: 145 },
    { amount: 105 }
  ],
  goals: [
    { target_amount: 3000, saved_amount: 1800 },
    { target_amount: 2000, saved_amount: 1600 }
  ]
};

function formatCurrency(value: number) {
  const formattedAmount = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value));

  return `GBP ${formattedAmount}`;
}

function formatSignedCurrency(value: number) {
  const sign = value >= 0 ? "+" : "-";

  return `${sign}${formatCurrency(value)}`;
}

export default function DashboardPage() {
  const summary = buildFinancialSummary(demoDashboardInput);
  const netMonthlyPosition = summary.cash - summary.committedMonthly;

  const summaryCards: SummaryCardItem[] = [
    {
      title: "Cash after seeded bills",
      value: formatCurrency(netMonthlyPosition),
      detail: "Current demo cash minus the queued seeded bills below"
    },
    {
      title: "Upcoming bills",
      value: `${demoDashboardInput.recurringItems.length} due`,
      detail: `${formatCurrency(summary.committedMonthly)} of demo bills queued`
    },
    {
      title: "Savings progress",
      value: `${summary.goalProgressPercent}%`,
      detail: `${summary.goalProgressPercent}% of sample goals funded`
    }
  ];

  const spendingItems: SpendingChartItem[] = [
    { category: "Housing", amount: 950 },
    { category: "Food", amount: 220 },
    { category: "Transport", amount: 145 },
    { category: "Leisure", amount: 105 }
  ];

  return (
    <div className="space-y-6">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Prototype snapshot
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-[var(--muted)]">
          This dashboard is currently showing seeded sample data to demonstrate
          the summary layout while live account syncing is still out of scope
          for this slice.
        </p>
      </header>

      <SummaryCards cards={summaryCards} />
      <SpendingChart
        description="A prototype category split based on the same seeded monthly inputs used in the cards above."
        eyebrow="Spending snapshot"
        items={spendingItems}
        title="Spending by category"
      />
    </div>
  );
}
