import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  calculateUkSalaryProfile,
  getNextPayDate,
  getSalaryPeriodTakeHome,
  getSalaryScheduleOccurrences,
} from "@/lib/payroll";
import { getBillDueStatus, getRecurringOccurrences } from "@/lib/recurring";
import { SalaryProfile, WorkspaceSnapshot } from "@/lib/types";

const STARTER_CATEGORIES = [
  { name: "Salary", kind: "income", color: "#007700" },
  { name: "Freelance", kind: "income", color: "#006699" },
  { name: "Rent", kind: "expense", color: "#7b0000" },
  { name: "Groceries", kind: "expense", color: "#a55d00" },
  { name: "Transport", kind: "expense", color: "#4c4c4c" },
  { name: "Leisure", kind: "expense", color: "#000080" },
  { name: "Savings", kind: "savings", color: "#007700" },
] as const;

export const EMPTY_SNAPSHOT: WorkspaceSnapshot = {
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  savingsGoals: [],
  wishlist: [],
  recurring: [],
  allocationRules: [],
  salaryProfile: null,
  notifications: [],
  backups: [],
};

type DbClient = SupabaseClient;

async function ensureProfile(client: DbClient, user: User) {
  const { error } = await client.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
    display_name:
      (user.user_metadata.full_name as string | undefined) ??
      (user.email?.split("@")[0] ?? "Personal user"),
  });

  if (error) {
    throw error;
  }
}

async function ensureWorkspace(client: DbClient, user: User) {
  const { data: existingWorkspace, error: existingWorkspaceError } = await client
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingWorkspaceError) {
    throw existingWorkspaceError;
  }

  if (existingWorkspace) {
    return existingWorkspace.id as string;
  }

  const { data: createdWorkspace, error: createWorkspaceError } = await client
    .from("workspaces")
    .insert({
      owner_id: user.id,
      name: "Personal Workspace",
    })
    .select("id")
    .single();

  if (createWorkspaceError) {
    throw createWorkspaceError;
  }

  const workspaceId = createdWorkspace.id as string;

  const { error: categoryInsertError } = await client.from("categories").insert(
    STARTER_CATEGORIES.map((category) => ({
      workspace_id: workspaceId,
      ...category,
    })),
  );

  if (categoryInsertError) {
    throw categoryInsertError;
  }

  const { error: accountInsertError } = await client.from("accounts").insert({
    workspace_id: workspaceId,
    name: "Main account",
    kind: "bank",
    institution: "Personal bank",
    currency: "GBP",
    opening_balance: 0,
    masked_reference: "•••• 0000",
  });

  if (accountInsertError) {
    throw accountInsertError;
  }

  return workspaceId;
}

async function ensureStarterCategories(client: DbClient, workspaceId: string) {
  const { data: existing, error } = await client
    .from("categories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1);

  if (error) {
    throw error;
  }

  if ((existing ?? []).length > 0) {
    return;
  }

  const { error: insertError } = await client.from("categories").insert(
    STARTER_CATEGORIES.map((category) => ({
      workspace_id: workspaceId,
      ...category,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

export async function ensureWorkspaceForUser(client: DbClient, user: User) {
  await ensureProfile(client, user);
  const workspaceId = await ensureWorkspace(client, user);
  await ensureStarterCategories(client, workspaceId);
  return workspaceId;
}

async function syncNotifications(
  client: DbClient,
  workspaceId: string,
  snapshot: WorkspaceSnapshot,
  salaryProfile: SalaryProfile | null,
) {
  const now = new Date();
  const payload: Array<Record<string, string | boolean>> = [];

  for (const recurring of snapshot.recurring.filter((item) => !item.isPaused)) {
    const dueDate = new Date(recurring.nextRunDate);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 7) {
      payload.push({
        workspace_id: workspaceId,
        kind: "bill_due",
        title: `${recurring.name} due soon`,
        body: `${recurring.name} is due on ${recurring.nextRunDate} for £${Number(recurring.amount).toFixed(2)}.`,
        dedupe_key: `bill:${recurring.id}:${recurring.nextRunDate}`,
      });
    }
  }

  for (const budget of snapshot.budgets) {
    const spent = snapshot.transactions
      .filter((transaction) => transaction.categoryId === budget.categoryId)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    if (budget.amount > 0 && spent / budget.amount >= 0.85) {
      const categoryName =
        snapshot.categories.find((category) => category.id === budget.categoryId)?.name ?? "Budget";
      payload.push({
        workspace_id: workspaceId,
        kind: "budget_alert",
        title: `${categoryName} budget is nearly spent`,
        body: `${categoryName} is at ${Math.round((spent / budget.amount) * 100)}% of its budget.`,
        dedupe_key: `budget:${budget.id}:${budget.month}`,
      });
    }
  }

  for (const transaction of snapshot.transactions.filter((item) => Math.abs(item.amount) >= 250)) {
    payload.push({
      workspace_id: workspaceId,
      kind: "large_transaction",
      title: `Large transaction detected`,
      body: `${transaction.description} for £${Math.abs(transaction.amount).toFixed(2)} was recorded on ${transaction.date}.`,
      dedupe_key: `txn:${transaction.id}`,
    });
  }

  if (salaryProfile) {
    const breakdown = calculateUkSalaryProfile(salaryProfile);
    payload.push({
      workspace_id: workspaceId,
      kind: "salary",
      title: `Next payday: ${getNextPayDate(salaryProfile)}`,
      body: `Estimated take-home is £${getSalaryPeriodTakeHome(
        breakdown.annualTakeHome,
        salaryProfile.payFrequency,
      ).toFixed(2)} per ${salaryProfile.payFrequency.replace("_", "-")}.`,
      dedupe_key: `salary:${salaryProfile.id}:${getNextPayDate(salaryProfile)}`,
    });
  }

  if (payload.length === 0) {
    return;
  }

  const { error } = await client
    .from("notifications")
    .upsert(payload, { onConflict: "workspace_id,dedupe_key" });

  if (error) {
    throw error;
  }
}

async function materializeSalaryTransactions(
  client: DbClient,
  workspaceId: string,
  snapshot: WorkspaceSnapshot,
  salaryProfile: SalaryProfile | null,
) {
  if (!salaryProfile) {
    return;
  }

  let salaryCategory = snapshot.categories.find((category) => category.kind === "income");
  let primaryAccount = snapshot.accounts[0];

  if (!salaryCategory) {
    const { data } = await client
      .from("categories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("kind", "income")
      .limit(1)
      .maybeSingle();
    if (data) {
      salaryCategory = {
        id: data.id as string,
        name: data.name as string,
        kind: "income",
        color: data.color as string,
      };
    }
  }

  if (!primaryAccount) {
    const { data } = await client
      .from("accounts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_archived", false)
      .limit(1)
      .maybeSingle();
    if (data) {
      primaryAccount = {
        id: data.id as string,
        name: data.name as string,
        kind: data.kind as
          | "bank"
          | "credit_card"
          | "cash"
          | "loan"
          | "savings"
          | "investment",
        institution: (data.institution as string | null) ?? undefined,
        currency: (data.currency as string) ?? "GBP",
        openingBalance: Number(data.opening_balance ?? 0),
        currentBalance: Number(data.current_balance ?? data.opening_balance ?? 0),
        maskedReference: (data.masked_reference as string | null) ?? undefined,
      };
    }
  }

  if (!salaryCategory || !primaryAccount) {
    return;
  }

  const breakdown = calculateUkSalaryProfile(salaryProfile);
  const amount = getSalaryPeriodTakeHome(breakdown.annualTakeHome, salaryProfile.payFrequency);
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setMonth(fromDate.getMonth() - 1);
  const toDate = new Date(today);

  const occurrences = getSalaryScheduleOccurrences(
    salaryProfile,
    fromDate.toISOString().slice(0, 10),
    toDate.toISOString().slice(0, 10),
  );

  const { data: existingSalaryTransactions, error: existingSalaryTransactionsError } = await client
    .from("transactions")
    .select("transaction_date")
    .eq("workspace_id", workspaceId)
    .eq("source", "salary_auto")
    .order("transaction_date", { ascending: false });

  if (existingSalaryTransactionsError) {
    throw existingSalaryTransactionsError;
  }

  const existingDates = new Set(
    (existingSalaryTransactions ?? []).map((row) => row.transaction_date as string),
  );

  const inserts = occurrences
    .filter((date) => !existingDates.has(date))
    .filter((date) => date <= today.toISOString().slice(0, 10))
    .map((date) => ({
      workspace_id: workspaceId,
      account_id: primaryAccount.id,
      category_id: salaryCategory.id,
      description: "Salary",
      amount,
      transaction_date: date,
      source: "salary_auto",
      notes: `Auto-generated from salary profile (${salaryProfile.taxCode})`,
    }));

  if (inserts.length === 0) {
    return;
  }

  const { error } = await client.from("transactions").insert(inserts);

  if (error) {
    throw error;
  }
}

async function syncAutopostBills(
  client: DbClient,
  workspaceId: string,
  snapshot: WorkspaceSnapshot,
) {
  const todayIso = new Date().toISOString().slice(0, 10);
  let inserted = false;

  for (const recurring of snapshot.recurring.filter((item) => item.autopostEnabled && !item.isPaused)) {
    const occurrences = getRecurringOccurrences(recurring, "2025-01-01", todayIso);
    const missingOccurrences = occurrences.filter(
      (occurrence) =>
        !snapshot.transactions.some(
          (transaction) =>
            transaction.recurringTransactionId === recurring.id && transaction.date === occurrence,
        ),
    );

    for (const occurrence of missingOccurrences) {
      const { error: transactionError } = await client.from("transactions").insert({
        workspace_id: workspaceId,
        account_id: recurring.linkedAccountId ?? null,
        recurring_transaction_id: recurring.id,
        category_id: recurring.categoryId,
        description: recurring.name,
        amount: recurring.amount,
        transaction_date: occurrence,
        source: "bill_payment",
        notes: "Auto-posted from recurring bill.",
      });

      if (transactionError) {
        throw transactionError;
      }
      inserted = true;
    }
  }

  return inserted;
}

export async function loadWorkspaceSnapshot(client: DbClient, user: User) {
  const workspaceId = await ensureWorkspaceForUser(client, user);

  const salarySeed = await client.from("salary_profiles").select("*").eq("workspace_id", workspaceId).maybeSingle();
  const salaryProfileSeed =
    salarySeed.data && !Array.isArray(salarySeed.data)
      ? {
          id: salarySeed.data.id as string,
          country: "UK" as const,
          taxRegion: salarySeed.data.tax_region as "england_wales_ni" | "scotland",
          annualGrossSalary: Number(salarySeed.data.annual_gross_salary),
          taxCode: salarySeed.data.tax_code as string,
          payFrequency: salarySeed.data.pay_frequency as SalaryProfile["payFrequency"],
          payDateRule: salarySeed.data.pay_date_rule as string,
          pensionContribution: salarySeed.data.pension_contribution
            ? Number(salarySeed.data.pension_contribution)
            : undefined,
          studentLoanPlan: (salarySeed.data.student_loan_plan as string | null) ?? undefined,
          postgraduateLoan: Boolean(salarySeed.data.postgraduate_loan),
          effectiveDate: salarySeed.data.effective_date as string,
        }
      : null;

  await materializeSalaryTransactions(client, workspaceId, EMPTY_SNAPSHOT, salaryProfileSeed);

  const [
    accountsResult,
    categoriesResult,
    transactionsResult,
    budgetsResult,
    goalsResult,
    wishlistResult,
    recurringResult,
    allocationResult,
    salaryResult,
    backupsResult,
  ] = await Promise.all([
    client.from("accounts").select("*").eq("workspace_id", workspaceId).eq("is_archived", false).order("created_at"),
    client.from("categories").select("*").eq("workspace_id", workspaceId).order("name"),
    client
      .from("transactions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("transaction_date", { ascending: false }),
    client.from("budgets").select("*").eq("workspace_id", workspaceId).order("month_key", { ascending: false }),
    client.from("savings_goals").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
    client.from("wishlist_items").select("*").eq("workspace_id", workspaceId).order("priority", { ascending: true }),
    client
      .from("recurring_transactions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("next_run_date", { ascending: true }),
    client.from("allocation_rules").select("*").eq("workspace_id", workspaceId).order("sort_order", { ascending: true }),
    client.from("salary_profiles").select("*").eq("workspace_id", workspaceId).maybeSingle(),
    client.from("workspace_backups").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(12),
  ]);

  const results = [
    accountsResult,
    categoriesResult,
    transactionsResult,
    budgetsResult,
    goalsResult,
    wishlistResult,
    recurringResult,
    allocationResult,
    salaryResult,
    backupsResult,
  ];

  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    throw firstError;
  }

  const salaryProfile =
    salaryResult.data && !Array.isArray(salaryResult.data)
      ? {
          id: salaryResult.data.id as string,
          country: "UK" as const,
          taxRegion: salaryResult.data.tax_region as "england_wales_ni" | "scotland",
          annualGrossSalary: Number(salaryResult.data.annual_gross_salary),
          taxCode: salaryResult.data.tax_code as string,
          payFrequency: salaryResult.data.pay_frequency as SalaryProfile["payFrequency"],
          payDateRule: salaryResult.data.pay_date_rule as string,
          pensionContribution: salaryResult.data.pension_contribution
            ? Number(salaryResult.data.pension_contribution)
            : undefined,
          studentLoanPlan: (salaryResult.data.student_loan_plan as string | null) ?? undefined,
          postgraduateLoan: Boolean(salaryResult.data.postgraduate_loan),
          effectiveDate: salaryResult.data.effective_date as string,
        }
      : null;

  const snapshot: WorkspaceSnapshot = {
    accounts: [],
    categories: (categoriesResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      kind: row.kind as "income" | "expense" | "savings",
      color: row.color as string,
    })),
      transactions: (transactionsResult.data ?? []).map((row) => ({
        id: row.id as string,
        description: row.description as string,
        amount: Number(row.amount),
        date: row.transaction_date as string,
        categoryId: row.category_id as string,
        accountId: (row.account_id as string | null) ?? undefined,
        notes: (row.notes as string | null) ?? undefined,
        source: row.source as "manual" | "salary_auto" | "bill_payment",
        recurringTransactionId: (row.recurring_transaction_id as string | null) ?? undefined,
      })),
    budgets: (budgetsResult.data ?? []).map((row) => ({
      id: row.id as string,
      categoryId: row.category_id as string,
      month: row.month_key as string,
      amount: Number(row.amount),
    })),
    savingsGoals: (goalsResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      targetDate: (row.target_date as string | null) ?? undefined,
    })),
    wishlist: (wishlistResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      estimatedCost: Number(row.estimated_cost),
      priority: Number(row.priority),
      linkedGoalId: (row.linked_goal_id as string | null) ?? undefined,
    })),
      recurring: (recurringResult.data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        amount: Number(row.amount),
        categoryId: row.category_id as string,
        linkedAccountId: (row.linked_account_id as string | null) ?? undefined,
        billingCycle: row.billing_cycle as "weekly" | "monthly" | "quarterly" | "annual",
        nextRunDate: row.next_run_date as string,
        providerName: (row.provider_name as string | null) ?? undefined,
        isSubscription: Boolean(row.is_subscription),
        isBill: Boolean(row.is_bill),
        isPaused: Boolean(row.is_paused),
        autopostEnabled: Boolean(row.autopost_enabled),
        trialEndDate: (row.trial_end_date as string | null) ?? undefined,
        lastPaidDate: (row.last_paid_date as string | null) ?? undefined,
        dueStatus: "upcoming",
      })),
    allocationRules: (allocationResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      percentage: Number(row.percentage),
      categoryIds: ((row.category_ids as string[] | null) ?? []).map(String),
    })),
    salaryProfile,
    notifications: [],
    backups: (backupsResult.data ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      createdAt: row.created_at as string,
      payload: row.payload_json as WorkspaceSnapshot,
    })),
  };

  snapshot.accounts = (accountsResult.data ?? []).map((row) => {
    const openingBalance = Number(row.opening_balance ?? 0);
    const ledgerDelta = snapshot.transactions
      .filter((transaction) => transaction.accountId === (row.id as string))
      .reduce((sum, transaction) => {
        const category = snapshot.categories.find((item) => item.id === transaction.categoryId);
        if (category?.kind === "income") return sum + Math.abs(transaction.amount);
        return sum - Math.abs(transaction.amount);
      }, 0);

    return {
      id: row.id as string,
      name: row.name as string,
      kind: row.kind as
        | "bank"
        | "credit_card"
        | "cash"
        | "loan"
        | "savings"
        | "investment",
      institution: (row.institution as string | null) ?? undefined,
      currency: (row.currency as string) ?? "GBP",
      openingBalance,
      currentBalance: openingBalance + ledgerDelta,
      maskedReference: (row.masked_reference as string | null) ?? undefined,
      isArchived: Boolean(row.is_archived),
    };
  });

  snapshot.recurring = snapshot.recurring.map((item) => ({
    ...item,
    dueStatus: item.isBill ? getBillDueStatus(item) : "upcoming",
  }));

  const autopostInserted = await syncAutopostBills(client, workspaceId, snapshot);
  if (autopostInserted) {
    const { data: refreshedTransactions, error: refreshedTransactionsError } = await client
      .from("transactions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("transaction_date", { ascending: false });

    if (refreshedTransactionsError) {
      throw refreshedTransactionsError;
    }

    snapshot.transactions = (refreshedTransactions ?? []).map((row) => ({
      id: row.id as string,
      description: row.description as string,
      amount: Number(row.amount),
      date: row.transaction_date as string,
      categoryId: row.category_id as string,
      accountId: (row.account_id as string | null) ?? undefined,
      notes: (row.notes as string | null) ?? undefined,
      source: row.source as "manual" | "salary_auto" | "bill_payment",
      recurringTransactionId: (row.recurring_transaction_id as string | null) ?? undefined,
    }));

    snapshot.accounts = snapshot.accounts.map((account) => {
      const ledgerDelta = snapshot.transactions
        .filter((transaction) => transaction.accountId === account.id)
        .reduce((sum, transaction) => {
          const category = snapshot.categories.find((item) => item.id === transaction.categoryId);
          if (category?.kind === "income") return sum + Math.abs(transaction.amount);
          return sum - Math.abs(transaction.amount);
        }, 0);

      return {
        ...account,
        currentBalance: account.openingBalance + ledgerDelta,
      };
    });
  }
  await syncNotifications(client, workspaceId, snapshot, salaryProfile);

  const { data: notificationsData, error: notificationsError } = await client
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (notificationsError) {
    throw notificationsError;
  }

  snapshot.notifications = (notificationsData ?? []).map((row) => ({
      id: row.id as string,
      kind: row.kind as "bill_due" | "budget_alert" | "large_transaction" | "salary",
      title: row.title as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      isRead: Boolean(row.is_read),
  }));

  return {
    workspaceId,
    snapshot,
  };
}
