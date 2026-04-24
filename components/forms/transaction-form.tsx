export function TransactionForm() {
  return (
    <form className="space-y-4 rounded-[28px] border border-black/10 bg-white/60 p-6">
      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Account
        </span>
        <select
          aria-label="Account"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          defaultValue="Monzo"
        >
          <option>Monzo</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Category
        </span>
        <input
          aria-label="Category"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-lg text-[var(--fg)] outline-none"
          placeholder="Groceries"
        />
      </label>

      <button
        className="rounded-full bg-[#172129] px-4 py-2 text-sm font-medium text-white"
        type="button"
      >
        Create category
      </button>
    </form>
  );
}
