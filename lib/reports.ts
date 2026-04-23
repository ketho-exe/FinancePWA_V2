import { Category, Transaction, WorkspaceSnapshot } from "@/lib/types";
import { formatCurrency, toMonthKey } from "@/lib/utils";

function signedAmount(transaction: Transaction, categories: Category[]) {
  const category = categories.find((item) => item.id === transaction.categoryId);
  return category?.kind === "income" ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);
}

export function buildMonthlySummaryReport(
  month: string,
  transactions: Transaction[],
  categories: Category[],
) {
  const monthTransactions = transactions.filter((transaction) => toMonthKey(transaction.date) === month);
  const income = monthTransactions
    .filter((transaction) => signedAmount(transaction, categories) > 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const expenses = monthTransactions
    .filter((transaction) => signedAmount(transaction, categories) < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  return {
    month,
    income,
    expenses,
    net: income - expenses,
    transactionCount: monthTransactions.length,
  };
}

export function buildCategoryBreakdownReport(
  month: string,
  transactions: Transaction[],
  categories: Category[],
) {
  const totals = new Map<string, number>();

  for (const transaction of transactions.filter((item) => toMonthKey(item.date) === month)) {
    const category = categories.find((item) => item.id === transaction.categoryId);
    if (!category || category.kind === "income") {
      continue;
    }
    totals.set(category.name, (totals.get(category.name) ?? 0) + Math.abs(transaction.amount));
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildTrendReport(
  transactions: Transaction[],
  categories: Category[],
  months: string[],
) {
  return months.map((month) => {
    const summary = buildMonthlySummaryReport(month, transactions, categories);
    return {
      month,
      income: summary.income,
      expenses: summary.expenses,
      net: summary.net,
    };
  });
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  categories: Category[],
  accountLookup: Map<string, string>,
) {
  const rows = [
    ["date", "description", "account", "category", "amount", "source", "notes"].join(","),
    ...transactions.map((transaction) =>
      [
        transaction.date,
        csvEscape(transaction.description),
        csvEscape(accountLookup.get(transaction.accountId ?? "") ?? ""),
        csvEscape(categories.find((item) => item.id === transaction.categoryId)?.name ?? ""),
        transaction.amount.toFixed(2),
        transaction.source ?? "manual",
        csvEscape(transaction.notes ?? ""),
      ].join(","),
    ),
  ];

  return rows.join("\n");
}

export function buildMonthlySummaryCsv(
  summary: ReturnType<typeof buildMonthlySummaryReport>,
  breakdown: ReturnType<typeof buildCategoryBreakdownReport>,
) {
  const header = ["month", "income", "expenses", "net", "transaction_count"].join(",");
  const summaryRow = [
    summary.month,
    summary.income.toFixed(2),
    summary.expenses.toFixed(2),
    summary.net.toFixed(2),
    summary.transactionCount,
  ].join(",");
  const blank = "";
  const breakdownHeader = ["category", "amount"].join(",");
  const breakdownRows = breakdown.map((row) => `${csvEscape(row.category)},${row.amount.toFixed(2)}`);
  return [header, summaryRow, blank, breakdownHeader, ...breakdownRows].join("\n");
}

export function buildWorkspaceBackup(snapshot: WorkspaceSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}

export function formatReportStat(value: number) {
  return formatCurrency(value);
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
