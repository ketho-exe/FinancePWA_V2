import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { getAuthMessage } from "@/lib/auth/forms";
import { hasSupabaseEnv } from "@/lib/env";
import { signInAction } from "@/lib/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const errorValue = getSearchValue(params.error);
  const messageValue = getSearchValue(params.message);
  const notice =
    getAuthMessage(errorValue) ?? errorValue ?? getAuthMessage(messageValue);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <p
            className="text-sm uppercase tracking-[0.32em]"
            style={{ color: "var(--muted)" }}
          >
            Sign in
          </p>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight">
            Return to the dashboard that keeps your whole month in view.
          </h1>
          <p className="max-w-xl text-lg leading-8" style={{ color: "var(--muted)" }}>
            Salary forecasting, account balances, planned bills, saving pots, and
            goals all stay in one calm space built for everyday check-ins.
          </p>
          <div className="flex flex-wrap gap-3 text-sm" style={{ color: "var(--muted)" }}>
            <Link className="rounded-full border px-4 py-2" href="/">
              Back to home
            </Link>
            <Link className="rounded-full border px-4 py-2" href="/signup">
              Create an account
            </Link>
          </div>
        </div>

        <AuthForm
          action={signInAction}
          alternateHref="/signup"
          alternateLabel="Create one"
          alternatePrompt="Need an account?"
          description="Use your email and password to pick up where you left off."
          isSupabaseReady={hasSupabaseEnv()}
          mode="login"
          notice={notice}
          submitLabel="Sign in"
          title="Welcome back"
        />
      </section>
    </main>
  );
}
