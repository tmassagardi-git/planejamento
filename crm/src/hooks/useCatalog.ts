import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function useCatalog() {
  return useLiveQuery(() => db.catalog.toCollection().first(), []);
}
