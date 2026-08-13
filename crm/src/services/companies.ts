import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { Company } from '../lib/types';

export type CompanyInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

export async function createCompany(input: CompanyInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  await db.companies.add({ id, createdAt: now, updatedAt: now, ...input });
  return id;
}

export async function updateCompany(id: string, patch: Partial<CompanyInput>): Promise<void> {
  await db.companies.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteCompany(id: string): Promise<void> {
  await db.transaction('rw', db.companies, db.contacts, db.opportunities, db.donations, db.installments, async () => {
    const contacts = await db.contacts.where('companyId').equals(id).toArray();
    await db.contacts.bulkDelete(contacts.map((c) => c.id));

    const opportunities = await db.opportunities.where('companyId').equals(id).toArray();
    await db.opportunities.bulkDelete(opportunities.map((o) => o.id));

    const donations = await db.donations.where('companyId').equals(id).toArray();
    for (const donation of donations) {
      const installments = await db.installments.where('donationId').equals(donation.id).toArray();
      await db.installments.bulkDelete(installments.map((i) => i.id));
    }
    await db.donations.bulkDelete(donations.map((d) => d.id));

    await db.companies.delete(id);
  });
}
