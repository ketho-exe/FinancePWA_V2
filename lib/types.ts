export type CategoryKind = "income" | "expense" | "savings";

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  notes?: string;
  tags?: string[];
};

export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
};

export type WishlistItem = {
  id: string;
  name: string;
  estimatedCost: number;
  priority: number;
  linkedGoalId?: string;
};

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "annual";

export type RecurringTransaction = {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  billingCycle: BillingCycle;
  nextRunDate: string;
  providerName?: string;
  isSubscription: boolean;
  isPaused?: boolean;
  trialEndDate?: string;
};

export type AllocationRule = {
  id: string;
  name: string;
  percentage: number;
  categoryIds: string[];
};

export type ForecastPoint = {
  date: string;
  balance: number;
};

export type WorkspaceSnapshot = {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  wishlist: WishlistItem[];
  recurring: RecurringTransaction[];
  allocationRules: AllocationRule[];
};
