export type CategoryKind = "income" | "expense" | "savings";
export type AccountKind =
  | "bank"
  | "credit_card"
  | "cash"
  | "loan"
  | "savings"
  | "investment";

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
  accountId?: string;
  notes?: string;
  tags?: string[];
  source?: "manual" | "salary_auto" | "bill_payment";
  recurringTransactionId?: string;
};

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  institution?: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  maskedReference?: string;
  isArchived?: boolean;
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
  linkedAccountId?: string;
  billingCycle: BillingCycle;
  nextRunDate: string;
  providerName?: string;
  isSubscription: boolean;
  isBill?: boolean;
  isPaused?: boolean;
  trialEndDate?: string;
  autopostEnabled?: boolean;
  lastPaidDate?: string;
  dueStatus?: "upcoming" | "due_soon" | "overdue" | "paid";
};

export type AllocationRule = {
  id: string;
  name: string;
  percentage: number;
  categoryIds: string[];
};

export type SalaryProfile = {
  id: string;
  country: "UK";
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

export type NotificationItem = {
  id: string;
  kind: "bill_due" | "budget_alert" | "large_transaction" | "salary";
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
};

export type WorkspaceBackup = {
  id: string;
  label: string;
  createdAt: string;
  payload: WorkspaceSnapshot;
};

export type ForecastPoint = {
  date: string;
  balance: number;
};

export type WorkspaceSnapshot = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  wishlist: WishlistItem[];
  recurring: RecurringTransaction[];
  allocationRules: AllocationRule[];
  salaryProfile: SalaryProfile | null;
  notifications: NotificationItem[];
  backups: WorkspaceBackup[];
};
