import { describe, expect, it } from "vitest";

import { buildFinancialSummary } from "@/lib/finance/summaries";

describe("buildFinancialSummary", () => {
  it("derives effective cash, debt, and committed spend", () => {
    const summary = buildFinancialSummary({
      accounts: [
        { kind: "current", balance: 1200, overdraft_limit: 0 },
        { kind: "credit", balance: -400, overdraft_limit: null }
      ],
      recurringItems: [{ amount: 250 }, { amount: 50 }],
      goals: [{ target_amount: 1000, saved_amount: 300 }]
    });

    expect(summary.cash).toBe(1200);
    expect(summary.debt).toBe(400);
    expect(summary.committedMonthly).toBe(300);
    expect(summary.goalProgressPercent).toBe(30);
  });
});
