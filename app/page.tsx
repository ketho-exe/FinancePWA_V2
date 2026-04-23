export default function RootPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            UK Personal Finance
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Your money, clearly
          </h1>
          <p className="text-lg text-[var(--muted)]">
            Track salary, accounts, bills, transactions, goals, and savings in a
            polished dashboard built for everyday use.
          </p>
        </div>
      </section>
    </main>
  );
}
