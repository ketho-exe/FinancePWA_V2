import { describe, expect, it } from "vitest";

import { estimateUkMonthlyPay } from "@/lib/salary/uk";

describe("estimateUkMonthlyPay", () => {
  it("returns tax, ni, pension, and net pay for an annual salary", () => {
    const result = estimateUkMonthlyPay({
      annualSalary: 42000,
      pensionPercent: 5
    });

    expect(result.grossMonthly).toBeCloseTo(3500, 2);
    expect(result.incomeTaxMonthly).toBeGreaterThan(0);
    expect(result.nationalInsuranceMonthly).toBeGreaterThan(0);
    expect(result.pensionMonthly).toBeCloseTo(175, 2);
    expect(result.netMonthly).toBeLessThan(3500);
  });
});
