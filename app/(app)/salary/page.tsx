import { SalaryForm } from "@/components/forms/salary-form";

export default function SalaryPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Salary planner
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Salary</h1>
        <p className="text-[var(--muted)]">
          Estimate UK tax, NI, pension, and net pay from a sample annual salary.
        </p>
      </header>

      <SalaryForm />
    </div>
  );
}
