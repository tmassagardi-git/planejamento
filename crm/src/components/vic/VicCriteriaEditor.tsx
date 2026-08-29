import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { axisWeight, fmtPeso, VIC_AXES } from '../../lib/vic-calc';
import { createCriterion, deleteCriterion, restoreDefaultCriteria, updateCriterion } from '../../services/vic';
import { Button, Input } from '../ui/Primitives';
import { ConfirmDialog } from '../ui/Modal';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

export function VicCriteriaEditor() {
  const criteria = useLiveQuery(() => db.vicCriteria.orderBy('order').toArray(), []);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmRestore, setConfirmRestore] = useState(false);

  if (!criteria) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Critérios e pesos do Sistema VIC</h3>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setConfirmRestore(true)}>
          <RotateCcw size={13} /> Restaurar critérios padrão
        </Button>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Cada eixo (Vínculo, Interesse, Capacidade) deve ter pesos somando 10 — é essa soma que serve de divisor para
        calcular a nota do eixo em cada avaliação.
      </p>

      <div className="space-y-5">
        {VIC_AXES.map((axis) => {
          const items = criteria.filter((c) => c.eixo === axis.key);
          const total = axisWeight(criteria, axis.key);
          const ok = Math.abs(total - 10) < 0.001;
          return (
            <div key={axis.key} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider" style={{ color: axis.cor }}>
                  {axis.nome}
                </span>
                <span className="font-mono text-xs" style={{ color: ok ? '#6E6B62' : '#B4462F' }}>
                  peso total {fmtPeso(total)} {ok ? '✓' : '(deveria somar 10)'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-4 py-2">
                    <Input
                      value={drafts[c.id] ?? c.nome}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                      onBlur={() => {
                        if (drafts[c.id] !== undefined && drafts[c.id] !== c.nome) {
                          updateCriterion(c.id, { nome: drafts[c.id] });
                        }
                      }}
                      className="flex-1 border-0 border-b border-transparent px-0 py-1 text-sm focus:border-slate-300 focus:ring-0"
                    />
                    <Input
                      type="number"
                      step={0.5}
                      min={0}
                      value={c.peso}
                      onChange={(e) => updateCriterion(c.id, { peso: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-20 text-right font-mono"
                    />
                    <button
                      onClick={() => deleteCriterion(c.id)}
                      className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {items.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Nenhum critério.</p>}
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5">
                <button
                  onClick={() => createCriterion(axis.key, 'Novo critério', 1)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  <Plus size={13} /> Adicionar critério
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        onConfirm={() => restoreDefaultCriteria()}
        title="Restaurar critérios padrão"
        message="Isso substitui a lista de critérios e pesos pelos 16 critérios originais do método VIC. As avaliações já lançadas nas empresas não são apagadas, mas notas de critérios removidos deixam de contar na nota do eixo."
        confirmLabel="Restaurar"
      />
    </div>
  );
}
