"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALLOCATION_PRESETS, buildAllocationReport } from "@/lib/allocation";
import { demoSnapshot } from "@/lib/demo-data";
import { buildForecastSummary } from "@/lib/forecast";
import { buildSubscriptionSummary } from "@/lib/subscriptions";
import {
  RecurringTransaction,
  WorkspaceSnapshot,
} from "@/lib/types";
import { hasSupabaseConfig } from "@/lib/supabase";
import { formatMonth, toMonthKey, uid } from "@/lib/utils";

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

type FinanceWorkspaceContextValue = WorkspaceSnapshot & {
  currentMonth: string;
  mode: "demo" | "supabase-ready";
  ready: boolean;
  summary: ReturnType<typeof buildForecastSummary>;
  allocationReport: ReturnType<typeof buildAllocationReport>;
  subscriptionSummary: ReturnType<typeof buildSubscriptionSummary>;
  monthlyIncome: number;
  monthlySpending: number;
  saveTransaction: (input: SaveTransactionInput) => void;
  saveBudget: (input: SaveBudgetInput) => void;
  saveSavingsGoal: (input: SaveGoalInput) => void;
  saveSubscription: (input: SaveSubscriptionInput) => void;
  toggleRecurringPause: (id: string) => void;
  saveWishlistItem: (input: SaveWishlistInput) => void;
  saveAllocationRule: (input: SaveAllocationRuleInput) => void;
  applyAllocationPreset: (preset: keyof typeof ALLOCATION_PRESETS) => void;
};

const STORAGE_KEY = "finance-pwa-workspace";

const FinanceWorkspaceContext = createContext<FinanceWorkspaceContextValue | null>(
  null,
);

function readStoredSnapshot() {
  if (typeof window === "undefined") {
    return demoSnapshot;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return demoSnapshot;
  }

  try {
    return JSON.parse(raw) as WorkspaceSnapshot;
  } catch {
    return demoSnapshot;
  }
}

export function FinanceWorkspaceProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(() => readStoredSnapshot());
  const currentMonth = toMonthKey(new Date("2026-04-23"));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  const monthlyIncome = useMemo(
    () =>
      snapshot.transactions
        .filter((transaction) => toMonthKey(transaction.date) === currentMonth)
        .filter((transaction) =>
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
        .filter((transaction) =>
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
    [currentMonth, monthlyIncome, snapshot.allocationRules, snapshot.categories, snapshot.transactions],
  );

  const subscriptionSummary = useMemo(
    () => buildSubscriptionSummary(snapshot.recurring),
    [snapshot.recurring],
  );

  const value = useMemo<FinanceWorkspaceContextValue>(
    () => ({
      ...snapshot,
      currentMonth,
      mode: hasSupabaseConfig() ? "supabase-ready" : "demo",
      ready: true,
      summary,
      allocationReport,
      subscriptionSummary,
      monthlyIncome,
      monthlySpending,
      saveTransaction(input) {
        setSnapshot((current) => ({
          ...current,
          transactions: [
            {
              id: uid("txn"),
              description: input.description,
              amount: input.amount,
              date: input.date,
              categoryId: input.categoryId,
              notes: input.notes,
            },
            ...current.transactions,
          ],
        }));
      },
      saveBudget(input) {
        setSnapshot((current) => ({
          ...current,
          budgets: [
            ...current.budgets.filter(
              (budget) =>
                !(budget.categoryId === input.categoryId && budget.month === input.month),
            ),
            { id: uid("bud"), ...input },
          ],
        }));
      },
      saveSavingsGoal(input) {
        setSnapshot((current) => ({
          ...current,
          savingsGoals: [
            ...current.savingsGoals,
            {
              id: uid("goal"),
              name: input.name,
              targetAmount: input.targetAmount,
              currentAmount: input.currentAmount ?? 0,
            },
          ],
        }));
      },
      saveSubscription(input) {
        setSnapshot((current) => ({
          ...current,
          recurring: [
            {
              id: uid("sub"),
              name: input.name,
              amount: input.amount,
              categoryId: input.categoryId,
              billingCycle: input.billingCycle,
              nextRunDate: input.nextRunDate,
              providerName: input.providerName,
              trialEndDate: input.trialEndDate,
              isSubscription: true,
            },
            ...current.recurring,
          ],
        }));
      },
      toggleRecurringPause(id) {
        setSnapshot((current) => ({
          ...current,
          recurring: current.recurring.map((item) =>
            item.id === id ? { ...item, isPaused: !item.isPaused } : item,
          ),
        }));
      },
      saveWishlistItem(input) {
        setSnapshot((current) => ({
          ...current,
          wishlist: [
            ...current.wishlist,
            {
              id: uid("wish"),
              name: input.name,
              estimatedCost: input.estimatedCost,
              priority: current.wishlist.length + 1,
            },
          ],
        }));
      },
      saveAllocationRule(input) {
        setSnapshot((current) => ({
          ...current,
          allocationRules: [
            ...current.allocationRules,
            {
              id: uid("alloc"),
              name: input.name,
              percentage: input.percentage,
              categoryIds: input.categoryIds,
            },
          ],
        }));
      },
      applyAllocationPreset(preset) {
        setSnapshot((current) => ({
          ...current,
          allocationRules: ALLOCATION_PRESETS[preset].map((rule, index) => {
            const matchingCategory =
              index === 2
                ? current.categories.filter((category) => category.kind === "savings")
                : current.categories.filter((category) => category.kind === "expense");
            return {
              id: uid("alloc"),
              name: rule.name,
              percentage: rule.percentage,
              categoryIds: matchingCategory.map((category) => category.id).slice(
                0,
                index === 0 ? 3 : index === 1 ? 2 : 2,
              ),
            };
          }),
        }));
      },
    }),
    [
      allocationReport,
      currentMonth,
      monthlyIncome,
      monthlySpending,
      snapshot,
      subscriptionSummary,
      summary,
    ],
  );

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
    payPeriodLabel: formatMonth(new Date("2026-04-23")),
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
