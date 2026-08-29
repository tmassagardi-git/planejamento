import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { fmtNota, vicMetrics, VIC_AXES } from '../../lib/vic-calc';
import { Button, Input } from '../ui/Primitives';
import { ConfirmDialog } from '../ui/Modal';
import { VicAxisBlock } from './VicAxisBlock';
import { VicSummaryCards } from './VicSummaryCards';
import { deleteEvaluation, duplicateEvaluation, setNota, setObs, updateEvaluationProject } from '../../services/vic';
import { Copy, Plus, Trash2 } from 'lucide-react';

export function VicEvaluationEditor({
  companyId,
  evaluationId,
  onSelectEvaluation,
  onCreateEvaluation,
}: {
  companyId: string;
  evaluationId: string;
  onSelectEvaluation: (id: string) => void;
  onCreateEvaluation: () => void;
}) {
  const evaluations = useLiveQuery(
    () => db.vicEvaluations.where('companyId').equals(companyId).toArray(),
    [companyId],
  );
  const evaluation = useLiveQuery(() => db.vicEvaluations.get(evaluationId), [evaluationId]);
  const criteria = useLiveQuery(() => db.vicCriteria.orderBy('order').toArray(), []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projectDraft, setProjectDraft] = useState<string | null>(null);

  if (!evaluation || !criteria || !evaluations) return null;

  const metrics = vicMetrics(criteria, evaluation);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-3.5 py-3">
          <span className="mr-1 font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Enquadramento
          </span>
          {evaluations.map((av) => {
            const active = av.id === evaluation.id;
            const total = vicMetrics(criteria, av).total;
            return (
              <button
                key={av.id}
                onClick={() => onSelectEvaluation(av.id)}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  active ? 'bg-[#1F5F5B] text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {av.projeto || 'Sem nome'} <span className="opacity-70">· {fmtNota(total)}</span>
              </button>
            );
          })}
          <div className="ml-auto flex gap-1.5">
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              onClick={async () => onSelectEvaluation(await duplicateEvaluation(evaluation.id))}
            >
              <Copy size={13} /> Duplicar VIC
            </Button>
            <Button className="px-2 py-1 text-xs" onClick={onCreateEvaluation}>
              <Plus size={13} /> Novo projeto
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-3.5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">Projeto avaliado</span>
          <Input
            value={projectDraft ?? evaluation.projeto}
            onChange={(e) => setProjectDraft(e.target.value)}
            onBlur={() => {
              if (projectDraft !== null && projectDraft !== evaluation.projeto) {
                updateEvaluationProject(evaluation.id, projectDraft);
              }
              setProjectDraft(null);
            }}
            className="max-w-xs flex-1"
          />
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-600"
          >
            <Trash2 size={13} /> Excluir este VIC
          </button>
        </div>
      </div>

      <VicSummaryCards metrics={metrics} />

      {VIC_AXES.map((ax) => (
        <VicAxisBlock
          key={ax.key}
          axis={ax.key}
          criteria={criteria}
          notas={evaluation.notas}
          obs={evaluation.obs}
          onSetNota={(cid, valor) => setNota(evaluation.id, cid, valor)}
          onSetObs={(cid, texto) => setObs(evaluation.id, cid, texto)}
        />
      ))}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          const remaining = evaluations.find((e) => e.id !== evaluation.id);
          await deleteEvaluation(evaluation.id);
          if (remaining) onSelectEvaluation(remaining.id);
        }}
        title="Excluir avaliação VIC"
        message={`Excluir a avaliação "${evaluation.projeto}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
