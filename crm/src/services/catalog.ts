import { db } from '../lib/db';
import type { Catalog } from '../lib/types';

export async function getCatalog(): Promise<Catalog> {
  const catalog = await db.catalog.toCollection().first();
  if (!catalog) throw new Error('Catálogo não inicializado');
  return catalog;
}

export async function updateCatalog(
  patch: Partial<Pick<Catalog, 'categories' | 'strategies' | 'paymentMethods' | 'lossReasons' | 'relationshipTypes'>>,
): Promise<void> {
  const catalog = await getCatalog();
  await db.catalog.update(catalog.id, { ...patch, updatedAt: new Date().toISOString() });
}
