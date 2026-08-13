import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { Contact } from '../lib/types';

export type ContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;

export async function createContact(input: ContactInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  await db.contacts.add({ id, createdAt: now, updatedAt: now, ...input });
  return id;
}

export async function updateContact(id: string, patch: Partial<ContactInput>): Promise<void> {
  await db.contacts.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteContact(id: string): Promise<void> {
  await db.contacts.delete(id);
}
