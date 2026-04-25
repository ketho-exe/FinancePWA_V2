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
  const remainingGoalFunding = Math.max(
    demoDashboardInput.goals.reduce(
      (sum, goal) => sum + (goal.target_amount - goal.saved_amount),
      0
    ),
    0
  );

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
      <header className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
              Prototype snapshot
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Dashboard
            </h1>
            <p className="text-[var(--muted)]">
              This dashboard is showing seeded sample data so the shell,
              summary cards, and spending views can be reviewed before
              Supabase-backed account syncing is connected.
            </p>
          </div>

          <div
            className="inline-flex w-full max-w-sm items-center gap-3 rounded-full border px-4 py-3 text-sm lg:w-auto"
            style={{
              background: "var(--nav-item)",
              borderColor: "var(--panel-border)"
            }}
          >
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: "#d68b57" }}
            />
            Sample-mode preview with auth-aware shell navigation
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <SummaryCards cards={summaryCards} />

        <aside
          className="rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          style={{
            background: "var(--nav-item)",
            borderColor: "var(--panel-border)"
          }}
        >
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            Health check
          </p>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm text-[var(--muted)]">Monthly position</dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight">
                {formatSignedCurrency(netMonthlyPosition)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">Goal funding left</dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight">
                {formatCurrency(remainingGoalFunding)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">Seeded data coverage</dt>
              <dd className="mt-1 text-sm text-[var(--muted)]">
                Accounts, recurring bills, and savings goals are all demo values
                for this preview slice.
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <SpendingChart
        description="A prototype category split based on the same seeded monthly inputs used in the cards above."
        eyebrow="Spending snapshot"
        items={spendingItems}
        title="Spending by category"
      />
    </div>
  );
}
