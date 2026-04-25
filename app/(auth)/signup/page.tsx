import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/lib/auth/actions";
import { getAuthMessage } from "@/lib/auth/forms";
import { hasSupabaseEnv } from "@/lib/env";

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const errorValue = getSearchValue(params.error);
  const messageValue = getSearchValue(params.message);
  const notice =
    getAuthMessage(errorValue) ?? errorValue ?? getAuthMessage(messageValue);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p
            className="text-sm uppercase tracking-[0.32em]"
            style={{ color: "var(--muted)" }}
          >
            Create account
          </p>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight">
            Build a private finance space that feels clear on every screen.
          </h1>
          <p className="max-w-xl text-lg leading-8" style={{ color: "var(--muted)" }}>
            Start with secure Supabase authentication, then track salary,
            transactions, recurring bills, pots, and savings goals in one place.
          </p>
          <div className="flex flex-wrap gap-3 text-sm" style={{ color: "var(--muted)" }}>
            <Link className="rounded-full border px-4 py-2" href="/">
              Back to home
            </Link>
            <Link className="rounded-full border px-4 py-2" href="/login">
              I already have an account
            </Link>
          </div>
        </div>

        <AuthForm
          action={signUpAction}
          alternateHref="/login"
          alternateLabel="Sign in"
          alternatePrompt="Already set up?"
          description="Create your private workspace with an email, password, and account name."
          isSupabaseReady={hasSupabaseEnv()}
          mode="signup"
          notice={notice}
          submitLabel="Create account"
          title="Start your finance homebase"
        />
      </section>
    </main>
  );
}
