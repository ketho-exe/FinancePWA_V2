import { TransactionForm } from "@/components/forms/transaction-form";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Transactions log
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-[var(--muted)]">
          Capture spending against the right account and create new categories
          as you go.
        </p>
      </header>

      <TransactionForm />
    </div>
  );
}
