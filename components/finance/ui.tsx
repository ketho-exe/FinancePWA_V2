"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn, formatCurrency } from "@/lib/utils";

export function AppCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("app-card", className)}>{children}</section>;
}

export function AppPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("app-panel", className)}>{children}</section>;
}

export function AppButton({
  children,
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  variant?: "default" | "primary" | "danger";
}) {
  return (
    <button
      className={cn("app-button", `app-button--${variant}`, className)}
      type={props.type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}

export function AppWindow({
  title,
  icon,
  statusText,
  action,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  statusText?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("app-window", className)}>
      <div className="app-window__header">
        <div className="app-window__title">
          {icon ? <span className="app-window__icon">{icon}</span> : null}
          <span>{title}</span>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="app-window__body">{children}</div>
      {statusText ? <div className="app-window__status">{statusText}</div> : null}
    </section>
  );
}

export function AppGroupBox({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("app-group", className)}>
      <legend>{label}</legend>
      {children}
    </fieldset>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <AppCard className="metric-card">
      <p className="metric-card__label">{label}</p>
      <p className={cn("metric-card__value", `metric-card__value--${tone}`)}>{value}</p>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </AppCard>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <AppPanel className="empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </AppPanel>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "normal",
}: {
  value: number;
  max: number;
  tone?: "normal" | "warning" | "danger";
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("progress__fill", `progress__fill--${tone}`)}
        style={{ width: `${percent}%` }}
      />
      <span className="progress__label">{Math.round(percent)}%</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("status-badge", `status-badge--${status}`)}>{status}</span>;
}

export function ForecastChart({
  points,
}: {
  points: Array<{ date: string; balance: number }>;
}) {
  if (points.length === 0) {
    return <EmptyState title="No forecast yet" body="Add recurring items to see a forward view." />;
  }

  const balances = points.map((point) => point.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const range = Math.max(max - min, 1);

  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.balance - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="forecast-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={path} fill="none" stroke="#000080" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/accounts", label: "Accounts", icon: "🏦" },
  { href: "/transactions", label: "Transactions", icon: "💳" },
  { href: "/budgets", label: "Budgets", icon: "📁" },
  { href: "/bills", label: "Bills & Recurring", icon: "🔁" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/data", label: "Data", icon: "🗂️" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function FinanceNav() {
  const pathname = usePathname();

  return (
    <nav className="finance-nav" aria-label="Primary">
      <div className="finance-nav__brand">
        <span className="finance-nav__logo">F</span>
        <div>
          <strong>FinancePWA</strong>
          <p>Personal finance workspace</p>
        </div>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("finance-nav__item", active && "finance-nav__item--active")}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CurrencyText({ value }: { value: number }) {
  return <span>{formatCurrency(value)}</span>;
}

export function QuickStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className={cn("quick-stat", `quick-stat--${tone}`)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
