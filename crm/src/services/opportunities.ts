import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { Opportunity } from '../lib/types';

export type OpportunityInput = Omit<
  Opportunity,
  'id' | 'createdAt' | 'updatedAt' | 'order' | 'status' | 'closedAt' | 'lostReason' | 'donationId'
>;

export async function createOpportunity(input: OpportunityInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  const siblings = await db.opportunities.where('stageId').equals(input.stageId).toArray();
  const order = siblings.length;
  await db.opportunities.add({
    id,
    order,
    status: 'aberta',
    createdAt: now,
    updatedAt: now,
    ...input,
  });
  return id;
}

export async function updateOpportunity(
  id: string,
  patch: Partial<OpportunityInput>,
): Promise<void> {
  await db.opportunities.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteOpportunity(id: string): Promise<void> {
  await db.opportunities.delete(id);
}

/** Move uma oportunidade para uma etapa/posição (drag and drop no kanban),
 * renumerando `order` na etapa de origem e na de destino. */
export async function moveOpportunity(
  opportunityId: string,
  targetStageId: string,
  targetIndex: number,
): Promise<void> {
  await db.transaction('rw', db.opportunities, async () => {
    const moved = await db.opportunities.get(opportunityId);
    if (!moved) return;
    const sourceStageId = moved.stageId;

    if (sourceStageId === targetStageId) {
      const siblings = (await db.opportunities.where('stageId').equals(targetStageId).sortBy('order')).filter(
        (o) => o.id !== opportunityId,
      );
      siblings.splice(targetIndex, 0, moved);
      await Promise.all(siblings.map((o, i) => db.opportunities.update(o.id, { order: i })));
    } else {
      const sourceSiblings = (
        await db.opportunities.where('stageId').equals(sourceStageId).sortBy('order')
      ).filter((o) => o.id !== opportunityId);
      await Promise.all(sourceSiblings.map((o, i) => db.opportunities.update(o.id, { order: i })));

      const targetSiblings = await db.opportunities.where('stageId').equals(targetStageId).sortBy('order');
      targetSiblings.splice(targetIndex, 0, moved);
      await Promise.all(
        targetSiblings.map((o, i) =>
          db.opportunities.update(o.id, {
            order: i,
            stageId: o.id === opportunityId ? targetStageId : o.stageId,
            updatedAt: o.id === opportunityId ? new Date().toISOString() : o.updatedAt,
          }),
        ),
      );
    }
  });
}

export async function markOpportunityLost(id: string, reason: string): Promise<void> {
  await db.opportunities.update(id, {
    status: 'perdida',
    lostReason: reason,
    closedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function reopenOpportunity(id: string): Promise<void> {
  await db.opportunities.update(id, {
    status: 'aberta',
    lostReason: undefined,
    closedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function markOpportunityWon(id: string, donationId: string): Promise<void> {
  await db.opportunities.update(id, {
    status: 'ganha',
    donationId,
    closedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
