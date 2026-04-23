"use client";

import { FormEvent, useState } from "react";
import {
  AppButton,
  AppCard,
  AppGroupBox,
  AppPanel,
  AppWindow,
  CurrencyText,
  DataTable,
  ForecastChart,
  MetricCard,
  ProgressBar,
  SectionHeading,
  StatusBadge,
} from "@/components/finance/ui";
import {
  useAllocationSummary,
  useCurrentUserSalarySummary,
  useFinanceWorkspace,
  useSubscriptionSummary,
} from "@/hooks/use-finance-workspace";
import { getUnallocatedAmount } from "@/lib/allocation";
import { formatCurrency, formatMonth } from "@/lib/utils";

function categoryName(categoryId: string, categories: { id: string; name: string }[]) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Unknown";
}

export function DashboardPage() {
  const {
    currentMonth,
    summary,
    monthlyIncome,
    monthlySpending,
    savingsGoals,
    categories,
    recurring,
  } = useFinanceWorkspace();
  const subscriptions = useSubscriptionSummary();

  return (
    <div className="page-stack">
      <AppWindow title={`Dashboard — ${formatMonth(new Date(`${currentMonth}-01`))}`} icon="📊" statusText="Forecast updated for this month">
        <div className="metric-grid">
          <MetricCard label="Net Balance" value={formatCurrency(monthlyIncome - monthlySpending)} tone={monthlyIncome - monthlySpending >= 0 ? "positive" : "negative"} />
          <MetricCard label="Income This Month" value={formatCurrency(monthlyIncome)} tone="positive" />
          <MetricCard label="Spending This Month" value={formatCurrency(monthlySpending)} tone="negative" />
          <MetricCard label="Safe To Spend" value={formatCurrency(summary.safeToSpend)} hint={`${subscriptions.activeCount} live subscriptions`} />
        </div>
        <div className="two-column">
          <AppCard>
            <SectionHeading title="Forecast" subtitle="30 day forward look" />
            <ForecastChart points={summary.points} />
          </AppCard>
          <AppCard>
            <SectionHeading title="Budget Risk" subtitle="Live category pressure" />
            <div className="list-stack">
              {summary.budgetRisk.map(({ budget, spent, ratio }) => (
                <div key={budget.id}>
                  <div className="row-between">
                    <span>{categoryName(budget.categoryId, categories)}</span>
                    <span>{formatCurrency(spent)} / {formatCurrency(budget.amount)}</span>
                  </div>
                  <ProgressBar
                    value={spent}
                    max={Math.max(budget.amount, 1)}
                    tone={ratio >= 1 ? "danger" : ratio >= 0.8 ? "warning" : "normal"}
                  />
                </div>
              ))}
            </div>
          </AppCard>
        </div>
        <div className="two-column">
          <AppCard>
            <SectionHeading title="Wishlist Momentum" subtitle="Top goals worth keeping visible" />
            <div className="list-stack">
              {savingsGoals.map((goal) => (
                <AppPanel key={goal.id}>
                  <div className="row-between">
                    <strong>{goal.name}</strong>
                    <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                </AppPanel>
              ))}
            </div>
          </AppCard>
          <AppCard>
            <SectionHeading title="Upcoming Recurring Events" subtitle="Next 5 scheduled items" />
            <div className="list-stack">
              {recurring.slice(0, 5).map((item) => (
                <AppPanel key={item.id}>
                  <div className="row-between">
                    <strong>{item.name}</strong>
                    <span>{item.nextRunDate}</span>
                  </div>
                  <span>{formatCurrency(item.amount)} · {item.billingCycle}</span>
                </AppPanel>
              ))}
            </div>
          </AppCard>
        </div>
      </AppWindow>
    </div>
  );
}

export function TransactionsPage() {
  const { categories, transactions, saveTransaction } = useFinanceWorkspace();
  const [draft, setDraft] = useState({
    description: "",
    amount: "",
    categoryId: categories[0]?.id ?? "",
    date: "2026-04-23",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveTransaction({
      description: draft.description,
      amount: Number(draft.amount),
      categoryId: draft.categoryId,
      date: draft.date,
    });
    setDraft({ ...draft, description: "", amount: "" });
  }

  return (
    <AppWindow title="Transactions" icon="💳" statusText={`${transactions.length} records available`}>
      <AppGroupBox label="Quick Add">
        <form className="form-grid" onSubmit={handleSubmit}>
          <input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="e.g. Coffee, freelance, rent" />
          <input value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="Amount" type="number" />
          <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} type="date" />
          <AppButton variant="primary" type="submit">Add Transaction</AppButton>
        </form>
      </AppGroupBox>
      <DataTable
        headers={["Date", "Description", "Category", "Amount"]}
        rows={transactions.map((transaction) => [
          transaction.date,
          transaction.description,
          categoryName(transaction.categoryId, categories),
          formatCurrency(transaction.amount),
        ])}
      />
    </AppWindow>
  );
}

export function BudgetsPage() {
  const { budgets, categories, currentMonth, saveBudget } = useFinanceWorkspace();
  const expenseCategories = categories.filter((category) => category.kind !== "income");
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");

  return (
    <AppWindow title="Budgets" icon="📁" statusText={`Month ${currentMonth}`}>
      <AppGroupBox label="New Monthly Budget">
        <div className="form-grid compact">
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
          <AppButton
            variant="primary"
            onClick={() => {
              if (!amount) return;
              saveBudget({ categoryId, amount: Number(amount), month: currentMonth });
              setAmount("");
            }}
          >
            Save Budget
          </AppButton>
        </div>
      </AppGroupBox>
      <div className="three-grid">
        {budgets
          .filter((budget) => budget.month === currentMonth)
          .map((budget) => (
            <AppCard key={budget.id}>
              <strong>{categoryName(budget.categoryId, categories)}</strong>
              <p>{formatCurrency(budget.amount)}</p>
            </AppCard>
          ))}
      </div>
    </AppWindow>
  );
}

export function SavingsPage() {
  const { savingsGoals, saveSavingsGoal } = useFinanceWorkspace();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  return (
    <AppWindow title="Savings" icon="💾" statusText="Track pots and milestones">
      <AppGroupBox label="Create Goal">
        <div className="form-grid compact">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Goal name" />
          <input value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} type="number" placeholder="Target amount" />
          <AppButton
            variant="primary"
            onClick={() => {
              if (!name || !targetAmount) return;
              saveSavingsGoal({ name, targetAmount: Number(targetAmount) });
              setName("");
              setTargetAmount("");
            }}
          >
            Add Goal
          </AppButton>
        </div>
      </AppGroupBox>
      <div className="two-column">
        {savingsGoals.map((goal) => (
          <AppWindow key={goal.id} title={goal.name} icon="◆" statusText={goal.targetDate ? `Target ${goal.targetDate}` : "No target date"}>
            <p className="card-stat">{formatCurrency(goal.currentAmount)} saved</p>
            <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
          </AppWindow>
        ))}
      </div>
    </AppWindow>
  );
}

export function WishlistPage() {
  const { wishlist, saveWishlistItem } = useFinanceWorkspace();
  const [name, setName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  return (
    <AppWindow title="Wishlist" icon="⭐" statusText="Manual priority list">
      <AppGroupBox label="Add Wishlist Item">
        <div className="form-grid compact">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Item name" />
          <input value={estimatedCost} onChange={(event) => setEstimatedCost(event.target.value)} type="number" placeholder="Estimated cost" />
          <AppButton
            variant="primary"
            onClick={() => {
              if (!name || !estimatedCost) return;
              saveWishlistItem({ name, estimatedCost: Number(estimatedCost) });
              setName("");
              setEstimatedCost("");
            }}
          >
            Add Item
          </AppButton>
        </div>
      </AppGroupBox>
      <div className="list-stack">
        {wishlist
          .sort((a, b) => a.priority - b.priority)
          .map((item) => (
            <AppPanel key={item.id}>
              <div className="row-between">
                <strong>{item.priority}. {item.name}</strong>
                <span>{formatCurrency(item.estimatedCost)}</span>
              </div>
            </AppPanel>
          ))}
      </div>
    </AppWindow>
  );
}

export function ForecastPage() {
  const { summary, recurring } = useFinanceWorkspace();

  return (
    <AppWindow title="Forecast" icon="📈" statusText="Subscriptions and recurring charges included">
      <div className="two-column">
        <AppCard>
          <SectionHeading title="Balance Curve" subtitle="Next 30 days" />
          <ForecastChart points={summary.points} />
        </AppCard>
        <AppCard>
          <SectionHeading title="Upcoming Events" subtitle="Projected pressure points" />
          <div className="list-stack">
            {recurring.map((item) => (
              <AppPanel key={item.id}>
                <div className="row-between">
                  <strong>{item.name}</strong>
                  <span>{item.nextRunDate}</span>
                </div>
                <span>{formatCurrency(item.amount)} · {item.billingCycle}</span>
              </AppPanel>
            ))}
          </div>
        </AppCard>
      </div>
    </AppWindow>
  );
}

export function AllocationsPage() {
  const { categories, allocationRules, monthlyIncome, saveAllocationRule, applyAllocationPreset } = useFinanceWorkspace();
  const allocationReport = useAllocationSummary();
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const expenseCategoryIds = categories.filter((category) => category.kind !== "income").map((category) => category.id);
  const totalPercentage = allocationRules.reduce((sum, rule) => sum + rule.percentage, 0);

  return (
    <AppWindow title="Allocations" icon="🧮" statusText={`Allocation total ${totalPercentage}%`}>
      <div className="toolbar-row">
        <AppButton onClick={() => applyAllocationPreset("50-30-20")}>Apply 50/30/20</AppButton>
        <AppButton onClick={() => applyAllocationPreset("70-20-10")}>Apply 70/20/10</AppButton>
        <MetricCard label="Unallocated" value={formatCurrency(getUnallocatedAmount(monthlyIncome, allocationRules))} />
      </div>
      <AppGroupBox label="Create Rule">
        <div className="form-grid compact">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rule name" />
          <input value={percentage} onChange={(event) => setPercentage(event.target.value)} type="number" placeholder="Percentage" />
          <AppButton
            variant="primary"
            onClick={() => {
              if (!name || !percentage) return;
              saveAllocationRule({ name, percentage: Number(percentage), categoryIds: expenseCategoryIds });
              setName("");
              setPercentage("");
            }}
          >
            Save Rule
          </AppButton>
        </div>
      </AppGroupBox>
      <div className="three-grid">
        {allocationReport.map((entry) => (
          <AppCard key={entry.rule.id}>
            <div className="row-between">
              <strong>{entry.rule.name}</strong>
              <StatusBadge status={entry.health} />
            </div>
            <p>Target {formatCurrency(entry.targetAmount)}</p>
            <p>Actual {formatCurrency(entry.actualAmount)}</p>
            <ProgressBar
              value={entry.actualAmount}
              max={Math.max(entry.targetAmount, 1)}
              tone={entry.health === "over" ? "danger" : entry.health === "under" ? "warning" : "normal"}
            />
          </AppCard>
        ))}
      </div>
    </AppWindow>
  );
}

export function SubscriptionsPage() {
  const { categories, recurring, toggleRecurringPause, saveSubscription } = useFinanceWorkspace();
  const subscriptionSummary = useSubscriptionSummary();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [nextRunDate, setNextRunDate] = useState("2026-05-05");
  const [categoryId, setCategoryId] = useState(
    categories.find((category) => category.kind !== "income")?.id ?? "",
  );

  return (
    <AppWindow title="Subscriptions" icon="🔁" statusText={`${subscriptionSummary.activeCount} active services`}>
      <div className="metric-grid">
        <MetricCard label="Monthly Cost" value={formatCurrency(subscriptionSummary.totalMonthlyCost)} />
        <MetricCard label="Annual Equivalent" value={formatCurrency(subscriptionSummary.totalAnnualEquivalent)} />
        <MetricCard label="Active" value={String(subscriptionSummary.activeCount)} />
        <MetricCard label="Paused" value={String(subscriptionSummary.pausedCount)} />
      </div>
      <AppGroupBox label="Add Subscription">
        <div className="form-grid compact">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Service name" />
          <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" placeholder="Amount" />
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.filter((category) => category.kind !== "income").map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input value={nextRunDate} onChange={(event) => setNextRunDate(event.target.value)} type="date" />
          <AppButton
            variant="primary"
            onClick={() => {
              if (!name || !amount) return;
              saveSubscription({
                name,
                amount: Number(amount),
                categoryId,
                billingCycle: "monthly",
                nextRunDate,
                providerName: name,
              });
              setName("");
              setAmount("");
            }}
          >
            Add Subscription
          </AppButton>
        </div>
      </AppGroupBox>
      <div className="list-stack">
        {recurring.filter((item) => item.isSubscription).map((item) => (
          <AppPanel key={item.id}>
            <div className="row-between">
              <div>
                <strong>{item.name}</strong>
                <p>{formatCurrency(item.amount)} · {item.billingCycle} · {item.nextRunDate}</p>
              </div>
              <div className="toolbar-row">
                <StatusBadge status={item.isPaused ? "paused" : item.trialEndDate ? "trial" : "active"} />
                <AppButton onClick={() => toggleRecurringPause(item.id)}>
                  {item.isPaused ? "Resume" : "Pause"}
                </AppButton>
              </div>
            </div>
          </AppPanel>
        ))}
      </div>
    </AppWindow>
  );
}

export function SettingsPage() {
  const { categories, currentMonth } = useFinanceWorkspace();
  const salarySummary = useCurrentUserSalarySummary();

  return (
    <AppWindow title="Settings" icon="⚙" statusText="Workspace and schema handoff ready">
      <div className="two-column">
        <AppCard>
          <SectionHeading title="Salary Breakdown" subtitle={currentMonth} />
          <div className="list-stack">
            <AppPanel><div className="row-between"><span>Gross pay</span><CurrencyText value={salarySummary.grossIncome} /></div></AppPanel>
            <AppPanel><div className="row-between"><span>Spending</span><CurrencyText value={salarySummary.spending} /></div></AppPanel>
            <AppPanel><div className="row-between"><span>Remaining</span><CurrencyText value={salarySummary.remaining} /></div></AppPanel>
          </div>
        </AppCard>
        <AppCard>
          <SectionHeading title="Category Setup" subtitle="Starter taxonomy" />
          <div className="tag-cloud">
            {categories.map((category) => (
              <span key={category.id} className="tag-pill">{category.name}</span>
            ))}
          </div>
          <p className="muted-text">The Supabase schema includes these core entities and row-level security defaults for a personal workspace setup.</p>
        </AppCard>
      </div>
    </AppWindow>
  );
}
