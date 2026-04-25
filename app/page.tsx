import Link from "next/link";

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em]" style={{ color: "var(--muted)" }}>
            UK Personal Finance
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Your money, clearly
          </h1>
          <p className="text-lg" style={{ color: "var(--muted)" }}>
            Track salary, accounts, bills, transactions, goals, and savings in a
            polished dashboard built for everyday use.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              className="rounded-full px-5 py-3 text-sm font-medium text-[#172129]"
              href="/signup"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,213,160,1) 0%, rgba(214,139,87,1) 100%)"
              }}
            >
              Create account
            </Link>
            <Link
              className="rounded-full border px-5 py-3 text-sm font-medium"
              href="/login"
              style={{ borderColor: "var(--panel-border)" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
