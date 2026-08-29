import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { ContactConnection } from '../lib/types';

const AUTO_COLLEAGUE = 'Colegas de trabalho';
const AUTO_EX_COLLEAGUE = 'Ex colega de trabalho';

async function findConnectionBetween(aId: string, bId: string): Promise<ContactConnection | undefined> {
  const asA = await db.contactConnections.where('contactAId').equals(aId).toArray();
  const direct = asA.find((c) => c.contactBId === bId);
  if (direct) return direct;
  const asB = await db.contactConnections.where('contactAId').equals(bId).toArray();
  return asB.find((c) => c.contactBId === aId);
}

/** Cria ou atualiza uma conexão manual entre dois contatos (via UI). Sempre
 * "assume o controle" da conexão (marca como não-automática), mesmo que já
 * existisse uma conexão automática entre os dois. */
export async function createOrUpdateConnection(
  contactAId: string,
  contactBId: string,
  tipoAB: string,
  tipoBA: string,
  notes?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const existing = await findConnectionBetween(contactAId, contactBId);
  if (existing) {
    if (existing.contactAId === contactAId) {
      await db.contactConnections.update(existing.id, { tipoAB, tipoBA, auto: false, notes, updatedAt: now });
    } else {
      await db.contactConnections.update(existing.id, { tipoAB: tipoBA, tipoBA: tipoAB, auto: false, notes, updatedAt: now });
    }
    return existing.id;
  }
  const id = uuid();
  await db.contactConnections.add({
    id,
    contactAId,
    contactBId,
    tipoAB,
    tipoBA,
    auto: false,
    notes,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function deleteConnection(id: string): Promise<void> {
  await db.contactConnections.delete(id);
}

export interface ConnectionView {
  connectionId: string;
  contactId: string; // o OUTRO contato da conexão
  tipo: string; // tipo visto a partir do contato consultado
  auto?: boolean;
  notes?: string;
}

/** Lista as conexões de um contato, já normalizadas na perspectiva dele
 * (não importa se ele é o "A" ou o "B" salvo no registro). */
export async function getConnectionsForContact(contactId: string): Promise<ConnectionView[]> {
  const [asA, asB] = await Promise.all([
    db.contactConnections.where('contactAId').equals(contactId).toArray(),
    db.contactConnections.where('contactBId').equals(contactId).toArray(),
  ]);
  return [
    ...asA.map((c) => ({ connectionId: c.id, contactId: c.contactBId, tipo: c.tipoAB, auto: c.auto, notes: c.notes })),
    ...asB.map((c) => ({ connectionId: c.id, contactId: c.contactAId, tipo: c.tipoBA, auto: c.auto, notes: c.notes })),
  ];
}

/** Conecta automaticamente um contato a todos os demais contatos de uma
 * empresa com o tipo informado (simétrico). Nunca sobrescreve uma conexão
 * manual já existente entre o par. Usada para "colegas de trabalho" (ao
 * cadastrar/mover para uma empresa) e "ex colega de trabalho" (ao sair). */
async function autoLinkToCompany(contactId: string, companyId: string, tipo: string): Promise<void> {
  const now = new Date().toISOString();
  const colleagues = await db.contacts.where('companyId').equals(companyId).toArray();
  for (const colleague of colleagues) {
    if (colleague.id === contactId) continue;
    const existing = await findConnectionBetween(contactId, colleague.id);
    if (existing) {
      if (!existing.auto) continue; // não mexe em conexão criada/editada manualmente
      await db.contactConnections.update(existing.id, { tipoAB: tipo, tipoBA: tipo, updatedAt: now });
    } else {
      await db.contactConnections.add({
        id: uuid(),
        contactAId: contactId,
        contactBId: colleague.id,
        tipoAB: tipo,
        tipoBA: tipo,
        auto: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

/** Chamado ao cadastrar um contato novo: conecta com todos os colegas da
 * mesma empresa como "Colegas de trabalho". */
export async function autoLinkNewContact(contactId: string, companyId: string): Promise<void> {
  await autoLinkToCompany(contactId, companyId, AUTO_COLLEAGUE);
}

/** Chamado ao mudar a empresa de um contato: retagueia as conexões
 * automáticas com a empresa anterior para "Ex colega de trabalho" (sem
 * apagar o histórico) e cria/atualiza as conexões com a empresa nova. */
export async function handleContactCompanyChange(
  contactId: string,
  oldCompanyId: string,
  newCompanyId: string,
): Promise<void> {
  if (oldCompanyId === newCompanyId) return;
  await autoLinkToCompany(contactId, oldCompanyId, AUTO_EX_COLLEAGUE);
  await autoLinkToCompany(contactId, newCompanyId, AUTO_COLLEAGUE);
}
