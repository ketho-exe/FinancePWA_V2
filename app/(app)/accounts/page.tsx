import { AccountForm } from "@/components/forms/account-form";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Accounts hub
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-[var(--muted)]">
          Add the cash, savings, and credit accounts you want to track.
        </p>
      </header>

      <AccountForm />
    </div>
  );
}
