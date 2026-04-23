import { Budget, Category, ForecastPoint, RecurringTransaction, Transaction } from "@/lib/types";
import { toMonthKey } from "@/lib/utils";

export function getSignedAmount(transaction: Transaction, categories: Category[]) {
  const category = categories.find((item) => item.id === transaction.categoryId);
  if (category?.kind === "income") {
    return Math.abs(transaction.amount);
  }
  return -Math.abs(transaction.amount);
}

export function buildForecastSummary(params: {
  transactions: Transaction[];
  categories: Category[];
  recurring: RecurringTransaction[];
  budgets: Budget[];
  month: string;
}) {
  const today = new Date();
  let running = params.transactions.reduce(
    (sum, transaction) => sum + getSignedAmount(transaction, params.categories),
    0,
  );

  const points: ForecastPoint[] = [];
  for (let day = 0; day < 30; day += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    const recurringToday = params.recurring
      .filter((item) => item.nextRunDate === date.toISOString().slice(0, 10))
      .reduce((sum, item) => sum - Math.abs(item.amount), 0);

    running += recurringToday;
    points.push({
      date: date.toISOString().slice(0, 10),
      balance: running,
    });
  }

  const monthTransactions = params.transactions.filter(
    (transaction) => toMonthKey(transaction.date) === params.month,
  );
  const monthIncome = monthTransactions
    .filter((transaction) => getSignedAmount(transaction, params.categories) > 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const monthSpending = monthTransactions
    .filter((transaction) => getSignedAmount(transaction, params.categories) < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const budgetRisk = params.budgets.map((budget) => {
    const spent = monthTransactions
      .filter((transaction) => transaction.categoryId === budget.categoryId)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    return {
      budget,
      spent,
      ratio: budget.amount === 0 ? 0 : spent / budget.amount,
    };
  });

  return {
    points,
    currentBalance: running,
    projectedBalance: points.at(-1)?.balance ?? running,
    safeToSpend: Math.max(monthIncome - monthSpending, 0),
    budgetRisk,
  };
}
