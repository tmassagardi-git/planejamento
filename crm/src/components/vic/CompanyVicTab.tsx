import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Button } from '../ui/Primitives';
import { VicEvaluationEditor } from './VicEvaluationEditor';
import { createEvaluation } from '../../services/vic';
import { VIC_DEFAULT_PROJECT } from '../../lib/vic-calc';
import { Plus } from 'lucide-react';

export function CompanyVicTab({
  companyId,
  initialEvaluationId,
}: {
  companyId: string;
  initialEvaluationId?: string | null;
}) {
  const evaluations = useLiveQuery(
    () => db.vicEvaluations.where('companyId').equals(companyId).toArray(),
    [companyId],
  );
  const [selected, setSelected] = useState<string | null>(initialEvaluationId ?? null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (initialEvaluationId) setSelected(initialEvaluationId);
  }, [initialEvaluationId]);

  useEffect(() => {
    if (!evaluations) return;
    if (selected && evaluations.some((e) => e.id === selected)) return;
    setSelected(evaluations[0]?.id ?? null);
  }, [evaluations, selected]);

  if (!evaluations) return null;

  async function handleCreate() {
    setCreating(true);
    try {
      const id = await createEvaluation(companyId, VIC_DEFAULT_PROJECT);
      setSelected(id);
    } finally {
      setCreating(false);
    }
  }

  if (evaluations.length === 0 || !selected) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="max-w-sm text-sm text-slate-500">
          Nenhuma avaliação VIC (Vínculo, Interesse, Capacidade) lançada para esta empresa ainda.
        </p>
        <Button onClick={handleCreate} disabled={creating}>
          <Plus size={15} /> Iniciar avaliação VIC
        </Button>
      </div>
    );
  }

  return (
    <VicEvaluationEditor
      companyId={companyId}
      evaluationId={selected}
      onSelectEvaluation={setSelected}
      onCreateEvaluation={handleCreate}
    />
  );
}
