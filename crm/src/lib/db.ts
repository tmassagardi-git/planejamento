import Dexie, { type EntityTable } from 'dexie';
import type {
  Company,
  Contact,
  Funnel,
  Stage,
  Opportunity,
  Donation,
  Installment,
  Catalog,
} from './types';

class CrmDatabase extends Dexie {
  companies!: EntityTable<Company, 'id'>;
  contacts!: EntityTable<Contact, 'id'>;
  funnels!: EntityTable<Funnel, 'id'>;
  stages!: EntityTable<Stage, 'id'>;
  opportunities!: EntityTable<Opportunity, 'id'>;
  donations!: EntityTable<Donation, 'id'>;
  installments!: EntityTable<Installment, 'id'>;
  catalog!: EntityTable<Catalog, 'id'>;

  constructor() {
    super('crm-doadores');
    this.version(1).stores({
      companies: 'id, name, cnpj, createdAt',
      contacts: 'id, companyId, name',
      funnels: 'id, name',
      stages: 'id, funnelId, order',
      opportunities: 'id, funnelId, stageId, companyId, status, order, createdAt, [funnelId+status]',
      donations: 'id, companyId, opportunityId, status, startDate',
      installments: 'id, donationId, number, dueDate, status',
      catalog: 'id',
    });
  }
}

export const db = new CrmDatabase();
