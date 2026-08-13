import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { Stage } from '../lib/types';

export async function createFunnel(name: string): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  await db.funnels.add({ id, name, createdAt: now, updatedAt: now });
  return id;
}

export async function renameFunnel(id: string, name: string): Promise<void> {
  await db.funnels.update(id, { name, updatedAt: new Date().toISOString() });
}

export type StageInput = Omit<Stage, 'id' | 'createdAt' | 'updatedAt' | 'order'>;

export async function createStage(input: StageInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  const siblings = await db.stages.where('funnelId').equals(input.funnelId).toArray();
  const order = siblings.length;
  await db.stages.add({ id, order, createdAt: now, updatedAt: now, ...input });
  return id;
}

export async function updateStage(id: string, patch: Partial<StageInput>): Promise<void> {
  await db.stages.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteStage(id: string): Promise<void> {
  const stage = await db.stages.get(id);
  if (!stage) return;
  const opportunitiesInStage = await db.opportunities.where('stageId').equals(id).count();
  if (opportunitiesInStage > 0) {
    throw new Error('Não é possível excluir uma etapa com oportunidades. Mova-as antes de excluir.');
  }
  await db.transaction('rw', db.stages, async () => {
    await db.stages.delete(id);
    const siblings = await db.stages
      .where('funnelId')
      .equals(stage.funnelId)
      .sortBy('order');
    await Promise.all(siblings.map((s, i) => db.stages.update(s.id, { order: i })));
  });
}

export async function reorderStages(funnelId: string, orderedStageIds: string[]): Promise<void> {
  await db.transaction('rw', db.stages, async () => {
    await Promise.all(orderedStageIds.map((id, i) => db.stages.update(id, { order: i })));
  });
  void funnelId;
}
