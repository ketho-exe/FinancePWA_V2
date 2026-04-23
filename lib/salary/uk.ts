const PERSONAL_ALLOWANCE = 12_570;
const BASIC_RATE_BAND = 37_700;
const HIGHER_RATE_LIMIT = 125_140;
const NI_PRIMARY_THRESHOLD = 12_570;
const NI_UPPER_EARNINGS_LIMIT = 50_270;

export interface EstimateUkMonthlyPayInput {
  annualSalary: number;
  pensionPercent: number;
}

function calculateIncomeTax(annualSalary: number) {
  const taxableIncome = Math.max(annualSalary - PERSONAL_ALLOWANCE, 0);
  const basicBandTaxable = Math.min(taxableIncome, BASIC_RATE_BAND);
  const higherBandTaxable = Math.min(
    Math.max(taxableIncome - BASIC_RATE_BAND, 0),
    HIGHER_RATE_LIMIT - PERSONAL_ALLOWANCE - BASIC_RATE_BAND
  );
  const additionalBandTaxable = Math.max(
    taxableIncome - BASIC_RATE_BAND - higherBandTaxable,
    0
  );

  return (
    basicBandTaxable * 0.2 +
    higherBandTaxable * 0.4 +
    additionalBandTaxable * 0.45
  );
}

function calculateNationalInsurance(annualSalary: number) {
  const mainRateEarnings = Math.min(
    Math.max(annualSalary - NI_PRIMARY_THRESHOLD, 0),
    NI_UPPER_EARNINGS_LIMIT - NI_PRIMARY_THRESHOLD
  );
  const additionalRateEarnings = Math.max(
    annualSalary - NI_UPPER_EARNINGS_LIMIT,
    0
  );

  return mainRateEarnings * 0.08 + additionalRateEarnings * 0.02;
}

export function estimateUkMonthlyPay(input: EstimateUkMonthlyPayInput) {
  const grossMonthly = input.annualSalary / 12;

  // Pension is modeled as a simple percentage of gross pay deducted from take-home.
  // This estimator does not reduce income tax or NI for salary sacrifice/net pay schemes.
  const pensionMonthly = grossMonthly * (input.pensionPercent / 100);
  const incomeTaxAnnual = calculateIncomeTax(input.annualSalary);
  const niAnnual = calculateNationalInsurance(input.annualSalary);

  return {
    grossMonthly,
    incomeTaxMonthly: incomeTaxAnnual / 12,
    nationalInsuranceMonthly: niAnnual / 12,
    pensionMonthly,
    netMonthly:
      grossMonthly - incomeTaxAnnual / 12 - niAnnual / 12 - pensionMonthly
  };
}
