import type { VicCriterion } from '../../lib/types';
import { axisResult, fmtNota, fmtPeso, VIC_AXES, type VicAxis } from '../../lib/vic-calc';
import { Textarea } from '../ui/Primitives';

export function VicAxisBlock({
  axis,
  criteria,
  notas,
  obs,
  onSetNota,
  onSetObs,
}: {
  axis: VicAxis;
  criteria: VicCriterion[];
  notas: Record<string, number>;
  obs: Record<string, string>;
  onSetNota: (criterionId: string, valor: number) => void;
  onSetObs: (criterionId: string, texto: string) => void;
}) {
  const info = VIC_AXES.find((a) => a.key === axis)!;
  const axisCriteria = criteria.filter((c) => c.eixo === axis).sort((a, b) => a.order - b.order);
  const { soma, peso, nota } = axisResult(criteria, axis, notas);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5">
        <span
          className="font-mono text-xs font-semibold uppercase tracking-wider"
          style={{ color: info.cor }}
        >
          {info.nome}
        </span>
        <span className="font-mono text-xs text-slate-500">
          soma {fmtPeso(soma)} ÷ peso {fmtPeso(peso)} = <strong className="text-sm text-slate-900">{fmtNota(nota)}</strong>
        </span>
      </div>
      {axisCriteria.length === 0 && (
        <p className="px-4 py-3 text-sm text-slate-400">Nenhum critério neste eixo — adicione em Configurações.</p>
      )}
      <div className="divide-y divide-slate-100">
        {axisCriteria.map((c) => {
          const notaValor = notas[c.id] || 0;
          return (
            <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_44px_56px_48px] items-start gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_44px_56px_48px_minmax(0,1.1fr)]">
              <span className="text-sm text-slate-700">{c.nome}</span>
              <span className="pt-1 text-right font-mono text-xs text-slate-500">{fmtPeso(c.peso)}</span>
              <select
                value={notaValor}
                onChange={(e) => onSetNota(c.id, Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-1 py-1 text-center font-mono text-sm"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="pt-1 text-right font-mono text-sm font-semibold text-slate-900">
                {fmtPeso(c.peso * notaValor)}
              </span>
              <Textarea
                value={obs[c.id] ?? ''}
                onChange={(e) => onSetObs(c.id, e.target.value)}
                placeholder="anotações da pesquisa"
                rows={1}
                className="col-span-4 mt-1.5 text-xs sm:col-span-1 sm:mt-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
