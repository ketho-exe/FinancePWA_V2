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
  EmptyState,
  ForecastChart,
  MetricCard,
  ProgressBar,
  QuickStat,
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
    transactions,
  } = useFinanceWorkspace();
  const subscriptions = useSubscriptionSummary();
  const upcomingBills = recurring.filter((item) => !item.isPaused).slice(0, 4);
  const recentTransactions = transactions.slice(0, 5);
  const totalBalance = monthlyIncome - monthlySpending;
  const accountSnapshot = [
    { name: "Main current account", amount: totalBalance * 0.72 },
    { name: "Savings pot", amount: savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0) },
    { name: "Bills buffer", amount: Math.max(summary.safeToSpend * 0.35, 0) },
  ];

  return (
    <div className="page-stack">
      <AppWindow
        title={`Dashboard`}
        icon="📊"
        statusText={`Live overview for ${formatMonth(new Date(`${currentMonth}-01`))}`}
        action={<AppButton variant="primary">Add transaction</AppButton>}
      >
        <div className="metric-grid">
          <MetricCard label="Current total balance" value={formatCurrency(totalBalance)} tone={totalBalance >= 0 ? "positive" : "negative"} />
          <MetricCard label="Income This Month" value={formatCurrency(monthlyIncome)} tone="positive" />
          <MetricCard label="Spending This Month" value={formatCurrency(monthlySpending)} tone="negative" />
          <MetricCard label="Remaining budget" value={formatCurrency(summary.safeToSpend)} hint={`${subscriptions.activeCount} active subscriptions`} />
        </div>
        <div className="two-column">
          <AppCard>
            <SectionHeading title="Cash flow" subtitle="30 day forward look" />
            <ForecastChart points={summary.points} />
            <div className="toolbar-row">
              <QuickStat label="Salary next payday" value={formatCurrency(monthlyIncome || 0)} tone="positive" />
              <QuickStat label="Bills in 7 days" value={String(upcomingBills.length)} />
              <QuickStat label="Large alerts" value={String(transactions.filter((item) => Math.abs(item.amount) >= 250).length)} tone="negative" />
            </div>
          </AppCard>
          <AppCard>
            <SectionHeading title="Upcoming bills" subtitle="Due soon and recurring commitments" />
            <div className="list-stack">
              {upcomingBills.map((item) => (
                <AppPanel key={item.id}>
                  <div className="row-between">
                    <strong>{item.name}</strong>
                    <StatusBadge status={item.isPaused ? "paused" : "active"} />
                  </div>
                  <p>{item.nextRunDate} · {formatCurrency(item.amount)} · {item.billingCycle}</p>
                </AppPanel>
              ))}
            </div>
          </AppCard>
        </div>
        <div className="two-column">
          <AppCard>
            <SectionHeading title="Goal progress" subtitle="Savings and planned milestones" />
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
            <SectionHeading title="Account balances snapshot" subtitle="Quick financial position" />
            <div className="list-stack">
              {accountSnapshot.map((account) => (
                <AppPanel key={account.name}>
                  <div className="row-between">
                    <strong>{account.name}</strong>
                    <span>{formatCurrency(account.amount)}</span>
                  </div>
                  <span className="muted-text">Estimated snapshot</span>
                </AppPanel>
              ))}
            </div>
          </AppCard>
        </div>
        <AppCard>
          <SectionHeading title="Recent transactions" subtitle="Latest activity across your workspace" />
          <DataTable
            headers={["Date", "Description", "Category", "Amount"]}
            rows={recentTransactions.map((transaction) => [
              transaction.date,
              transaction.description,
              categoryName(transaction.categoryId, categories),
              formatCurrency(transaction.amount),
            ])}
          />
        </AppCard>
      </AppWindow>
    </div>
  );
}

export function TransactionsPage() {
  const { categories, transactions, saveTransaction, deleteTransaction } = useFinanceWorkspace();
  const [draft, setDraft] = useState({
    description: "",
    amount: "",
    categoryId: categories[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveTransaction({
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
        headers={["Date", "Description", "Category", "Amount", "Actions"]}
        rows={transactions.map((transaction) => [
          transaction.date,
          transaction.description,
          categoryName(transaction.categoryId, categories),
          formatCurrency(transaction.amount),
          <AppButton
            key={`delete-${transaction.id}`}
            variant="danger"
            onClick={() => void deleteTransaction(transaction.id)}
          >
            Delete
          </AppButton>,
        ])}
      />
    </AppWindow>
  );
}

export function BudgetsPage() {
  const { budgets, categories, currentMonth, saveBudget, deleteBudget } = useFinanceWorkspace();
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
              void saveBudget({ categoryId, amount: Number(amount), month: currentMonth });
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
              <div className="row-between">
                <strong>{categoryName(budget.categoryId, categories)}</strong>
                <AppButton variant="danger" onClick={() => void deleteBudget(budget.id)}>
                  Delete
                </AppButton>
              </div>
              <p>{formatCurrency(budget.amount)}</p>
            </AppCard>
          ))}
      </div>
    </AppWindow>
  );
}

export function SavingsPage() {
  const { savingsGoals, saveSavingsGoal, deleteSavingsGoal } = useFinanceWorkspace();
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
              void saveSavingsGoal({ name, targetAmount: Number(targetAmount) });
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
            <div className="toolbar-row">
              <div />
              <AppButton variant="danger" onClick={() => void deleteSavingsGoal(goal.id)}>
                Delete Goal
              </AppButton>
            </div>
            <p className="card-stat">{formatCurrency(goal.currentAmount)} saved</p>
            <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
          </AppWindow>
        ))}
      </div>
    </AppWindow>
  );
}

export function WishlistPage() {
  const { wishlist, saveWishlistItem, deleteWishlistItem } = useFinanceWorkspace();
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
              void saveWishlistItem({ name, estimatedCost: Number(estimatedCost) });
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
                <div className="toolbar-row">
                  <span>{formatCurrency(item.estimatedCost)}</span>
                  <AppButton variant="danger" onClick={() => void deleteWishlistItem(item.id)}>
                    Delete
                  </AppButton>
                </div>
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
  const {
    categories,
    allocationRules,
    monthlyIncome,
    saveAllocationRule,
    deleteAllocationRule,
    applyAllocationPreset,
  } = useFinanceWorkspace();
  const allocationReport = useAllocationSummary();
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");
  const expenseCategoryIds = categories.filter((category) => category.kind !== "income").map((category) => category.id);
  const totalPercentage = allocationRules.reduce((sum, rule) => sum + rule.percentage, 0);

  return (
    <AppWindow title="Allocations" icon="🧮" statusText={`Allocation total ${totalPercentage}%`}>
      <div className="toolbar-row">
        <AppButton onClick={() => void applyAllocationPreset("50-30-20")}>Apply 50/30/20</AppButton>
        <AppButton onClick={() => void applyAllocationPreset("70-20-10")}>Apply 70/20/10</AppButton>
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
              void saveAllocationRule({
                name,
                percentage: Number(percentage),
                categoryIds: expenseCategoryIds,
              });
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
              <div className="toolbar-row">
                <StatusBadge status={entry.health} />
                <AppButton variant="danger" onClick={() => void deleteAllocationRule(entry.rule.id)}>
                  Delete
                </AppButton>
              </div>
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
  const {
    categories,
    recurring,
    toggleRecurringPause,
    deleteRecurringTransaction,
    saveSubscription,
  } = useFinanceWorkspace();
  const subscriptionSummary = useSubscriptionSummary();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [nextRunDate, setNextRunDate] = useState(new Date().toISOString().slice(0, 10));
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
              void saveSubscription({
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
                <AppButton onClick={() => void toggleRecurringPause(item.id)}>
                  {item.isPaused ? "Resume" : "Pause"}
                </AppButton>
                <AppButton variant="danger" onClick={() => void deleteRecurringTransaction(item.id)}>
                  Delete
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
  const { categories, currentMonth, signOut } = useFinanceWorkspace();
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
          <SectionHeading title="Category Setup" subtitle="Starter taxonomy" action={<AppButton onClick={() => void signOut()}>Sign out</AppButton>} />
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

export function AccountsPage() {
  const { monthlyIncome, monthlySpending, savingsGoals, transactions } = useFinanceWorkspace();
  const accounts = [
    {
      name: "Main current account",
      type: "Bank account",
      balance: monthlyIncome - monthlySpending,
      detail: `${transactions.length} linked transactions`,
    },
    {
      name: "Savings account",
      type: "Savings",
      balance: savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
      detail: `${savingsGoals.length} tracked goals`,
    },
    {
      name: "Cash buffer",
      type: "Cash",
      balance: Math.max((monthlyIncome - monthlySpending) * 0.18, 0),
      detail: "Estimated wallet and buffer",
    },
  ];

  return (
    <AppWindow title="Accounts" icon="🏦" statusText="Multi-account management foundation">
      <div className="three-grid">
        {accounts.map((account) => (
          <AppCard key={account.name}>
            <StatusBadge status="active" />
            <h3>{account.name}</h3>
            <p className="muted-text">{account.type}</p>
            <p className="card-stat">{formatCurrency(account.balance)}</p>
            <p className="muted-text">{account.detail}</p>
          </AppCard>
        ))}
      </div>
      <AppCard>
        <SectionHeading
          title="What comes next"
          subtitle="This page is ready for full account models, transfers, reconciliation, and imports."
          action={<AppButton variant="primary">Add account</AppButton>}
        />
        <div className="three-grid">
          <QuickStat label="Supported types" value="Bank, savings, cash, credit" />
          <QuickStat label="Transfer flow" value="Planned" />
          <QuickStat label="Reconciliation" value="Planned" />
        </div>
      </AppCard>
    </AppWindow>
  );
}

export function BillsPage() {
  const { recurring } = useFinanceWorkspace();
  const dueSoon = recurring.filter((item) => !item.isPaused).slice(0, 6);

  return (
    <AppWindow title="Bills & Recurring" icon="🔁" statusText={`${dueSoon.length} active upcoming items`}>
      <div className="metric-grid">
        <MetricCard label="Upcoming payments" value={String(dueSoon.length)} />
        <MetricCard label="Paused rules" value={String(recurring.filter((item) => item.isPaused).length)} />
        <MetricCard label="Subscriptions" value={String(recurring.filter((item) => item.isSubscription).length)} />
        <MetricCard label="Due soon" value={String(dueSoon.filter((item) => !item.isPaused).length)} />
      </div>
      <AppCard>
        <SectionHeading title="Upcoming payments" subtitle="Recurring items and reminders" />
        <div className="list-stack">
          {dueSoon.map((item) => (
            <AppPanel key={item.id}>
              <div className="row-between">
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted-text">{item.nextRunDate} · {item.billingCycle}</p>
                </div>
                <div className="toolbar-row">
                  <StatusBadge status={item.isPaused ? "paused" : "due"} />
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              </div>
            </AppPanel>
          ))}
        </div>
      </AppCard>
    </AppWindow>
  );
}

export function GoalsPage() {
  const { savingsGoals, wishlist } = useFinanceWorkspace();

  return (
    <AppWindow title="Goals" icon="🎯" statusText="Savings goals and wishlist planning">
      <div className="two-column">
        <AppCard>
          <SectionHeading title="Savings goals" subtitle="Track progress and completion" />
          <div className="list-stack">
            {savingsGoals.length === 0 ? (
              <EmptyState title="No goals yet" body="Create a savings or debt goal to start tracking progress." />
            ) : (
              savingsGoals.map((goal) => (
                <AppPanel key={goal.id}>
                  <div className="row-between">
                    <strong>{goal.name}</strong>
                    <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
                </AppPanel>
              ))
            )}
          </div>
        </AppCard>
        <AppCard>
          <SectionHeading title="Planned purchases" subtitle="Wishlist items to convert into goals" />
          <div className="list-stack">
            {wishlist.length === 0 ? (
              <EmptyState title="No planned purchases" body="Add wishlist items and convert the important ones into tracked goals." />
            ) : (
              wishlist.map((item) => (
                <AppPanel key={item.id}>
                  <div className="row-between">
                    <strong>{item.name}</strong>
                    <span>{formatCurrency(item.estimatedCost)}</span>
                  </div>
                </AppPanel>
              ))
            )}
          </div>
        </AppCard>
      </div>
    </AppWindow>
  );
}

export function ReportsPage() {
  const { monthlyIncome, monthlySpending, summary } = useFinanceWorkspace();

  return (
    <AppWindow title="Reports" icon="📈" statusText="Modern reporting workspace">
      <div className="three-grid">
        <AppCard>
          <h3>Monthly summary</h3>
          <p className="card-stat">{formatCurrency(monthlyIncome - monthlySpending)}</p>
          <p className="muted-text">Net movement this month</p>
        </AppCard>
        <AppCard>
          <h3>Cash flow</h3>
          <p className="card-stat">{formatCurrency(summary.projectedBalance)}</p>
          <p className="muted-text">Projected balance</p>
        </AppCard>
        <AppCard>
          <h3>Budget variance</h3>
          <p className="card-stat">{String(summary.budgetRisk.length)}</p>
          <p className="muted-text">Tracked budget lines</p>
        </AppCard>
      </div>
      <AppCard>
        <SectionHeading title="Planned report suite" subtitle="Category breakdowns, trends, exports, and net worth" />
        <div className="three-grid">
          <QuickStat label="Category breakdown" value="Ready to add" />
          <QuickStat label="Trend charts" value="Ready to add" />
          <QuickStat label="CSV / PDF export" value="Ready to add" />
        </div>
      </AppCard>
    </AppWindow>
  );
}

export function NotificationsPage() {
  const { recurring, budgets, transactions } = useFinanceWorkspace();
  const notifications = [
    `${recurring.filter((item) => !item.isPaused).length} recurring items need monitoring`,
    `${budgets.length} active budgets available for threshold alerts`,
    `${transactions.filter((item) => Math.abs(item.amount) >= 250).length} large transactions this month`,
  ];

  return (
    <AppWindow title="Notifications" icon="🔔" statusText="Alerts, reminders, and finance events">
      <div className="list-stack">
        {notifications.map((notification) => (
          <AppPanel key={notification}>
            <div className="row-between">
              <strong>{notification}</strong>
              <StatusBadge status="warning" />
            </div>
          </AppPanel>
        ))}
      </div>
      <AppCard>
        <SectionHeading title="Notification center roadmap" subtitle="Bill reminders, budget alerts, salary events, and unusual activity" />
        <p className="muted-text">This screen is ready to become the home for persisted alert events once the notifications module lands.</p>
      </AppCard>
    </AppWindow>
  );
}

export function DataPage() {
  return (
    <AppWindow title="Data" icon="🗂️" statusText="Import, export, backup, and restore">
      <div className="three-grid">
        <AppCard>
          <h3>Import</h3>
          <p className="muted-text">CSV and bank statement ingestion with preview, mapping, and duplicate detection.</p>
          <AppButton variant="primary">Import data</AppButton>
        </AppCard>
        <AppCard>
          <h3>Export</h3>
          <p className="muted-text">Full workspace export, transaction export, and report packaging.</p>
          <AppButton>Export data</AppButton>
        </AppCard>
        <AppCard>
          <h3>Backup</h3>
          <p className="muted-text">Managed backup history with restore preview and dry-run checks.</p>
          <AppButton>Backups</AppButton>
        </AppCard>
      </div>
    </AppWindow>
  );
}
