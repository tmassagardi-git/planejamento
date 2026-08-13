import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { createStage, deleteStage, reorderStages, updateStage } from '../services/funnels';
import { Button, Input } from './ui/Primitives';
import { ConfirmDialog } from './ui/Modal';
import type { Stage } from '../lib/types';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';

const PALETTE = ['#94a3b8', '#38bdf8', '#a78bfa', '#fb923c', '#34d399', '#f472b6', '#facc15', '#ef4444'];

export function StagesEditor({ funnelId }: { funnelId: string }) {
  const stages = useLiveQuery(() => db.stages.where('funnelId').equals(funnelId).sortBy('order'), [funnelId]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleting, setDeleting] = useState<Stage | null>(null);
  const [error, setError] = useState('');

  async function addStage() {
    const name = newName.trim();
    if (!name) return;
    const color = PALETTE[(stages?.length ?? 0) % PALETTE.length];
    await createStage({ funnelId, name, color });
    setNewName('');
  }

  async function saveEdit(id: string) {
    if (!editingName.trim()) return;
    await updateStage(id, { name: editingName.trim() });
    setEditingId(null);
  }

  async function move(index: number, dir: -1 | 1) {
    if (!stages) return;
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    const ids = stages.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await reorderStages(funnelId, ids);
  }

  async function handleDelete(stage: Stage) {
    setError('');
    try {
      await deleteStage(stage.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir etapa.');
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Etapas do funil</h3>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="space-y-2">
        {stages?.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stage.color }} />
            {editingId === stage.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(stage.id)}
                autoFocus
                className="flex-1"
              />
            ) : (
              <span className="flex-1 text-sm text-slate-700">{stage.name}</span>
            )}
            <div className="flex shrink-0 items-center gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === (stages?.length ?? 0) - 1}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              {editingId === stage.id ? (
                <Button className="px-2 py-1 text-xs" onClick={() => saveEdit(stage.id)}>
                  Salvar
                </Button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(stage.id);
                    setEditingName(stage.name);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <Pencil size={14} />
                </button>
              )}
              <button onClick={() => setDeleting(stage)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStage())}
          placeholder="Nova etapa..."
        />
        <Button type="button" variant="secondary" onClick={addStage}>
          <Plus size={15} />
        </Button>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && handleDelete(deleting)}
        title="Excluir etapa"
        message={`Excluir a etapa "${deleting?.name}"? Só é possível excluir etapas sem oportunidades.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
