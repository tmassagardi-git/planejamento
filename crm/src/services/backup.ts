import { db } from '../lib/db';

export interface BackupData {
  version: 1;
  exportedAt: string;
  companies: unknown[];
  contacts: unknown[];
  funnels: unknown[];
  stages: unknown[];
  opportunities: unknown[];
  donations: unknown[];
  installments: unknown[];
  catalog: unknown[];
}

export async function exportBackup(): Promise<BackupData> {
  const [companies, contacts, funnels, stages, opportunities, donations, installments, catalog] =
    await Promise.all([
      db.companies.toArray(),
      db.contacts.toArray(),
      db.funnels.toArray(),
      db.stages.toArray(),
      db.opportunities.toArray(),
      db.donations.toArray(),
      db.installments.toArray(),
      db.catalog.toArray(),
    ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    companies,
    contacts,
    funnels,
    stages,
    opportunities,
    donations,
    installments,
    catalog,
  };
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = data.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `crm-doadores-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restaura um backup, SUBSTITUINDO todos os dados atuais. */
export async function importBackup(data: BackupData): Promise<void> {
  if (data.version !== 1) throw new Error('Versão de backup não suportada.');
  await db.transaction(
    'rw',
    [db.companies, db.contacts, db.funnels, db.stages, db.opportunities, db.donations, db.installments, db.catalog],
    async () => {
      await Promise.all([
        db.companies.clear(),
        db.contacts.clear(),
        db.funnels.clear(),
        db.stages.clear(),
        db.opportunities.clear(),
        db.donations.clear(),
        db.installments.clear(),
        db.catalog.clear(),
      ]);
      await Promise.all([
        db.companies.bulkAdd(data.companies as Parameters<typeof db.companies.bulkAdd>[0]),
        db.contacts.bulkAdd(data.contacts as Parameters<typeof db.contacts.bulkAdd>[0]),
        db.funnels.bulkAdd(data.funnels as Parameters<typeof db.funnels.bulkAdd>[0]),
        db.stages.bulkAdd(data.stages as Parameters<typeof db.stages.bulkAdd>[0]),
        db.opportunities.bulkAdd(data.opportunities as Parameters<typeof db.opportunities.bulkAdd>[0]),
        db.donations.bulkAdd(data.donations as Parameters<typeof db.donations.bulkAdd>[0]),
        db.installments.bulkAdd(data.installments as Parameters<typeof db.installments.bulkAdd>[0]),
        db.catalog.bulkAdd(data.catalog as Parameters<typeof db.catalog.bulkAdd>[0]),
      ]);
    },
  );
}
