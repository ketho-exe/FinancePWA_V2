export function AccountForm() {
  return (
    <form className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6">
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Account name
        </span>
        <input
          aria-label="Account name"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          placeholder="Monzo"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Account type
        </span>
        <select
          aria-label="Account type"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          defaultValue="current"
        >
          <option value="current">Current</option>
          <option value="savings">Savings</option>
          <option value="credit">Credit</option>
        </select>
      </label>
    </form>
  );
}
