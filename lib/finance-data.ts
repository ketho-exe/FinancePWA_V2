import type { SupabaseClient, User } from "@supabase/supabase-js";
import { WorkspaceSnapshot } from "@/lib/types";

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
  categories: [],
  transactions: [],
  budgets: [],
  savingsGoals: [],
  wishlist: [],
  recurring: [],
  allocationRules: [],
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

export async function loadWorkspaceSnapshot(client: DbClient, user: User) {
  const workspaceId = await ensureWorkspaceForUser(client, user);

  const [
    categoriesResult,
    transactionsResult,
    budgetsResult,
    goalsResult,
    wishlistResult,
    recurringResult,
    allocationResult,
  ] = await Promise.all([
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
  ]);

  const results = [
    categoriesResult,
    transactionsResult,
    budgetsResult,
    goalsResult,
    wishlistResult,
    recurringResult,
    allocationResult,
  ];

  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    throw firstError;
  }

  return {
    workspaceId,
    snapshot: {
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
        notes: (row.notes as string | null) ?? undefined,
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
        billingCycle: row.billing_cycle as "weekly" | "monthly" | "quarterly" | "annual",
        nextRunDate: row.next_run_date as string,
        providerName: (row.provider_name as string | null) ?? undefined,
        isSubscription: Boolean(row.is_subscription),
        isPaused: Boolean(row.is_paused),
        trialEndDate: (row.trial_end_date as string | null) ?? undefined,
      })),
      allocationRules: (allocationResult.data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        percentage: Number(row.percentage),
        categoryIds: ((row.category_ids as string[] | null) ?? []).map(String),
      })),
    } satisfies WorkspaceSnapshot,
  };
}
