import { FinanceAppBoundary } from "@/components/finance/finance-gate";

export default function FinanceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FinanceAppBoundary>{children}</FinanceAppBoundary>;
}
