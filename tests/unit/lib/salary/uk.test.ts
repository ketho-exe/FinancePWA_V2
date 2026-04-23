import { describe, expect, it } from "vitest";

import { estimateUkMonthlyPay } from "@/lib/salary/uk";

describe("estimateUkMonthlyPay", () => {
  it("returns the exact monthly breakdown for a representative salary", () => {
    const result = estimateUkMonthlyPay({
      annualSalary: 42000,
      pensionPercent: 5
    });

    expect(result.grossMonthly).toBeCloseTo(3500, 10);
    expect(result.incomeTaxMonthly).toBeCloseTo(490.5, 10);
    expect(result.nationalInsuranceMonthly).toBeCloseTo(196.2, 10);
    expect(result.pensionMonthly).toBeCloseTo(175, 10);
    expect(result.netMonthly).toBeCloseTo(2638.3, 10);
  });

  it("applies higher-rate tax and the reduced ni rate above the upper earnings limit", () => {
    const result = estimateUkMonthlyPay({
      annualSalary: 70000,
      pensionPercent: 5
    });

    expect(result.grossMonthly).toBeCloseTo(5833.333333333333, 10);
    expect(result.incomeTaxMonthly).toBeCloseTo(1286, 10);
    expect(result.nationalInsuranceMonthly).toBeCloseTo(284.21666666666664, 10);
    expect(result.pensionMonthly).toBeCloseTo(291.6666666666667, 10);
    expect(result.netMonthly).toBeCloseTo(3971.45, 10);
  });
});
