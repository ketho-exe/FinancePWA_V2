"use client";

import { FormEvent, ReactNode, useState } from "react";
import { FinanceWorkspaceProvider, useFinanceWorkspace } from "@/hooks/use-finance-workspace";
import { AppButton, AppCard, FinanceNav } from "@/components/finance/ui";

export function FinanceAppBoundary({ children }: { children: ReactNode }) {
  return (
    <FinanceWorkspaceProvider>
      <FinanceAppContent>{children}</FinanceAppContent>
    </FinanceWorkspaceProvider>
  );
}

export function FinanceAppContent({ children }: { children: ReactNode }) {
  const workspace = useFinanceWorkspace();

  if (!workspace.isConfigured) {
    return <ConfigScreen />;
  }

  if (workspace.authLoading) {
    return <LoadingScreen label="Checking your session" detail="Connecting to Supabase auth." />;
  }

  if (!workspace.isAuthenticated) {
    return <AuthScreen />;
  }

  if (workspace.workspaceLoading || !workspace.ready) {
    return <LoadingScreen label="Loading your workspace" detail="Fetching your live finance data." />;
  }

  return (
    <div className="finance-shell">
      <FinanceNav />
      <div className="finance-content">
        <header className="desktop-header">
          <div>
            <div className="desktop-header__eyebrow">Overview</div>
            <div className="desktop-header__title">Your money, organised</div>
          </div>
          <div className="desktop-header__tools">
            <div className="top-search">Search transactions, bills, goals</div>
            <div className="desktop-header__meta">
              <span>{workspace.userEmail}</span>
              <span>Supabase connected</span>
            </div>
          </div>
        </header>
        {workspace.errorMessage ? (
          <AppCard className="notice-bar">
            <strong>Problem:</strong> {workspace.errorMessage}
          </AppCard>
        ) : null}
        {workspace.statusMessage ? <AppCard className="notice-bar">{workspace.statusMessage}</AppCard> : null}
        <main className="finance-main">{children}</main>
      </div>
    </div>
  );
}

export function LoadingScreen({
  label,
  detail,
}: {
  label: string;
  detail?: string;
}) {
  return (
    <div className="center-screen">
      <AppCard className="loading-card">
        <strong>{label}</strong>
        {detail ? <p>{detail}</p> : null}
      </AppCard>
    </div>
  );
}

export function ConfigScreen() {
  return (
    <div className="center-screen">
      <AppCard className="loading-card">
        <strong>Supabase configuration missing</strong>
        <p>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to boot the app.</p>
      </AppCard>
    </div>
  );
}

export function DataErrorScreen({
  message,
}: {
  message: string;
}) {
  return (
    <div className="center-screen">
      <AppCard className="loading-card">
        <strong>Workspace error</strong>
        <p>{message}</p>
        <AppButton>Retry</AppButton>
      </AppCard>
    </div>
  );
}

export function AuthScreen() {
  const { signIn, signUp, errorMessage, statusMessage } = useFinanceWorkspace();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-in") {
        await signIn({ email, password });
      } else {
        await signUp({ email, password });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <AppCard className="auth-card">
        <strong>{mode === "sign-in" ? "Sign in" : "Create account"}</strong>
        <p>Use your Supabase auth credentials to open your personal workspace.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <AppButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </AppButton>
        </form>
        <div className="auth-actions">
          <button
            className="link-button"
            type="button"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "Need an account? Create one." : "Already registered? Sign in."}
          </button>
        </div>
        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
      </AppCard>
    </div>
  );
}
