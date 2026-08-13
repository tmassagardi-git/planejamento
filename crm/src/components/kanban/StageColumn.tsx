import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Opportunity, Stage } from '../../lib/types';
import { SortableOpportunityCard } from './SortableOpportunityCard';
import { formatCurrency } from '../../lib/format';
import { Plus } from 'lucide-react';

export function StageColumn({
  stage,
  opportunities,
  onCardClick,
  onAddClick,
}: {
  stage: Stage;
  opportunities: Opportunity[];
  onCardClick: (id: string) => void;
  onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = opportunities.reduce((s, o) => s + (o.value ?? 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-100">
      <div className="flex items-center justify-between rounded-t-lg px-3 py-2.5" style={{ borderTop: `3px solid ${stage.color}` }}>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            {stage.name}
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-normal text-slate-500">
              {opportunities.length}
            </span>
          </div>
          <div className="text-xs text-slate-400">{formatCurrency(total)}</div>
        </div>
        <button onClick={onAddClick} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
          <Plus size={16} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 p-2 transition-colors ${isOver ? 'bg-indigo-50' : ''}`}
      >
        <SortableContext items={opportunities.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {opportunities.map((opp) => (
            <SortableOpportunityCard key={opp.id} opportunity={opp} onClick={() => onCardClick(opp.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
