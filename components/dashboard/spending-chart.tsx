export interface SpendingChartItem {
  category: string;
  amount: string;
  width: string;
}

interface SpendingChartProps {
  eyebrow: string;
  title: string;
  description: string;
  items: SpendingChartItem[];
}

export function SpendingChart({
  eyebrow,
  title,
  description,
  items
}: SpendingChartProps) {
  return (
    <section
      className="rounded-[32px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-6"
      style={{
        background: "var(--panel)",
        borderColor: "var(--panel-border)"
      }}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
        <p className="max-w-md text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span>{item.category}</span>
              <span className="text-[var(--muted)]">{item.amount}</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full"
              style={{ background: "rgba(127, 142, 154, 0.18)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: item.width,
                  background:
                    "linear-gradient(90deg, rgba(214, 139, 87, 0.95), rgba(198, 110, 63, 0.78))"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
