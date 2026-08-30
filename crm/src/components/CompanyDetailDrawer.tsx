import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Drawer } from './ui/Drawer';
import { Tabs } from './ui/Tabs';
import { Badge, Button, Field } from './ui/Primitives';
import { Modal, ConfirmDialog } from './ui/Modal';
import { CompanyForm } from './CompanyForm';
import { ContactForm } from './ContactForm';
import { DonationCard } from './DonationCard';
import { CompanyVicTab } from './vic/CompanyVicTab';
import { NetworkMapModal } from './connections/NetworkMapModal';
import { deleteContact } from '../services/contacts';
import { getConnectionsForContact } from '../services/connections';
import { formatCurrency } from '../lib/format';
import type { Contact } from '../lib/types';
import { Network, Pencil, Phone, Plus, Trash2 } from 'lucide-react';

function ContactConnectionsBadge({ contactId, onClick }: { contactId: string; onClick: () => void }) {
  const connections = useLiveQuery(() => getConnectionsForContact(contactId), [contactId]);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
    >
      <Network size={12} /> {connections?.length ?? 0} conexões
    </button>
  );
}

export function CompanyDetailDrawer({
  companyId,
  onClose,
  initialTab = 'dados',
  initialVicEvaluationId,
}: {
  companyId: string;
  onClose: () => void;
  initialTab?: string;
  initialVicEvaluationId?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [editing, setEditing] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [mapContactId, setMapContactId] = useState<string | null>(null);

  const company = useLiveQuery(() => db.companies.get(companyId), [companyId]);
  const contacts = useLiveQuery(() => db.contacts.where('companyId').equals(companyId).toArray(), [companyId]);
  const allCompanies = useLiveQuery(() => db.companies.toArray(), []);
  const companyById = new Map((allCompanies ?? []).map((c) => [c.id, c.name]));
  const donations = useLiveQuery(
    () => db.donations.where('companyId').equals(companyId).reverse().sortBy('startDate'),
    [companyId],
  );

  if (!company) return null;

  return (
    <Drawer
      open
      onClose={onClose}
      title={company.name}
      subtitle={company.segment}
      width="xl"
      headerActions={
        <Button variant="secondary" className="px-2 py-1.5 text-xs" onClick={() => setEditing(true)}>
          <Pencil size={14} /> Editar
        </Button>
      }
    >
      <Tabs
        tabs={[
          { key: 'dados', label: 'Dados' },
          { key: 'vic', label: 'VIC' },
          { key: 'contatos', label: `Contatos (${contacts?.length ?? 0})` },
          { key: 'doacoes', label: `Histórico de Doações (${donations?.length ?? 0})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'dados' && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field label="CNPJ">
            <div className="text-sm text-slate-700">{company.cnpj || '—'}</div>
          </Field>
          <Field label="Segmento">
            <div className="text-sm text-slate-700">{company.segment || '—'}</div>
          </Field>
          <Field label="Telefone">
            <div className="text-sm text-slate-700">{company.phone || '—'}</div>
          </Field>
          <Field label="E-mail">
            <div className="text-sm text-slate-700">{company.email || '—'}</div>
          </Field>
          <div className="col-span-2">
            <Field label="Site">
              <div className="text-sm text-slate-700">{company.url || '—'}</div>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Endereço">
              <div className="text-sm text-slate-700">{company.address || '—'}</div>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Tags">
              <div className="flex flex-wrap gap-1">
                {company.tags?.length ? company.tags.map((t) => <Badge key={t}>{t}</Badge>) : '—'}
              </div>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Observações">
              <div className="whitespace-pre-wrap text-sm text-slate-700">{company.notes || '—'}</div>
            </Field>
          </div>
        </div>
      )}

      {tab === 'vic' && (
        <div className="mt-5">
          <CompanyVicTab companyId={companyId} initialEvaluationId={initialVicEvaluationId} />
        </div>
      )}

      {tab === 'contatos' && (
        <div className="mt-5 space-y-3">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setAddingContact(true)}>
              <Plus size={15} /> Adicionar contato
            </Button>
          </div>
          {contacts?.length === 0 && <p className="text-sm text-slate-400">Nenhum contato cadastrado.</p>}
          <div className="space-y-2">
            {contacts?.map((contact) => (
              <div key={contact.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    <button onClick={() => setEditingContact(contact)} className="hover:text-indigo-600 hover:underline">
                      {contact.name}
                    </button>
                    {contact.isPrimary && <Badge color="indigo">Principal</Badge>}
                  </div>
                  {contact.role && <div className="text-xs text-slate-500">{contact.role}</div>}
                  {contact.previousCompanyIds && contact.previousCompanyIds.length > 0 && (
                    <div className="text-xs text-amber-600">
                      Empresa(s) anterior(es):{' '}
                      {contact.previousCompanyIds.map((id) => companyById.get(id) ?? '—').join(', ')}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {contact.phone}
                      </span>
                    )}
                    {contact.whatsapp && <span>WhatsApp: {contact.whatsapp}</span>}
                    {contact.email && <span>{contact.email}</span>}
                  </div>
                  <div className="mt-1.5">
                    <ContactConnectionsBadge contactId={contact.id} onClick={() => setMapContactId(contact.id)} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'doacoes' && (
        <div className="mt-5 space-y-3">
          {donations?.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhuma doação registrada ainda. Doações são criadas automaticamente ao marcar uma oportunidade do Funil
              de Vendas como ganha.
            </p>
          )}
          <div className="space-y-2">
            {donations?.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
          {donations && donations.length > 0 && (
            <div className="pt-2 text-right text-sm text-slate-500">
              Total doado (histórico): {formatCurrency(donations.reduce((s, d) => s + d.totalValue, 0))}
            </div>
          )}
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar empresa">
        <CompanyForm company={company} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </Modal>

      <Modal open={addingContact} onClose={() => setAddingContact(false)} title="Adicionar contato">
        <ContactForm companyId={companyId} onSaved={() => setAddingContact(false)} onCancel={() => setAddingContact(false)} />
      </Modal>

      <Modal open={!!editingContact} onClose={() => setEditingContact(null)} title="Editar contato">
        {editingContact && (
          <ContactForm
            companyId={companyId}
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
        message={`Remover "${deletingContact?.name}" desta empresa?`}
        confirmLabel="Excluir"
      />

      {mapContactId && <NetworkMapModal contactId={mapContactId} onClose={() => setMapContactId(null)} />}
    </Drawer>
  );
}
