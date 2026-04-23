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
import { buildSubscriptionSummary } from "@/lib/subscriptions";
import { getSupabaseBrowserClientSingleton, hasSupabaseConfig } from "@/lib/supabase";
import { type RecurringTransaction, type WorkspaceSnapshot } from "@/lib/types";
import { formatMonth, toMonthKey } from "@/lib/utils";

type SaveTransactionInput = {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  notes?: string;
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
  billingCycle: RecurringTransaction["billingCycle"];
  nextRunDate: string;
  providerName?: string;
  trialEndDate?: string;
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
  monthlyIncome: number;
  monthlySpending: number;
  signIn: (input: AuthInput) => Promise<void>;
  signUp: (input: AuthInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  saveTransaction: (input: SaveTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (input: SaveBudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  saveSavingsGoal: (input: SaveGoalInput) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  saveSubscription: (input: SaveSubscriptionInput) => Promise<void>;
  toggleRecurringPause: (id: string) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  saveWishlistItem: (input: SaveWishlistInput) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
  saveAllocationRule: (input: SaveAllocationRuleInput) => Promise<void>;
  deleteAllocationRule: (id: string) => Promise<void>;
  applyAllocationPreset: (preset: keyof typeof ALLOCATION_PRESETS) => Promise<void>;
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
      async saveTransaction(input) {
        await withUserAction(async (client, user) => {
          const activeWorkspaceId = workspaceId ?? (await requireWorkspaceContext(client, user)).workspaceId;
          const { error } = await client.from("transactions").insert({
            workspace_id: activeWorkspaceId,
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
            name: input.name,
            amount: input.amount,
            billing_cycle: input.billingCycle,
            next_run_date: input.nextRunDate,
            provider_name: input.providerName ?? null,
            trial_end_date: input.trialEndDate ?? null,
            is_subscription: true,
            is_paused: false,
          });
          if (error) throw error;
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
  const { monthlyIncome, monthlySpending } = useFinanceWorkspace();
  return {
    grossIncome: monthlyIncome,
    spending: monthlySpending,
    remaining: monthlyIncome - monthlySpending,
    payPeriodLabel: formatMonth(new Date()),
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
