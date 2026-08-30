import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Contact } from '../lib/types';
import { Badge, Button, Input } from '../components/ui/Primitives';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { ContactForm } from '../components/ContactForm';
import { CompanyDetailDrawer } from '../components/CompanyDetailDrawer';
import { NetworkMapModal } from '../components/connections/NetworkMapModal';
import { getConnectionsForContact } from '../services/connections';
import { deleteContact } from '../services/contacts';
import { Network, Phone, Pencil, Plus, Search, Trash2 } from 'lucide-react';

function ConnectionsCell({ contactId, onClick }: { contactId: string; onClick: () => void }) {
  const connections = useLiveQuery(() => getConnectionsForContact(contactId), [contactId]);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
    >
      <Network size={12} /> {connections?.length ?? 0}
    </button>
  );
}

export function ContactsPage() {
  const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), []);
  const companies = useLiveQuery(() => db.companies.toArray(), []);
  const companyById = useMemo(() => new Map((companies ?? []).map((c) => [c.id, c])), [companies]);

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [mapContactId, setMapContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const companyName = companyById.get(c.companyId)?.name ?? '';
      return `${c.name} ${c.role ?? ''} ${companyName} ${c.email ?? ''}`.toLowerCase().includes(q);
    });
  }, [contacts, search, companyById]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contatos</h1>
          <p className="text-sm text-slate-500">Todos os contatos cadastrados, de todas as empresas</p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={!companies?.length}>
          <Plus size={16} /> Novo contato
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cargo, empresa ou e-mail..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Nome</th>
              <th className="px-4 py-2.5">Empresa</th>
              <th className="px-4 py-2.5">Cargo</th>
              <th className="px-4 py-2.5">Contato</th>
              <th className="px-4 py-2.5">Conexões</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((contact) => {
              const company = companyById.get(contact.companyId);
              return (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMapContactId(contact.id)} className="hover:text-indigo-600 hover:underline">
                        {contact.name}
                      </button>
                      {contact.isPrimary && <Badge color="indigo">Principal</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {company ? (
                      <button onClick={() => setSelectedCompanyId(company.id)} className="hover:text-indigo-600 hover:underline">
                        {company.name}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{contact.role || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="flex flex-col gap-0.5">
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {contact.phone}
                        </span>
                      )}
                      {contact.email && <span>{contact.email}</span>}
                      {!contact.phone && !contact.email && '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ConnectionsCell contactId={contact.id} onClick={() => setMapContactId(contact.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingContact(contact)}
                        aria-label={`Editar ${contact.name}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingContact(contact)}
                        aria-label={`Excluir ${contact.name}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {contacts && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nenhum contato encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Novo contato">
        <ContactForm onSaved={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editingContact} onClose={() => setEditingContact(null)} title="Editar contato">
        {editingContact && (
          <ContactForm
            contact={editingContact}
            onSaved={() => setEditingContact(null)}
            onCancel={() => setEditingContact(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={() => deletingContact && deleteContact(deletingContact.id)}
        title="Excluir contato"
        message={`Excluir "${deletingContact?.name}"? Isso também remove as conexões dele no mapa de relacionamento.`}
        confirmLabel="Excluir"
      />

      {mapContactId && <NetworkMapModal contactId={mapContactId} onClose={() => setMapContactId(null)} />}
      {selectedCompanyId && (
        <CompanyDetailDrawer companyId={selectedCompanyId} onClose={() => setSelectedCompanyId(null)} />
      )}
    </div>
  );
}
