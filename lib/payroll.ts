import { SalaryProfile } from "@/lib/types";

const PERSONAL_ALLOWANCE = 12570;

export function calculateUkSalaryProfile(profile: SalaryProfile) {
  const taxable = Math.max(profile.annualGrossSalary - PERSONAL_ALLOWANCE, 0);
  const basicTax = Math.min(taxable, 37700) * 0.2;
  const higherTax = Math.max(taxable - 37700, 0) * 0.4;
  const annualTax = basicTax + higherTax;

  const niTaxable = Math.max(profile.annualGrossSalary - 12570, 0);
  const employeeNi = Math.min(niTaxable, 37700) * 0.08 + Math.max(niTaxable - 37700, 0) * 0.02;
  const pensionDeduction = profile.pensionContribution
    ? (profile.annualGrossSalary * profile.pensionContribution) / 100
    : 0;
  const studentLoanRepayment =
    profile.studentLoanPlan && profile.studentLoanPlan !== "none"
      ? Math.max(profile.annualGrossSalary - 25000, 0) * 0.09
      : 0;
  const postgraduateLoanRepayment = profile.postgraduateLoan
    ? Math.max(profile.annualGrossSalary - 21000, 0) * 0.06
    : 0;
  const annualTakeHome =
    profile.annualGrossSalary -
    annualTax -
    employeeNi -
    pensionDeduction -
    studentLoanRepayment -
    postgraduateLoanRepayment;

  return {
    annualGross: profile.annualGrossSalary,
    annualTax,
    employeeNi,
    pensionDeduction,
    studentLoanRepayment,
    postgraduateLoanRepayment,
    annualTakeHome,
  };
}

export function getSalaryPeriodTakeHome(
  annualTakeHome: number,
  frequency: SalaryProfile["payFrequency"],
) {
  switch (frequency) {
    case "weekly":
      return annualTakeHome / 52;
    case "biweekly":
      return annualTakeHome / 26;
    case "four_weekly":
      return annualTakeHome / 13;
    case "monthly":
    default:
      return annualTakeHome / 12;
  }
}

function getMonthlyPayDate(day: number, fromDate: Date) {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const candidate = new Date(year, month, day);

  if (candidate < fromDate) {
    return new Date(year, month + 1, day);
  }

  return candidate;
}

export function getNextPayDate(profile: SalaryProfile, fromDate = new Date()) {
  if (profile.payFrequency === "monthly") {
    const day = Number(profile.payDateRule.replace(/\D/g, "")) || 28;
    return getMonthlyPayDate(day, fromDate).toISOString().slice(0, 10);
  }

  const intervalDays =
    profile.payFrequency === "weekly"
      ? 7
      : profile.payFrequency === "biweekly"
        ? 14
        : 28;

  const effective = new Date(profile.effectiveDate);
  const next = new Date(effective);

  while (next < fromDate) {
    next.setDate(next.getDate() + intervalDays);
  }

  return next.toISOString().slice(0, 10);
}

export function getSalaryScheduleOccurrences(
  profile: SalaryProfile,
  fromDate: string,
  toDate: string,
) {
  const occurrences: string[] = [];
  let cursor = new Date(profile.effectiveDate);
  const start = new Date(fromDate);
  const end = new Date(toDate);

  while (cursor <= end) {
    const currentIso = cursor.toISOString().slice(0, 10);
    if (currentIso >= fromDate && currentIso <= toDate) {
      occurrences.push(currentIso);
    }

    if (profile.payFrequency === "monthly") {
      const monthlyDay = Number(profile.payDateRule.replace(/\D/g, "")) || 28;
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + 1);
      next.setDate(monthlyDay);
      cursor = next;
    } else {
      const days =
        profile.payFrequency === "weekly"
          ? 7
          : profile.payFrequency === "biweekly"
            ? 14
            : 28;
      const next = new Date(cursor);
      next.setDate(next.getDate() + days);
      cursor = next;
    }

    if (cursor < start) {
      continue;
    }
  }

  return occurrences;
}
