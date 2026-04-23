"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALLOCATION_PRESETS, buildAllocationReport } from "@/lib/allocation";
import { EMPTY_SNAPSHOT, loadWorkspaceSnapshot } from "@/lib/finance-data";
import { buildForecastSummary } from "@/lib/forecast";
import { buildBackupLabel } from "@/lib/import-export";
import { calculateUkSalaryProfile, getNextPayDate, getSalaryPeriodTakeHome } from "@/lib/payroll";
import { buildSubscriptionSummary } from "@/lib/subscriptions";
import { getSupabaseBrowserClientSingleton, hasSupabaseConfig } from "@/lib/supabase";
import { type AccountKind, type RecurringTransaction, type WorkspaceSnapshot } from "@/lib/types";
import { formatMonth, toMonthKey } from "@/lib/utils";

type SaveTransactionInput = {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId?: string;
  notes?: string;
};

type SaveAccountInput = {
  name: string;
  kind: AccountKind;
  institution?: string;
  currency: string;
  openingBalance: number;
  maskedReference?: string;
};

type SaveBudgetInput = {
  categoryId: string;
  amount: number;
  month: string;
};

type SaveGoalInput = {
  name: string;
  targetAmount: number;
  currentAmount?: number;
};

type SaveSubscriptionInput = {
  name: string;
  amount: number;
  categoryId: string;
  linkedAccountId?: string;
  billingCycle: RecurringTransaction["billingCycle"];
  nextRunDate: string;
  providerName?: string;
  trialEndDate?: string;
};

type SaveBillInput = {
  name: string;
  amount: number;
  categoryId: string;
  linkedAccountId?: string;
  billingCycle: RecurringTransaction["billingCycle"];
  nextRunDate: string;
  autopostEnabled?: boolean;
};

type SaveWishlistInput = {
  name: string;
  estimatedCost: number;
};

type SaveAllocationRuleInput = {
  name: string;
  percentage: number;
  categoryIds: string[];
};

type SaveSalaryProfileInput = {
  taxRegion: "england_wales_ni" | "scotland";
  annualGrossSalary: number;
  taxCode: string;
  payFrequency: "weekly" | "biweekly" | "four_weekly" | "monthly";
  payDateRule: string;
  pensionContribution?: number;
  studentLoanPlan?: string;
  postgraduateLoan?: boolean;
  effectiveDate: string;
};

type AuthInput = {
  email: string;
  password: string;
};

type FinanceWorkspaceContextValue = WorkspaceSnapshot & {
  currentMonth: string;
  ready: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  workspaceLoading: boolean;
  userEmail: string | null;
  statusMessage: string | null;
  errorMessage: string | null;
  summary: ReturnType<typeof buildForecastSummary>;
  allocationReport: ReturnType<typeof buildAllocationReport>;
  subscriptionSummary: ReturnType<typeof buildSubscriptionSummary>;
  salaryBreakdown: ReturnType<typeof calculateUkSalaryProfile> | null;
  nextPayDate: string | null;
  unreadNotifications: number;
  monthlyIncome: number;
  monthlySpending: number;
  signIn: (input: AuthInput) => Promise<void>;
  signUp: (input: AuthInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  saveAccount: (input: SaveAccountInput) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  saveTransaction: (input: SaveTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (input: SaveBudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  saveSavingsGoal: (input: SaveGoalInput) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  saveSubscription: (input: SaveSubscriptionInput) => Promise<void>;
  saveBill: (input: SaveBillInput) => Promise<void>;
  markBillAsPaid: (id: string) => Promise<void>;
  toggleRecurringPause: (id: string) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  saveWishlistItem: (input: SaveWishlistInput) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
  saveAllocationRule: (input: SaveAllocationRuleInput) => Promise<void>;
  deleteAllocationRule: (id: string) => Promise<void>;
  applyAllocationPreset: (preset: keyof typeof ALLOCATION_PRESETS) => Promise<void>;
  saveSalaryProfile: (input: SaveSalaryProfileInput) => Promise<void>;
  deleteSalaryProfile: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  backupWorkspace: () => Promise<void>;
  restoreWorkspace: (backupId: string) => Promise<void>;
  importTransactions: (
    rows: Array<{
      date: string;
      description: string;
      amount: number;
      categoryId: string;
      accountId?: string;
      notes?: string;
    }>,
  ) => Promise<void>;
};

const FinanceWorkspaceContext = createContext<FinanceWorkspaceContextValue | null>(
  null,
);

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "Something went wrong while talking to Supabase.";
}

function getClient() {
  const client = getSupabaseBrowserClientSingleton();
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }
  return client;
}

async function requireWorkspaceContext(client: SupabaseClient, user: User) {
  return loadWorkspaceSnapshot(client, user);
}

export function FinanceWorkspaceProvider({ children }: { children: ReactNode }) {
  const isConfigured = hasSupabaseConfig();
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(EMPTY_SNAPSHOT);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(isConfigured);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentMonth = toMonthKey(new Date());

  const refreshWorkspace = useCallback(async () => {
    if (!isConfigured) {
      return;
    }

    const client = getClient();
    const user = session?.user;
    if (!user) {
      startTransition(() => {
        setSnapshot(EMPTY_SNAPSHOT);
        setWorkspaceId(null);
      });
      return;
    }

    setWorkspaceLoading(true);
    setErrorMessage(null);

    try {
      const result = await requireWorkspaceContext(client, user);
      startTransition(() => {
        setSnapshot(result.snapshot);
        setWorkspaceId(result.workspaceId);
      });
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setWorkspaceLoading(false);
    }
  }, [isConfigured, session?.user]);

  useEffect(() => {
    if (!isConfigured) return;

    const client = getClient();
    let isMounted = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSession(data.session);
      }

      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      startTransition(() => {
        setSession(nextSession);
        setErrorMessage(null);
        if (!nextSession) {
          setSnapshot(EMPTY_SNAPSHOT);
          setWorkspaceId(null);
        }
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured || authLoading || !session?.user) return;
    void (async () => {
      await refreshWorkspace();
    })();
  }, [authLoading, isConfigured, refreshWorkspace, session?.user]);

  const monthlyIncome = useMemo(
    () =>
      snapshot.transactions
        .filter((transaction) => toMonthKey(transaction.date) === currentMonth)
        .filter(
          (transaction) =>
            snapshot.categories.find((category) => category.id === transaction.categoryId)?.kind ===
            "income",
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    [currentMonth, snapshot.categories, snapshot.transactions],
  );

  const monthlySpending = useMemo(
    () =>
      snapshot.transactions
        .filter((transaction) => toMonthKey(transaction.date) === currentMonth)
        .filter(
          (transaction) =>
            snapshot.categories.find((category) => category.id === transaction.categoryId)?.kind !==
            "income",
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    [currentMonth, snapshot.categories, snapshot.transactions],
  );

  const summary = useMemo(
    () =>
      buildForecastSummary({
        transactions: snapshot.transactions,
        categories: snapshot.categories,
        recurring: snapshot.recurring,
        budgets: snapshot.budgets,
        month: currentMonth,
      }),
    [currentMonth, snapshot.budgets, snapshot.categories, snapshot.recurring, snapshot.transactions],
  );

  const allocationReport = useMemo(
    () =>
      buildAllocationReport({
        netIncome: monthlyIncome,
        rules: snapshot.allocationRules,
        transactions: snapshot.transactions,
        categories: snapshot.categories,
        month: currentMonth,
      }),
    [
      currentMonth,
      monthlyIncome,
      snapshot.allocationRules,
      snapshot.categories,
      snapshot.transactions,
    ],
  );

  const subscriptionSummary = useMemo(
    () => buildSubscriptionSummary(snapshot.recurring),
    [snapshot.recurring],
  );

  const salaryBreakdown = useMemo(
    () => (snapshot.salaryProfile ? calculateUkSalaryProfile(snapshot.salaryProfile) : null),
    [snapshot.salaryProfile],
  );

  const nextPayDate = useMemo(
    () => (snapshot.salaryProfile ? getNextPayDate(snapshot.salaryProfile) : null),
    [snapshot.salaryProfile],
  );

  const unreadNotifications = useMemo(
    () => snapshot.notifications.filter((item) => !item.isRead).length,
    [snapshot.notifications],
  );

  const withUserAction = useCallback(
    async (action: (client: SupabaseClient, user: User) => Promise<void>) => {
      const client = getClient();
      const user = session?.user;

      if (!user) {
        throw new Error("You need to sign in first.");
      }

      setErrorMessage(null);
      await action(client, user);
      await refreshWorkspace();
    },
    [refreshWorkspace, session?.user],
  );

  const value: FinanceWorkspaceContextValue = {
      ...snapshot,
      currentMonth,
      ready: !authLoading && (!isConfigured || !workspaceLoading),
      isConfigured,
      isAuthenticated: Boolean(session?.user),
      authLoading,
      workspaceLoading,
      userEmail: session?.user.email ?? null,
      statusMessage,
      errorMessage,
      summary,
      allocationReport,
      subscriptionSummary,
      salaryBreakdown,
      nextPayDate,
      unreadNotifications,
      monthlyIncome,
      monthlySpending,
      async signIn(input) {
        const client = getClient();
        setErrorMessage(null);
        setStatusMessage(null);
        const { error } = await client.auth.signInWithPassword(input);
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        setStatusMessage("Signed in.");
      },
      async signUp(input) {
        const client = getClient();
        setErrorMessage(null);
        setStatusMessage(null);
        const { data, error } = await client.auth.signUp(input);
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        if (!data.session) {
          setStatusMessage("Account created. Check your email to confirm your sign-in.");
          return;
        }
        setStatusMessage("Account created and signed in.");
      },
      async signOut() {
        const client = getClient();
        await client.auth.signOut();
        setStatusMessage("Signed out.");
      },
      refreshWorkspace,
      async saveAccount(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("accounts").insert({
            workspace_id: activeWorkspaceId,
            name: input.name,
            kind: input.kind,
            institution: input.institution ?? null,
            currency: input.currency,
            opening_balance: input.openingBalance,
            current_balance: input.openingBalance,
            masked_reference: input.maskedReference ?? null,
          });
          if (error) throw error;
        });
      },
      async deleteAccount(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("accounts").update({ is_archived: true }).eq("id", id);
          if (error) throw error;
        });
      },
      async saveTransaction(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("transactions").insert({
            workspace_id: activeWorkspaceId,
            account_id: input.accountId ?? null,
            category_id: input.categoryId,
            description: input.description,
            amount: input.amount,
            transaction_date: input.date,
            notes: input.notes ?? null,
          });
          if (error) throw error;
        });
      },
      async deleteTransaction(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("transactions").delete().eq("id", id);
          if (error) throw error;
        });
      },
      async saveBudget(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("budgets").upsert(
            {
              workspace_id: activeWorkspaceId,
              category_id: input.categoryId,
              month_key: input.month,
              amount: input.amount,
            },
            { onConflict: "workspace_id,category_id,month_key" },
          );
          if (error) throw error;
        });
      },
      async deleteBudget(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("budgets").delete().eq("id", id);
          if (error) throw error;
        });
      },
      async saveSavingsGoal(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("savings_goals").insert({
            workspace_id: activeWorkspaceId,
            name: input.name,
            target_amount: input.targetAmount,
            current_amount: input.currentAmount ?? 0,
          });
          if (error) throw error;
        });
      },
      async deleteSavingsGoal(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("savings_goals").delete().eq("id", id);
          if (error) throw error;
        });
      },
      async saveSubscription(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("recurring_transactions").insert({
            workspace_id: activeWorkspaceId,
            category_id: input.categoryId,
            linked_account_id: input.linkedAccountId ?? null,
            name: input.name,
            amount: input.amount,
            billing_cycle: input.billingCycle,
            next_run_date: input.nextRunDate,
            provider_name: input.providerName ?? null,
            trial_end_date: input.trialEndDate ?? null,
            is_subscription: true,
            is_bill: false,
            autopost_enabled: false,
            is_paused: false,
          });
          if (error) throw error;
        });
      },
      async saveBill(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("recurring_transactions").insert({
            workspace_id: activeWorkspaceId,
            category_id: input.categoryId,
            linked_account_id: input.linkedAccountId ?? null,
            name: input.name,
            amount: input.amount,
            billing_cycle: input.billingCycle,
            next_run_date: input.nextRunDate,
            is_subscription: false,
            is_bill: true,
            autopost_enabled: Boolean(input.autopostEnabled),
            is_paused: false,
          });
          if (error) throw error;
        });
      },
      async markBillAsPaid(id) {
        await withUserAction(async (client, user) => {
          const recurring = snapshot.recurring.find((item) => item.id === id);
          if (!recurring) {
            throw new Error("Bill not found.");
          }
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;

          const { error: transactionError } = await client.from("transactions").insert({
            workspace_id: activeWorkspaceId,
            account_id: recurring.linkedAccountId ?? null,
            recurring_transaction_id: recurring.id,
            category_id: recurring.categoryId,
            description: recurring.name,
            amount: recurring.amount,
            transaction_date: recurring.nextRunDate,
            source: "bill_payment",
            notes: "Marked paid from bills workspace.",
          });
          if (transactionError) throw transactionError;

          const { getNextRecurringDate } = await import("@/lib/recurring");
          const { error: recurringError } = await client
            .from("recurring_transactions")
            .update({
              last_paid_date: recurring.nextRunDate,
              next_run_date: getNextRecurringDate(recurring, recurring.nextRunDate),
            })
            .eq("id", recurring.id);
          if (recurringError) throw recurringError;
        });
      },
      async toggleRecurringPause(id) {
        await withUserAction(async (client) => {
          const current = snapshot.recurring.find((item) => item.id === id);
          const { error } = await client
            .from("recurring_transactions")
            .update({ is_paused: !current?.isPaused })
            .eq("id", id);
          if (error) throw error;
        });
      },
      async deleteRecurringTransaction(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("recurring_transactions").delete().eq("id", id);
          if (error) throw error;
        });
      },
      async saveWishlistItem(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const nextPriority =
            snapshot.wishlist.reduce((max, item) => Math.max(max, item.priority), 0) + 1;
          const { error } = await client.from("wishlist_items").insert({
            workspace_id: activeWorkspaceId,
            name: input.name,
            estimated_cost: input.estimatedCost,
            priority: nextPriority,
          });
          if (error) throw error;
        });
      },
      async deleteWishlistItem(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("wishlist_items").delete().eq("id", id);
          if (error) throw error;
        });
      },
      async saveAllocationRule(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("allocation_rules").insert({
            workspace_id: activeWorkspaceId,
            name: input.name,
            percentage: input.percentage,
            category_ids: input.categoryIds,
            sort_order: snapshot.allocationRules.length,
          });
          if (error) throw error;
        });
      },
      async deleteAllocationRule(id) {
        await withUserAction(async (client) => {
          const { error } = await client.from("allocation_rules").delete().eq("id", id);
          if (error) throw error;
        });
      },
      async applyAllocationPreset(preset) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const expenseCategories = snapshot.categories
            .filter((category) => category.kind === "expense")
            .map((category) => category.id);
          const savingsCategories = snapshot.categories
            .filter((category) => category.kind === "savings")
            .map((category) => category.id);

          const { error: deleteError } = await client
            .from("allocation_rules")
            .delete()
            .eq("workspace_id", activeWorkspaceId);
          if (deleteError) throw deleteError;

          const { error: insertError } = await client.from("allocation_rules").insert(
            ALLOCATION_PRESETS[preset].map((rule, index) => ({
              workspace_id: activeWorkspaceId,
              name: rule.name,
              percentage: rule.percentage,
              category_ids: index === 2 ? savingsCategories : expenseCategories,
              sort_order: index,
            })),
          );
          if (insertError) throw insertError;
        });
      },
      async saveSalaryProfile(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("salary_profiles").upsert(
            {
              workspace_id: activeWorkspaceId,
              country: "UK",
              tax_region: input.taxRegion,
              annual_gross_salary: input.annualGrossSalary,
              tax_code: input.taxCode,
              pay_frequency: input.payFrequency,
              pay_date_rule: input.payDateRule,
              pension_contribution: input.pensionContribution ?? null,
              student_loan_plan: input.studentLoanPlan ?? null,
              postgraduate_loan: Boolean(input.postgraduateLoan),
              effective_date: input.effectiveDate,
            },
            { onConflict: "workspace_id" },
          );
          if (error) throw error;
        });
      },
      async deleteSalaryProfile() {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client
            .from("salary_profiles")
            .delete()
            .eq("workspace_id", activeWorkspaceId);
          if (error) throw error;
        });
      },
      async markNotificationRead(id) {
        await withUserAction(async (client) => {
          const { error } = await client
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);
          if (error) throw error;
        });
      },
      async markAllNotificationsRead() {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client
            .from("notifications")
            .update({ is_read: true })
            .eq("workspace_id", activeWorkspaceId);
          if (error) throw error;
        });
      },
      async backupWorkspace() {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const payload = {
            ...snapshot,
            backups: [],
          };
          const { error } = await client.from("workspace_backups").insert({
            workspace_id: activeWorkspaceId,
            label: buildBackupLabel(),
            payload_json: payload,
          });
          if (error) throw error;
        });
      },
      async restoreWorkspace(backupId) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const backup = snapshot.backups.find((item) => item.id === backupId);
          if (!backup) {
            throw new Error("Backup not found.");
          }

          const payload = backup.payload;

          const deleteTables = [
            "notifications",
            "allocation_rules",
            "transactions",
            "recurring_transactions",
            "wishlist_items",
            "savings_goals",
            "budgets",
            "salary_profiles",
            "accounts",
            "categories",
          ] as const;

          for (const table of deleteTables) {
            const { error } = await client.from(table).delete().eq("workspace_id", activeWorkspaceId);
            if (error) throw error;
          }

          if (payload.categories.length > 0) {
            const { error } = await client.from("categories").insert(
              payload.categories.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                name: item.name,
                kind: item.kind,
                color: item.color,
              })),
            );
            if (error) throw error;
          }

          if (payload.accounts.length > 0) {
            const { error } = await client.from("accounts").insert(
              payload.accounts.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                name: item.name,
                kind: item.kind,
                institution: item.institution ?? null,
                currency: item.currency,
                opening_balance: item.openingBalance,
                current_balance: item.currentBalance,
                masked_reference: item.maskedReference ?? null,
                is_archived: Boolean(item.isArchived),
              })),
            );
            if (error) throw error;
          }

          if (payload.salaryProfile) {
            const { error } = await client.from("salary_profiles").insert({
              id: payload.salaryProfile.id,
              workspace_id: activeWorkspaceId,
              country: payload.salaryProfile.country,
              tax_region: payload.salaryProfile.taxRegion,
              annual_gross_salary: payload.salaryProfile.annualGrossSalary,
              tax_code: payload.salaryProfile.taxCode,
              pay_frequency: payload.salaryProfile.payFrequency,
              pay_date_rule: payload.salaryProfile.payDateRule,
              pension_contribution: payload.salaryProfile.pensionContribution ?? null,
              student_loan_plan: payload.salaryProfile.studentLoanPlan ?? null,
              postgraduate_loan: Boolean(payload.salaryProfile.postgraduateLoan),
              effective_date: payload.salaryProfile.effectiveDate,
            });
            if (error) throw error;
          }

          if (payload.savingsGoals.length > 0) {
            const { error } = await client.from("savings_goals").insert(
              payload.savingsGoals.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                name: item.name,
                target_amount: item.targetAmount,
                current_amount: item.currentAmount,
                target_date: item.targetDate ?? null,
              })),
            );
            if (error) throw error;
          }

          if (payload.wishlist.length > 0) {
            const { error } = await client.from("wishlist_items").insert(
              payload.wishlist.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                linked_goal_id: item.linkedGoalId ?? null,
                name: item.name,
                estimated_cost: item.estimatedCost,
                priority: item.priority,
              })),
            );
            if (error) throw error;
          }

          if (payload.budgets.length > 0) {
            const { error } = await client.from("budgets").insert(
              payload.budgets.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                category_id: item.categoryId,
                month_key: item.month,
                amount: item.amount,
              })),
            );
            if (error) throw error;
          }

          if (payload.recurring.length > 0) {
            const { error } = await client.from("recurring_transactions").insert(
              payload.recurring.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                category_id: item.categoryId,
                linked_account_id: item.linkedAccountId ?? null,
                name: item.name,
                amount: item.amount,
                billing_cycle: item.billingCycle,
                next_run_date: item.nextRunDate,
                provider_name: item.providerName ?? null,
                is_subscription: Boolean(item.isSubscription),
                is_bill: Boolean(item.isBill),
                is_paused: Boolean(item.isPaused),
                autopost_enabled: Boolean(item.autopostEnabled),
                trial_end_date: item.trialEndDate ?? null,
                last_paid_date: item.lastPaidDate ?? null,
              })),
            );
            if (error) throw error;
          }

          if (payload.allocationRules.length > 0) {
            const { error } = await client.from("allocation_rules").insert(
              payload.allocationRules.map((item, index) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                name: item.name,
                percentage: item.percentage,
                category_ids: item.categoryIds,
                sort_order: index,
              })),
            );
            if (error) throw error;
          }

          if (payload.transactions.length > 0) {
            const { error } = await client.from("transactions").insert(
              payload.transactions.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                account_id: item.accountId ?? null,
                recurring_transaction_id: item.recurringTransactionId ?? null,
                category_id: item.categoryId,
                description: item.description,
                amount: item.amount,
                transaction_date: item.date,
                source: item.source ?? "manual",
                notes: item.notes ?? null,
              })),
            );
            if (error) throw error;
          }

          if (payload.notifications.length > 0) {
            const { error } = await client.from("notifications").insert(
              payload.notifications.map((item) => ({
                id: item.id,
                workspace_id: activeWorkspaceId,
                kind: item.kind,
                title: item.title,
                body: item.body,
                dedupe_key: `${item.kind}:${item.id}`,
                is_read: item.isRead,
                created_at: item.createdAt,
              })),
            );
            if (error) throw error;
          }
        });
      },
      async importTransactions(rows) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId =
            workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          if (rows.length === 0) {
            return;
          }
          const { error } = await client.from("transactions").insert(
            rows.map((row) => ({
              workspace_id: activeWorkspaceId,
              account_id: row.accountId ?? null,
              category_id: row.categoryId,
              description: row.description,
              amount: row.amount,
              transaction_date: row.date,
              source: "manual",
              notes: row.notes ?? "Imported from CSV",
            })),
          );
          if (error) throw error;
        });
      },
    };

  return (
    <FinanceWorkspaceContext.Provider value={value}>
      {children}
    </FinanceWorkspaceContext.Provider>
  );
}

export function useFinanceWorkspace() {
  const context = useContext(FinanceWorkspaceContext);
  if (!context) {
    throw new Error("useFinanceWorkspace must be used inside FinanceWorkspaceProvider");
  }
  return context;
}

export function useCurrentUserSalarySummary() {
  const { monthlyIncome, monthlySpending, salaryBreakdown, salaryProfile, nextPayDate } =
    useFinanceWorkspace();
  return {
    grossIncome: salaryBreakdown?.annualGross ?? monthlyIncome,
    spending: monthlySpending,
    remaining:
      (salaryBreakdown && salaryProfile
        ? getSalaryPeriodTakeHome(salaryBreakdown.annualTakeHome, salaryProfile.payFrequency)
        : monthlyIncome) - monthlySpending,
    payPeriodLabel: formatMonth(new Date()),
    nextPayDate,
  };
}

export function useAllocationSummary() {
  const { allocationReport } = useFinanceWorkspace();
  return allocationReport;
}

export function useSubscriptionSummary() {
  const { subscriptionSummary } = useFinanceWorkspace();
  return subscriptionSummary;
}
