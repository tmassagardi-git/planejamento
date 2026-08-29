import { VIC_AXES, VIC_TOTAL_COLOR, fmtNota, type VicMetrics } from '../../lib/vic-calc';

export function VicSummaryCards({ metrics }: { metrics: VicMetrics }) {
  const cards = [
    ...VIC_AXES.map((ax) => ({ nome: ax.nome, cor: ax.cor, valor: metrics[ax.key.toLowerCase() as 'v' | 'i' | 'c'], max: 5 })),
    { nome: 'Nota total', cor: VIC_TOTAL_COLOR, valor: metrics.total, max: 15 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.nome} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{card.nome}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: card.cor }}>
            {fmtNota(card.valor)}
          </div>
          <div className="mt-2 h-1 rounded-full bg-slate-100">
            <div
              className="h-1 rounded-full"
              style={{ width: `${Math.min(100, (card.valor / card.max) * 100)}%`, background: card.cor }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
