"use client";

import { ChangeEvent, FormEvent, useState } from "react";
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
import { normalizeImportRows, parseCsvText, type ParsedImportRow } from "@/lib/import-export";
import {
  buildCategoryBreakdownReport,
  buildMonthlySummaryCsv,
  buildMonthlySummaryReport,
  buildTransactionsCsv,
  buildTrendReport,
  buildWorkspaceBackup,
  downloadTextFile,
} from "@/lib/reports";
import { AccountKind } from "@/lib/types";
import { formatCurrency, formatMonth } from "@/lib/utils";

function categoryName(categoryId: string, categories: { id: string; name: string }[]) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Unknown";
}

export function DashboardPage() {
  const {
    accounts,
    currentMonth,
    summary,
    monthlyIncome,
    monthlySpending,
    savingsGoals,
    categories,
    recurring,
    transactions,
    nextPayDate,
    salaryBreakdown,
  } = useFinanceWorkspace();
  const subscriptions = useSubscriptionSummary();
  const upcomingBills = recurring.filter((item) => !item.isPaused).slice(0, 4);
  const recentTransactions = transactions.slice(0, 5);
  const totalBalance = monthlyIncome - monthlySpending;
  const accountSnapshot =
    accounts.length > 0
      ? accounts
      : [
          { id: "fallback-main", name: "Main current account", currentBalance: totalBalance },
          {
            id: "fallback-savings",
            name: "Savings pot",
            currentBalance: savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
          },
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
              <QuickStat
                label={`Salary ${nextPayDate ? `on ${nextPayDate}` : "next payday"}`}
                value={formatCurrency(
                  salaryBreakdown ? salaryBreakdown.annualTakeHome / 12 : monthlyIncome || 0,
                )}
                tone="positive"
              />
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
                <AppPanel key={account.id}>
                  <div className="row-between">
                    <strong>{account.name}</strong>
                    <span>{formatCurrency(account.currentBalance)}</span>
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
  const { accounts, categories, transactions, saveTransaction, deleteTransaction } = useFinanceWorkspace();
  const [draft, setDraft] = useState({
    description: "",
    amount: "",
    accountId: accounts[0]?.id ?? "",
    categoryId: categories[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveTransaction({
      description: draft.description,
      amount: Number(draft.amount),
      accountId: draft.accountId,
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
          <select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
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
        headers={["Date", "Description", "Account", "Category", "Amount", "Actions"]}
        rows={transactions.map((transaction) => [
          transaction.date,
          transaction.description,
          accounts.find((account) => account.id === transaction.accountId)?.name ?? "Unassigned",
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
  const { categories, currentMonth, salaryProfile, saveSalaryProfile, deleteSalaryProfile, signOut } =
    useFinanceWorkspace();
  const salarySummary = useCurrentUserSalarySummary();
  const [salaryDraft, setSalaryDraft] = useState({
    taxRegion: salaryProfile?.taxRegion ?? ("england_wales_ni" as const),
    annualGrossSalary: String(salaryProfile?.annualGrossSalary ?? 42000),
    taxCode: salaryProfile?.taxCode ?? "1257L",
    payFrequency: salaryProfile?.payFrequency ?? ("monthly" as const),
    payDateRule: salaryProfile?.payDateRule ?? "28th",
    pensionContribution: String(salaryProfile?.pensionContribution ?? 5),
    studentLoanPlan: salaryProfile?.studentLoanPlan ?? "none",
    postgraduateLoan: salaryProfile?.postgraduateLoan ?? false,
    effectiveDate: salaryProfile?.effectiveDate ?? new Date().toISOString().slice(0, 10),
  });

  return (
    <AppWindow title="Settings" icon="⚙" statusText="Workspace and schema handoff ready">
      <div className="two-column">
        <AppCard>
          <SectionHeading title="Salary Breakdown" subtitle={currentMonth} />
          <div className="list-stack">
            <AppPanel><div className="row-between"><span>Gross pay</span><CurrencyText value={salarySummary.grossIncome} /></div></AppPanel>
            <AppPanel><div className="row-between"><span>Spending</span><CurrencyText value={salarySummary.spending} /></div></AppPanel>
            <AppPanel><div className="row-between"><span>Remaining</span><CurrencyText value={salarySummary.remaining} /></div></AppPanel>
            <AppPanel><div className="row-between"><span>Next pay date</span><span>{salarySummary.nextPayDate ?? "Not configured"}</span></div></AppPanel>
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
      <AppCard>
        <SectionHeading
          title="Salary Profile"
          subtitle="UK payroll basics for dashboard and reporting"
          action={
            salaryProfile ? (
              <AppButton variant="danger" onClick={() => void deleteSalaryProfile()}>
                Delete salary profile
              </AppButton>
            ) : null
          }
        />
        <div className="three-grid">
          <select value={salaryDraft.taxRegion} onChange={(event) => setSalaryDraft({ ...salaryDraft, taxRegion: event.target.value as "england_wales_ni" | "scotland" })}>
            <option value="england_wales_ni">England / Wales / NI</option>
            <option value="scotland">Scotland</option>
          </select>
          <input type="number" value={salaryDraft.annualGrossSalary} onChange={(event) => setSalaryDraft({ ...salaryDraft, annualGrossSalary: event.target.value })} placeholder="Annual gross salary" />
          <input value={salaryDraft.taxCode} onChange={(event) => setSalaryDraft({ ...salaryDraft, taxCode: event.target.value })} placeholder="Tax code" />
          <select value={salaryDraft.payFrequency} onChange={(event) => setSalaryDraft({ ...salaryDraft, payFrequency: event.target.value as "weekly" | "biweekly" | "four_weekly" | "monthly" })}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="four_weekly">Four-weekly</option>
          </select>
          <input value={salaryDraft.payDateRule} onChange={(event) => setSalaryDraft({ ...salaryDraft, payDateRule: event.target.value })} placeholder="Pay date rule" />
          <input type="date" value={salaryDraft.effectiveDate} onChange={(event) => setSalaryDraft({ ...salaryDraft, effectiveDate: event.target.value })} />
          <input type="number" value={salaryDraft.pensionContribution} onChange={(event) => setSalaryDraft({ ...salaryDraft, pensionContribution: event.target.value })} placeholder="Pension %" />
          <select value={salaryDraft.studentLoanPlan} onChange={(event) => setSalaryDraft({ ...salaryDraft, studentLoanPlan: event.target.value })}>
            <option value="none">No student loan</option>
            <option value="plan_1">Plan 1</option>
            <option value="plan_2">Plan 2</option>
            <option value="plan_4">Plan 4</option>
            <option value="plan_5">Plan 5</option>
          </select>
          <label className="tag-pill">
            <input type="checkbox" checked={salaryDraft.postgraduateLoan} onChange={(event) => setSalaryDraft({ ...salaryDraft, postgraduateLoan: event.target.checked })} />
            <span>Postgraduate loan</span>
          </label>
        </div>
        <div className="toolbar-row">
          <AppButton
            variant="primary"
            onClick={() =>
              void saveSalaryProfile({
                taxRegion: salaryDraft.taxRegion,
                annualGrossSalary: Number(salaryDraft.annualGrossSalary),
                taxCode: salaryDraft.taxCode,
                payFrequency: salaryDraft.payFrequency,
                payDateRule: salaryDraft.payDateRule,
                pensionContribution: Number(salaryDraft.pensionContribution || 0),
                studentLoanPlan: salaryDraft.studentLoanPlan,
                postgraduateLoan: salaryDraft.postgraduateLoan,
                effectiveDate: salaryDraft.effectiveDate,
              })
            }
          >
            Save salary profile
          </AppButton>
        </div>
      </AppCard>
    </AppWindow>
  );
}

export function AccountsPage() {
  const { accounts, saveAccount, deleteAccount, transactions } = useFinanceWorkspace();
  const [draft, setDraft] = useState<{
    name: string;
    kind: AccountKind;
    institution: string;
    currency: string;
    openingBalance: string;
    maskedReference: string;
  }>({
    name: "",
    kind: "bank",
    institution: "",
    currency: "GBP",
    openingBalance: "",
    maskedReference: "",
  });

  return (
    <AppWindow title="Accounts" icon="🏦" statusText="Multi-account management foundation">
      <AppGroupBox label="Add account">
        <div className="form-grid">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Account name" />
          <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as AccountKind })}>
            <option value="bank">Bank</option>
            <option value="savings">Savings</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit card</option>
            <option value="loan">Loan</option>
            <option value="investment">Investment</option>
          </select>
          <input value={draft.institution} onChange={(event) => setDraft({ ...draft, institution: event.target.value })} placeholder="Institution" />
          <input value={draft.openingBalance} onChange={(event) => setDraft({ ...draft, openingBalance: event.target.value })} type="number" placeholder="Opening balance" />
          <AppButton
            variant="primary"
            onClick={() => {
              if (!draft.name || !draft.openingBalance) return;
              void saveAccount({
                name: draft.name,
                kind: draft.kind,
                institution: draft.institution,
                currency: draft.currency,
                openingBalance: Number(draft.openingBalance),
                maskedReference: draft.maskedReference,
              });
              setDraft({ ...draft, name: "", institution: "", openingBalance: "", maskedReference: "" });
            }}
          >
            Add account
          </AppButton>
        </div>
      </AppGroupBox>
      <div className="three-grid">
        {accounts.map((account) => (
          <AppCard key={account.id}>
            <StatusBadge status="active" />
            <div className="row-between">
              <h3>{account.name}</h3>
              <AppButton variant="danger" onClick={() => void deleteAccount(account.id)}>
                Archive
              </AppButton>
            </div>
            <p className="muted-text">{account.kind} {account.institution ? `· ${account.institution}` : ""}</p>
            <p className="card-stat">{formatCurrency(account.currentBalance)}</p>
            <p className="muted-text">
              {transactions.filter((transaction) => transaction.accountId === account.id).length} linked transactions
            </p>
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
  const { accounts, categories, recurring, markBillAsPaid, saveBill } = useFinanceWorkspace();
  const bills = recurring.filter((item) => item.isBill);
  const dueSoon = bills.filter((item) => item.dueStatus !== "paid").slice(0, 6);
  const [draft, setDraft] = useState<{
    name: string;
    amount: string;
    categoryId: string;
    linkedAccountId: string;
    billingCycle: "weekly" | "monthly" | "quarterly" | "annual";
    nextRunDate: string;
    autopostEnabled: boolean;
  }>({
    name: "",
    amount: "",
    categoryId: categories.find((item) => item.kind !== "income")?.id ?? "",
    linkedAccountId: accounts[0]?.id ?? "",
    billingCycle: "monthly" as const,
    nextRunDate: new Date().toISOString().slice(0, 10),
    autopostEnabled: true,
  });

  return (
    <AppWindow title="Bills & Recurring" icon="🔁" statusText={`${dueSoon.length} active upcoming items`}>
      <div className="metric-grid">
        <MetricCard label="Upcoming payments" value={String(dueSoon.length)} />
        <MetricCard label="Paused rules" value={String(bills.filter((item) => item.isPaused).length)} />
        <MetricCard label="Subscriptions" value={String(recurring.filter((item) => item.isSubscription).length)} />
        <MetricCard label="Overdue" value={String(bills.filter((item) => item.dueStatus === "overdue").length)} />
      </div>
      <AppGroupBox label="Add Bill">
        <div className="form-grid">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Bill name" />
          <input value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} type="number" placeholder="Amount" />
          <select value={draft.linkedAccountId} onChange={(event) => setDraft({ ...draft, linkedAccountId: event.target.value })}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
          <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
            {categories.filter((category) => category.kind !== "income").map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select value={draft.billingCycle} onChange={(event) => setDraft({ ...draft, billingCycle: event.target.value as "weekly" | "monthly" | "quarterly" | "annual" })}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
          <input value={draft.nextRunDate} onChange={(event) => setDraft({ ...draft, nextRunDate: event.target.value })} type="date" />
          <label className="tag-pill">
            <input type="checkbox" checked={draft.autopostEnabled} onChange={(event) => setDraft({ ...draft, autopostEnabled: event.target.checked })} />
            <span>Auto-post</span>
          </label>
          <AppButton
            variant="primary"
            onClick={() => {
              if (!draft.name || !draft.amount) return;
              void saveBill({
                name: draft.name,
                amount: Number(draft.amount),
                categoryId: draft.categoryId,
                linkedAccountId: draft.linkedAccountId,
                billingCycle: draft.billingCycle,
                nextRunDate: draft.nextRunDate,
                autopostEnabled: draft.autopostEnabled,
              });
              setDraft({ ...draft, name: "", amount: "" });
            }}
          >
            Add bill
          </AppButton>
        </div>
      </AppGroupBox>
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
                  <StatusBadge
                    status={
                      item.isPaused
                        ? "paused"
                        : item.dueStatus === "overdue"
                          ? "danger"
                          : item.dueStatus === "due_soon"
                            ? "warning"
                            : item.dueStatus === "paid"
                              ? "safe"
                              : "active"
                    }
                  />
                  <span>{formatCurrency(item.amount)}</span>
                  <AppButton onClick={() => void markBillAsPaid(item.id)}>
                    Mark paid
                  </AppButton>
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
  const { accounts, categories, currentMonth, salaryBreakdown, summary, transactions } =
    useFinanceWorkspace();
  const monthlySummary = buildMonthlySummaryReport(currentMonth, transactions, categories);
  const categoryBreakdown = buildCategoryBreakdownReport(currentMonth, transactions, categories);
  const trendMonths = Array.from({ length: 4 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (3 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const trendReport = buildTrendReport(transactions, categories, trendMonths);
  const accountLookup = new Map(accounts.map((account) => [account.id, account.name]));

  return (
    <AppWindow
      title="Reports"
      icon="📈"
      statusText="Modern reporting workspace"
      action={
        <AppButton
          onClick={() =>
            downloadTextFile(
              `finance-summary-${currentMonth}.csv`,
              buildMonthlySummaryCsv(monthlySummary, categoryBreakdown),
              "text/csv;charset=utf-8",
            )
          }
        >
          Export summary CSV
        </AppButton>
      }
    >
      <div className="three-grid">
        <AppCard>
          <h3>Monthly summary</h3>
          <p className="card-stat">{formatCurrency(monthlySummary.net)}</p>
          <p className="muted-text">Net movement this month</p>
        </AppCard>
        <AppCard>
          <h3>Cash flow</h3>
          <p className="card-stat">{formatCurrency(summary.projectedBalance)}</p>
          <p className="muted-text">Projected balance</p>
        </AppCard>
        <AppCard>
          <h3>Net worth base</h3>
          <p className="card-stat">{formatCurrency(accounts.reduce((sum, account) => sum + account.currentBalance, 0))}</p>
          <p className="muted-text">Across live accounts</p>
        </AppCard>
      </div>
      <AppCard>
        <SectionHeading title="Category breakdown" subtitle={`Spending by category for ${currentMonth}`} />
        {categoryBreakdown.length === 0 ? (
          <EmptyState title="No spending data" body="Add expense transactions to see category reporting." />
        ) : (
          <DataTable
            headers={["Category", "Amount"]}
            rows={categoryBreakdown.map((row) => [row.category, formatCurrency(row.amount)])}
          />
        )}
      </AppCard>
      <AppCard>
        <SectionHeading title="Trend report" subtitle="Income, spending, and net movement over the last months" />
        <DataTable
          headers={["Month", "Income", "Expenses", "Net"]}
          rows={trendReport.map((row) => [
            row.month,
            formatCurrency(row.income),
            formatCurrency(row.expenses),
            formatCurrency(row.net),
          ])}
        />
      </AppCard>
      <AppCard>
        <SectionHeading title="Report actions" subtitle="Exports and downstream analysis" />
        <div className="three-grid">
          <QuickStat label="Category breakdown" value={String(categoryBreakdown.length)} />
          <QuickStat label="Trend charts" value={formatCurrency(summary.projectedBalance)} />
          <QuickStat label="Salary annual take-home" value={salaryBreakdown ? formatCurrency(salaryBreakdown.annualTakeHome) : "Not set"} />
        </div>
        <div className="toolbar-row">
          <AppButton
            onClick={() =>
              downloadTextFile(
                `transactions-${currentMonth}.csv`,
                buildTransactionsCsv(transactions, categories, accountLookup),
                "text/csv;charset=utf-8",
              )
            }
          >
            Export transactions CSV
          </AppButton>
        </div>
      </AppCard>
    </AppWindow>
  );
}

export function NotificationsPage() {
  const { markAllNotificationsRead, markNotificationRead, notifications, unreadNotifications } =
    useFinanceWorkspace();

  return (
    <AppWindow
      title="Notifications"
      icon="🔔"
      statusText={`${unreadNotifications} unread alerts`}
      action={
        notifications.length > 0 ? (
          <AppButton onClick={() => void markAllNotificationsRead()}>Mark all read</AppButton>
        ) : null
      }
    >
      <div className="list-stack">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications yet" body="Budget alerts, salary reminders, and bill notices will show up here." />
        ) : (
          notifications.map((notification) => (
            <AppPanel key={notification.id}>
              <div className="row-between">
                <div>
                  <strong>{notification.title}</strong>
                  <p className="muted-text">{notification.body}</p>
                </div>
                <div className="toolbar-row">
                  <StatusBadge status={notification.isRead ? "active" : "warning"} />
                  {!notification.isRead ? (
                    <AppButton onClick={() => void markNotificationRead(notification.id)}>
                      Mark read
                    </AppButton>
                  ) : null}
                </div>
              </div>
            </AppPanel>
          ))
        )}
      </div>
      <AppCard>
        <SectionHeading title="Notification center roadmap" subtitle="Bill reminders, budget alerts, salary events, and unusual activity" />
        <p className="muted-text">This screen is ready to become the home for persisted alert events once the notifications module lands.</p>
      </AppCard>
    </AppWindow>
  );
}

export function DataPage() {
  const {
    accounts,
    backups,
    backupWorkspace,
    categories,
    currentMonth,
    importTransactions,
    restoreWorkspace,
    transactions,
    ...snapshot
  } = useFinanceWorkspace();
  const accountLookup = new Map(accounts.map((account) => [account.id, account.name]));
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const transactionCsv = buildTransactionsCsv(transactions, categories, accountLookup);
  const backupJson = buildWorkspaceBackup({
    accounts,
    categories,
    transactions,
    budgets: snapshot.budgets,
    savingsGoals: snapshot.savingsGoals,
    wishlist: snapshot.wishlist,
    recurring: snapshot.recurring,
    allocationRules: snapshot.allocationRules,
    salaryProfile: snapshot.salaryProfile,
    notifications: snapshot.notifications,
    backups: [],
  });
  const normalizedRows = normalizeImportRows(parsedRows, {
    accounts,
    categories,
    transactions,
    budgets: snapshot.budgets,
    savingsGoals: snapshot.savingsGoals,
    wishlist: snapshot.wishlist,
    recurring: snapshot.recurring,
    allocationRules: snapshot.allocationRules,
    salaryProfile: snapshot.salaryProfile,
    notifications: snapshot.notifications,
    backups,
  });

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    void file.text().then((text) => {
      setParsedRows(parseCsvText(text));
    });
  }

  return (
    <AppWindow title="Data" icon="🗂️" statusText="Import, export, backup, and restore">
      <div className="three-grid">
        <AppCard>
          <h3>Import</h3>
          <p className="muted-text">CSV and bank statement ingestion with preview, mapping, and duplicate detection.</p>
          <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
          <AppButton
            variant="primary"
            onClick={() => void importTransactions(normalizedRows)}
            disabled={normalizedRows.length === 0}
          >
            Import data
          </AppButton>
        </AppCard>
        <AppCard>
          <h3>Export</h3>
          <p className="muted-text">Full workspace export, transaction export, and report packaging.</p>
          <AppButton
            onClick={() =>
              downloadTextFile(
                `transactions-${currentMonth}.csv`,
                transactionCsv,
                "text/csv;charset=utf-8",
              )
            }
          >
            Export data
          </AppButton>
        </AppCard>
        <AppCard>
          <h3>Backup</h3>
          <p className="muted-text">Managed backup history with restore preview and dry-run checks.</p>
          <div className="toolbar-row">
            <AppButton
              variant="primary"
              onClick={() => void backupWorkspace()}
            >
              Create backup
            </AppButton>
            <AppButton
            onClick={() =>
              downloadTextFile(
                `workspace-backup-${currentMonth}.json`,
                backupJson,
                "application/json;charset=utf-8",
              )
            }
          >
              Download JSON
            </AppButton>
          </div>
        </AppCard>
      </div>
      <AppCard>
        <SectionHeading title="Import preview" subtitle="Rows parsed from your CSV before commit" />
        {normalizedRows.length === 0 ? (
          <EmptyState title="No CSV loaded" body="Choose a CSV file with date, description, amount, and optional account/category columns." />
        ) : (
          <DataTable
            headers={["Date", "Description", "Account", "Category", "Amount"]}
            rows={normalizedRows.slice(0, 10).map((row) => [
              row.date,
              row.description,
              accountLookup.get(row.accountId ?? "") ?? "Default",
              categories.find((category) => category.id === row.categoryId)?.name ?? "Unknown",
              formatCurrency(row.amount),
            ])}
          />
        )}
      </AppCard>
      <AppCard>
        <SectionHeading title="Export preview" subtitle="Current workspace sizes and backup contents" />
        <div className="three-grid">
          <QuickStat label="Accounts" value={String(accounts.length)} />
          <QuickStat label="Transactions" value={String(transactions.length)} />
          <QuickStat label="Notifications" value={String(snapshot.notifications.length)} />
        </div>
        <DataTable
          headers={["Collection", "Rows"]}
          rows={[
            ["Accounts", String(accounts.length)],
            ["Transactions", String(transactions.length)],
            ["Budgets", String(snapshot.budgets.length)],
            ["Goals", String(snapshot.savingsGoals.length)],
            ["Recurring", String(snapshot.recurring.length)],
            ["Notifications", String(snapshot.notifications.length)],
          ]}
        />
      </AppCard>
      <AppCard>
        <SectionHeading title="Backup history" subtitle="Saved workspace snapshots ready for restore" />
        {backups.length === 0 ? (
          <EmptyState title="No backups yet" body="Create a backup before large imports or structural changes." />
        ) : (
          <DataTable
            headers={["Created", "Label", "Actions"]}
            rows={backups.map((backup) => [
              backup.createdAt.slice(0, 16).replace("T", " "),
              backup.label,
              <div key={backup.id} className="toolbar-row">
                <AppButton
                  onClick={() =>
                    downloadTextFile(
                      `${backup.label.replace(/\s+/g, "-").toLowerCase()}.json`,
                      buildWorkspaceBackup(backup.payload),
                      "application/json;charset=utf-8",
                    )
                  }
                >
                  Download
                </AppButton>
                <AppButton variant="danger" onClick={() => void restoreWorkspace(backup.id)}>
                  Restore
                </AppButton>
              </div>,
            ])}
          />
        )}
      </AppCard>
    </AppWindow>
  );
}
