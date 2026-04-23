interface EstimateUkMonthlyPayInput {
  annualSalary: number;
  pensionPercent: number;
}

export function estimateUkMonthlyPay(input: EstimateUkMonthlyPayInput) {
  const grossMonthly = input.annualSalary / 12;
  const pensionMonthly = grossMonthly * (input.pensionPercent / 100);
  const taxableAnnual = Math.max(input.annualSalary - 12570, 0);
  const incomeTaxAnnual = Math.min(taxableAnnual, 37700) * 0.2;
  const niAnnual = Math.max(input.annualSalary - 12570, 0) * 0.08;

  return {
    grossMonthly,
    incomeTaxMonthly: incomeTaxAnnual / 12,
    nationalInsuranceMonthly: niAnnual / 12,
    pensionMonthly,
    netMonthly:
      grossMonthly - incomeTaxAnnual / 12 - niAnnual / 12 - pensionMonthly
  };
}
