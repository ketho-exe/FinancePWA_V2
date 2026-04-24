import { RecurringItemForm } from "@/components/forms/recurring-item-form";

export default function BillsPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Bills calendar
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Bills</h1>
        <p className="text-[var(--muted)]">
          Track recurring household payments and keep their due dates visible.
        </p>
      </header>

      <RecurringItemForm />
    </div>
  );
}
