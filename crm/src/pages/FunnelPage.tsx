import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '../lib/db';
import type { Opportunity, Stage } from '../lib/types';
import { StageColumn } from '../components/kanban/StageColumn';
import { OpportunityCardView } from '../components/kanban/OpportunityCardView';
import { OpportunityForm } from '../components/OpportunityForm';
import { OpportunityDrawer } from '../components/OpportunityDrawer';
import { Modal } from '../components/ui/Modal';
import { Badge, Button, Select } from '../components/ui/Primitives';
import { moveOpportunity } from '../services/opportunities';
import { formatCurrency, formatDate, formatMonthKey } from '../lib/format';
import { Kanban, List, Plus } from 'lucide-react';

export function FunnelPage() {
  const funnels = useLiveQuery(() => db.funnels.toArray(), []);
  const [funnelId, setFunnelId] = useState<string>('');
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [statusFilter, setStatusFilter] = useState<'aberta' | 'todas'>('aberta');

  useEffect(() => {
    if (!funnelId && funnels && funnels.length > 0) setFunnelId(funnels[0].id);
  }, [funnels, funnelId]);

  const stages = useLiveQuery(
    () =>
      funnelId
        ? db.stages.where('funnelId').equals(funnelId).sortBy('order')
        : Promise.resolve([] as Stage[]),
    [funnelId],
  );
  const openOpportunities = useLiveQuery(
    () =>
      funnelId
        ? db.opportunities.where({ funnelId, status: 'aberta' }).toArray()
        : Promise.resolve([] as Opportunity[]),
    [funnelId],
  );
  const allOpportunities = useLiveQuery(
    () =>
      funnelId
        ? db.opportunities.where('funnelId').equals(funnelId).toArray()
        : Promise.resolve([] as Opportunity[]),
    [funnelId],
  );

  const [columns, setColumns] = useState<Record<string, Opportunity[]>>({});
  const draggingRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (draggingRef.current || !stages || !openOpportunities) return;
    const grouped: Record<string, Opportunity[]> = {};
    for (const stage of stages) grouped[stage.id] = [];
    for (const opp of openOpportunities) {
      (grouped[opp.stageId] ??= []).push(opp);
    }
    for (const key in grouped) grouped[key].sort((a, b) => a.order - b.order);
    setColumns(grouped);
  }, [stages, openOpportunities]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [creatingStageId, setCreatingStageId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  function findContainer(id: string): string | undefined {
    if (columns[id]) return id;
    return Object.keys(columns).find((key) => columns[key].some((o) => o.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    draggingRef.current = true;
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string) ?? (over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer] ?? [];
      const activeIndex = activeItems.findIndex((o) => o.id === active.id);
      if (activeIndex === -1) return prev;
      const overIndex = overItems.findIndex((o) => o.id === over.id);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      const movedItem = { ...activeItems[activeIndex], stageId: overContainer };
      return {
        ...prev,
        [activeContainer]: activeItems.filter((o) => o.id !== active.id),
        [overContainer]: [...overItems.slice(0, newIndex), movedItem, ...overItems.slice(newIndex)],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    draggingRef.current = false;
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const container = findContainer(active.id as string);
    if (!container) return;
    const items = columns[container] ?? [];
    const activeIndex = items.findIndex((o) => o.id === active.id);
    if (activeIndex === -1) return;
    let overIndex = activeIndex;
    if (over.id !== active.id) {
      const overContainer = findContainer(over.id as string);
      if (overContainer === container) {
        overIndex = items.findIndex((o) => o.id === over.id);
      } else {
        overIndex = items.length - 1;
      }
    }
    const newItems = arrayMove(items, activeIndex, overIndex);
    setColumns((prev) => ({ ...prev, [container]: newItems }));
    await moveOpportunity(active.id as string, container, overIndex);
  }

  const activeOpportunity = useMemo(
    () => Object.values(columns).flat().find((o) => o.id === activeId),
    [columns, activeId],
  );

  const listItems = useMemo(() => {
    const source = statusFilter === 'aberta' ? openOpportunities : allOpportunities;
    return (source ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [statusFilter, openOpportunities, allOpportunities]);

  const stageById = useMemo(() => new Map((stages ?? []).map((s) => [s.id, s])), [stages]);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Funil de Vendas</h1>
          <p className="text-sm text-slate-500">Prospecção e fechamento de empresas doadoras</p>
        </div>
        <div className="flex items-center gap-2">
          {funnels && funnels.length > 1 && (
            <Select value={funnelId} onChange={(e) => setFunnelId(e.target.value)} className="w-48">
              {funnels.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          )}
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              <Kanban size={15} /> Kanban
            </button>
            <button
              onClick={() => setView('lista')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${view === 'lista' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              <List size={15} /> Lista
            </button>
          </div>
          <Button onClick={() => setCreatingStageId(stages?.[0]?.id ?? null)} disabled={!stages?.length}>
            <Plus size={16} /> Nova oportunidade
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-3 overflow-x-auto pb-4">
            {stages?.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                opportunities={columns[stage.id] ?? []}
                onCardClick={setSelectedOpportunityId}
                onAddClick={() => setCreatingStageId(stage.id)}
              />
            ))}
            {stages?.length === 0 && (
              <p className="text-sm text-slate-400">
                Nenhuma etapa configurada. Crie etapas em Configurações.
              </p>
            )}
          </div>
          <DragOverlay>{activeOpportunity && <OpportunityCardView opportunity={activeOpportunity} />}</DragOverlay>
        </DndContext>
      ) : (
        <div>
          <div className="mb-3 flex justify-end">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'aberta' | 'todas')} className="w-40">
              <option value="aberta">Abertas</option>
              <option value="todas">Todas</option>
            </Select>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Oportunidade</th>
                  <th className="px-4 py-2.5">Etapa</th>
                  <th className="px-4 py-2.5">Valor</th>
                  <th className="px-4 py-2.5">Mês trabalhado</th>
                  <th className="px-4 py-2.5">Criada em</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listItems.map((opp) => (
                  <tr key={opp.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedOpportunityId(opp.id)}>
                    <td className="px-4 py-3 font-medium text-slate-900">{opp.name}</td>
                    <td className="px-4 py-3 text-slate-500">{stageById.get(opp.stageId)?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(opp.value)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatMonthKey(opp.workingMonth)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(opp.createdAt)}</td>
                    <td className="px-4 py-3">
                      {opp.status === 'aberta' && <Badge color="sky">Aberta</Badge>}
                      {opp.status === 'ganha' && <Badge color="green">Ganha</Badge>}
                      {opp.status === 'perdida' && <Badge color="red">Perdida</Badge>}
                    </td>
                  </tr>
                ))}
                {listItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Nenhuma oportunidade encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!creatingStageId} onClose={() => setCreatingStageId(null)} title="Nova oportunidade" width="lg">
        {creatingStageId && funnelId && (
          <OpportunityForm
            funnelId={funnelId}
            stageId={creatingStageId}
            onSaved={(id) => {
              setCreatingStageId(null);
              setSelectedOpportunityId(id);
            }}
            onCancel={() => setCreatingStageId(null)}
          />
        )}
      </Modal>

      {selectedOpportunityId && (
        <OpportunityDrawer opportunityId={selectedOpportunityId} onClose={() => setSelectedOpportunityId(null)} />
      )}
    </div>
  );
}
