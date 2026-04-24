"use client";

import { useState } from "react";

import { estimateUkMonthlyPay } from "@/lib/salary/uk";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

export function SalaryForm() {
  const [annualSalary, setAnnualSalary] = useState("42000");
  const [pensionPercent, setPensionPercent] = useState("5");
  const estimate = estimateUkMonthlyPay({
    annualSalary: Number(annualSalary) || 0,
    pensionPercent: Number(pensionPercent) || 0
  });

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6">
        <label className="block space-y-2">
          <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Annual salary
          </span>
          <input
            aria-label="Annual salary"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
            inputMode="decimal"
            min="0"
            onChange={(event) => setAnnualSalary(event.target.value)}
            step="1000"
            type="number"
            value={annualSalary}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Pension percent
          </span>
          <input
            aria-label="Pension percent"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
            inputMode="decimal"
            min="0"
            onChange={(event) => setPensionPercent(event.target.value)}
            step="0.1"
            type="number"
            value={pensionPercent}
          />
        </label>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-[#172129] p-6 text-white shadow-[0_18px_48px_rgba(23,33,41,0.18)]">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">
          Estimated monthly net pay
        </p>
        <output
          aria-live="polite"
          className="mt-3 block text-3xl font-semibold tracking-tight"
        >
          {currencyFormatter.format(estimate.netMonthly)}
        </output>
        <div className="mt-6 space-y-3 text-sm text-white/78">
          <p>Gross monthly: {currencyFormatter.format(estimate.grossMonthly)}</p>
          <p>
            Income tax: {currencyFormatter.format(estimate.incomeTaxMonthly)}
          </p>
          <p>
            National Insurance:{" "}
            {currencyFormatter.format(estimate.nationalInsuranceMonthly)}
          </p>
          <p>Pension: {currencyFormatter.format(estimate.pensionMonthly)}</p>
        </div>
      </div>
    </form>
  );
}
