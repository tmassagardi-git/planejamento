import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { Donation, Installment } from '../lib/types';

export interface DonationInput {
  companyId: string;
  opportunityId?: string;
  project: string;
  category?: string;
  strategy?: string;
  totalValue: number;
  installmentsCount: number;
  startDate: string;
  notes?: string;
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

/** Divide o valor total em N parcelas iguais (em centavos, para evitar erro de
 * arredondamento), jogando o resto de centavos na última parcela. */
function splitInstallmentValues(totalValue: number, count: number): number[] {
  const totalCents = Math.round(totalValue * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;
  return Array.from({ length: count }, (_, i) => {
    const cents = baseCents + (i === count - 1 ? remainder : 0);
    return cents / 100;
  });
}

/** Cria uma doação (gerada ao marcar uma oportunidade como ganha, ou manualmente)
 * e já gera as parcelas correspondentes. */
export async function createDonation(input: DonationInput): Promise<string> {
  const now = new Date().toISOString();
  const donationId = uuid();
  const donation: Donation = {
    id: donationId,
    companyId: input.companyId,
    opportunityId: input.opportunityId,
    project: input.project,
    category: input.category,
    strategy: input.strategy,
    totalValue: input.totalValue,
    installmentsCount: input.installmentsCount,
    startDate: input.startDate,
    status: 'ativa',
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  const values = splitInstallmentValues(input.totalValue, input.installmentsCount);
  const installments: Installment[] = values.map((value, i) => ({
    id: uuid(),
    donationId,
    number: i + 1,
    value,
    dueDate: addMonths(input.startDate, i),
    status: 'em_aberto',
    createdAt: now,
    updatedAt: now,
  }));

  await db.transaction('rw', db.donations, db.installments, async () => {
    await db.donations.add(donation);
    await db.installments.bulkAdd(installments);
  });

  return donationId;
}

export async function updateDonation(
  id: string,
  patch: Partial<Pick<Donation, 'project' | 'category' | 'strategy' | 'notes' | 'status'>>,
): Promise<void> {
  await db.donations.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteDonation(id: string): Promise<void> {
  await db.transaction('rw', db.donations, db.installments, db.opportunities, async () => {
    const installments = await db.installments.where('donationId').equals(id).toArray();
    await db.installments.bulkDelete(installments.map((i) => i.id));
    await db.donations.delete(id);
    const linkedOpportunities = await db.opportunities.where('donationId').equals(id).toArray();
    await Promise.all(
      linkedOpportunities.map((o) => db.opportunities.update(o.id, { donationId: undefined })),
    );
  });
}

export async function markInstallmentPaid(
  id: string,
  paymentDate: string,
  paymentMethod?: string,
): Promise<void> {
  await db.installments.update(id, {
    status: 'pago',
    paymentDate,
    paymentMethod,
    updatedAt: new Date().toISOString(),
  });
}

export async function markInstallmentStatus(
  id: string,
  status: Installment['status'],
  extra?: Partial<Pick<Installment, 'paymentDate' | 'paymentMethod'>>,
): Promise<void> {
  await db.installments.update(id, {
    status,
    ...(status !== 'pago' ? { paymentDate: undefined } : {}),
    ...extra,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateInstallment(
  id: string,
  patch: Partial<Pick<Installment, 'value' | 'dueDate' | 'notes'>>,
): Promise<void> {
  await db.installments.update(id, { ...patch, updatedAt: new Date().toISOString() });
}
