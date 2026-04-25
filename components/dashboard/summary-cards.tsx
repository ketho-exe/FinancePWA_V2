export interface SummaryCardItem {
  title: string;
  value: string;
  detail: string;
}

interface SummaryCardsProps {
  cards: SummaryCardItem[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
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
