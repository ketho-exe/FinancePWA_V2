const summaryCards = [
  {
    title: "Net monthly position",
    value: "+£1,240",
    detail: "Income after core spending this month"
  },
  {
    title: "Upcoming bills",
    value: "4 due",
    detail: "Next payment lands in 3 days"
  },
  {
    title: "Savings progress",
    value: "68%",
    detail: "Holiday and emergency pots on track"
  }
];

export function SummaryCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((card) => (
        <article
          key={card.title}
          className="rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          style={{
            background: "var(--nav-item)",
            borderColor: "var(--panel-border)"
          }}
        >
          <p className="text-sm text-[var(--muted)]">{card.title}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            {card.value}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
