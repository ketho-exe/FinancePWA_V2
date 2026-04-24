import { PotForm } from "@/components/forms/pot-form";

export default function PotsPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Savings pots
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Pots</h1>
        <p className="text-[var(--muted)]">
          Set aside short-term savings pots for the categories you revisit most.
        </p>
      </header>

      <PotForm />
    </div>
  );
}
