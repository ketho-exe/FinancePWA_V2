import { RecurringTransaction } from "@/lib/types";

function addMonths(dateIso: string, months: number) {
  const date = new Date(dateIso);
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

export function getNextRecurringDate(recurring: RecurringTransaction, fromDate?: string) {
  const base = fromDate ?? recurring.nextRunDate;
  switch (recurring.billingCycle) {
    case "weekly": {
      const date = new Date(base);
      date.setDate(date.getDate() + 7);
      return date.toISOString().slice(0, 10);
    }
    case "quarterly":
      return addMonths(base, 3);
    case "annual":
      return addMonths(base, 12);
    case "monthly":
    default:
      return addMonths(base, 1);
  }
}

export function getRecurringOccurrences(
  recurring: RecurringTransaction,
  fromDate: string,
  toDate: string,
) {
  const occurrences: string[] = [];
  let cursor = recurring.nextRunDate;

  while (cursor <= toDate) {
    if (cursor >= fromDate) {
      occurrences.push(cursor);
    }
    cursor = getNextRecurringDate(recurring, cursor);
  }

  return occurrences;
}

export function getBillDueStatus(recurring: RecurringTransaction, today = new Date()) {
  if (recurring.lastPaidDate === recurring.nextRunDate) {
    return "paid" as const;
  }

  const dueDate = new Date(recurring.nextRunDate);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue" as const;
  if (diffDays <= 7) return "due_soon" as const;
  return "upcoming" as const;
}
