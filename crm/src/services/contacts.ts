import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { Contact } from '../lib/types';
import { autoLinkNewContact, handleContactCompanyChange } from './connections';

export type ContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'previousCompanyIds'>;

export async function createContact(input: ContactInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  await db.contacts.add({ id, createdAt: now, updatedAt: now, ...input });
  await autoLinkNewContact(id, input.companyId);
  return id;
}

export async function updateContact(id: string, patch: Partial<ContactInput>): Promise<void> {
  const before = await db.contacts.get(id);
  const changingCompany = !!before && !!patch.companyId && patch.companyId !== before.companyId;

  await db.contacts.update(id, {
    ...patch,
    ...(changingCompany
      ? { previousCompanyIds: Array.from(new Set([...(before!.previousCompanyIds ?? []), before!.companyId])) }
      : {}),
    updatedAt: new Date().toISOString(),
  });

  if (before && changingCompany) {
    await handleContactCompanyChange(id, before.companyId, patch.companyId!);
  }
}

export async function deleteContact(id: string): Promise<void> {
  await db.transaction('rw', db.contacts, db.contactConnections, async () => {
    const [asA, asB] = await Promise.all([
      db.contactConnections.where('contactAId').equals(id).toArray(),
      db.contactConnections.where('contactBId').equals(id).toArray(),
    ]);
    await db.contactConnections.bulkDelete([...asA, ...asB].map((c) => c.id));
    await db.contacts.delete(id);
  });
}
