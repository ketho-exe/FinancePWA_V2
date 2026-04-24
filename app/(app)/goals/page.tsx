import { GoalForm } from "@/components/forms/goal-form";

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Long-range goals
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
        <p className="text-[var(--muted)]">
          Capture bigger milestones with a date so progress has a clear horizon.
        </p>
      </header>

      <GoalForm />
    </div>
  );
}
