import { RecurringTransaction } from "@/lib/types";

export function getActiveSubscriptions(recurring: RecurringTransaction[]) {
  return recurring.filter((item) => item.isSubscription && !item.isPaused);
}

export function getSubscriptionMonthlyCost(subscription: RecurringTransaction) {
  switch (subscription.billingCycle) {
    case "weekly":
      return (subscription.amount * 52) / 12;
    case "quarterly":
      return subscription.amount / 3;
    case "annual":
      return subscription.amount / 12;
    case "monthly":
    default:
      return subscription.amount;
  }
}

export function getSubscriptionAnnualCost(subscription: RecurringTransaction) {
  return getSubscriptionMonthlyCost(subscription) * 12;
}

export function getNextBillingDate(subscription: RecurringTransaction) {
  return subscription.nextRunDate;
}

export function getUpcomingRenewals(
  subscriptions: RecurringTransaction[],
  withinDays: number,
) {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + withinDays);

  return subscriptions
    .map((subscription) => {
      const nextBillingDate = new Date(getNextBillingDate(subscription));
      const daysUntil = Math.ceil(
        (nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        subscription,
        nextBillingDate: subscription.nextRunDate,
        daysUntil,
      };
    })
    .filter(({ nextBillingDate }) => {
      const date = new Date(nextBillingDate);
      return date >= today && date <= end;
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function buildSubscriptionSummary(subscriptions: RecurringTransaction[]) {
  const active = getActiveSubscriptions(subscriptions);
  const totalMonthlyCost = active.reduce(
    (sum, item) => sum + getSubscriptionMonthlyCost(item),
    0,
  );

  return {
    totalMonthlyCost,
    totalAnnualEquivalent: totalMonthlyCost * 12,
    activeCount: active.length,
    pausedCount: subscriptions.filter((item) => item.isPaused).length,
    upcomingRenewals: getUpcomingRenewals(active, 14),
  };
}

export function getSubscriptionStatus(subscription: RecurringTransaction) {
  if (subscription.isPaused) {
    return "paused";
  }

  if (subscription.trialEndDate) {
    const trialDate = new Date(subscription.trialEndDate);
    if (trialDate >= new Date()) {
      return "trial";
    }
  }

  return "active";
}
