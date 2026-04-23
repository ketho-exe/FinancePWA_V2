import { AllocationRule, Category, Transaction } from "@/lib/types";
import { toMonthKey } from "@/lib/utils";

export function validateAllocationRules(rules: AllocationRule[]) {
  const errors: string[] = [];
  const total = rules.reduce((sum, rule) => sum + rule.percentage, 0);
  const names = new Set<string>();

  for (const rule of rules) {
    const lowered = rule.name.trim().toLowerCase();
    if (rule.percentage < 0 || rule.percentage > 100) {
      errors.push(`${rule.name} must stay between 0 and 100%.`);
    }
    if (names.has(lowered)) {
      errors.push(`${rule.name} is duplicated.`);
    }
    names.add(lowered);
  }

  if (total > 100) {
    errors.push("Allocation rules cannot exceed 100% in total.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateAllocations(netIncome: number, rules: AllocationRule[]) {
  return rules.map((rule) => ({
    rule,
    targetAmount: (netIncome * rule.percentage) / 100,
  }));
}

export function getAllocationHealth(actual: number, target: number) {
  if (actual <= target * 0.95) {
    return "under";
  }
  if (actual <= target) {
    return "on-track";
  }
  return "over";
}

export function getUnallocatedAmount(netIncome: number, rules: AllocationRule[]) {
  const allocated = rules.reduce(
    (sum, rule) => sum + (netIncome * rule.percentage) / 100,
    0,
  );
  return Math.max(netIncome - allocated, 0);
}

export function buildAllocationReport(params: {
  netIncome: number;
  rules: AllocationRule[];
  transactions: Transaction[];
  categories: Category[];
  month: string;
}) {
  const expenseCategoryMap = new Map(
    params.categories.map((category) => [category.id, category]),
  );

  return calculateAllocations(params.netIncome, params.rules).map(({ rule, targetAmount }) => {
    const actualAmount = params.transactions
      .filter((transaction) => toMonthKey(transaction.date) === params.month)
      .filter((transaction) => rule.categoryIds.includes(transaction.categoryId))
      .filter((transaction) => expenseCategoryMap.get(transaction.categoryId)?.kind !== "income")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      rule,
      targetAmount,
      actualAmount,
      variance: actualAmount - targetAmount,
      health: getAllocationHealth(actualAmount, targetAmount),
      percentage: targetAmount === 0 ? 0 : (actualAmount / targetAmount) * 100,
    };
  });
}

export const ALLOCATION_PRESETS = {
  "50-30-20": [
    { name: "Needs", percentage: 50 },
    { name: "Wants", percentage: 30 },
    { name: "Savings", percentage: 20 },
  ],
  "70-20-10": [
    { name: "Expenses", percentage: 70 },
    { name: "Savings", percentage: 20 },
    { name: "Giving", percentage: 10 },
  ],
} as const;
