import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { getConnectionsForContact } from '../services/connections';
import type { Company, Contact } from '../lib/types';

export interface NetworkEdge {
  connectionId: string;
  tipo: string;
  auto?: boolean;
  notes?: string;
  contact: Contact;
  company?: Company;
}

export interface ContactNetwork {
  focal: Contact;
  focalCompany?: Company;
  edges: NetworkEdge[];
}

export function useContactNetwork(contactId: string | null): ContactNetwork | undefined {
  return useLiveQuery(async () => {
    if (!contactId) return undefined;
    const focal = await db.contacts.get(contactId);
    if (!focal) return undefined;
    const focalCompany = await db.companies.get(focal.companyId);
    const views = await getConnectionsForContact(contactId);
    const edges: NetworkEdge[] = [];
    for (const view of views) {
      const contact = await db.contacts.get(view.contactId);
      if (!contact) continue;
      const company = await db.companies.get(contact.companyId);
      edges.push({ connectionId: view.connectionId, tipo: view.tipo, auto: view.auto, notes: view.notes, contact, company });
    }
    edges.sort((a, b) => a.contact.name.localeCompare(b.contact.name, 'pt-BR'));
    return { focal, focalCompany, edges };
  }, [contactId]);
}
