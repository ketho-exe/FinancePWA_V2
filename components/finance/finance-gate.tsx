"use client";

import { ReactNode } from "react";
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

  if (!workspace.ready) {
    return <LoadingScreen label="Loading finance workspace" detail="Preparing your desktop." />;
  }

  return (
    <div className="finance-shell">
      <header className="desktop-header">
        <div className="desktop-header__title">FinancePWA</div>
        <div className="desktop-header__meta">
          <span>{workspace.mode === "demo" ? "Preview mode" : "Supabase configured"}</span>
          <span>Last synced 2 mins ago</span>
        </div>
      </header>
      <FinanceNav />
      {workspace.mode === "demo" ? (
        <AppCard className="notice-bar">
          <strong>Preview mode:</strong> the app is fully reviewable now and will persist to
          local browser storage until you add Supabase env vars and run the schema.
        </AppCard>
      ) : null}
      <main className="finance-main">{children}</main>
      <footer className="desktop-status">
        <span>FinancePWA local build</span>
        <span>{workspace.mode === "demo" ? "Demo storage active" : "Supabase env detected"}</span>
      </footer>
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
        <p>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to switch off preview mode.</p>
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
