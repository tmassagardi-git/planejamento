import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Contact } from '../lib/types';
import { createContact, updateContact, type ContactInput } from '../services/contacts';
import { Button, Field, Input, Select } from './ui/Primitives';

export function ContactForm({
  companyId,
  contact,
  onSaved,
  onCancel,
}: {
  companyId: string;
  contact?: Contact;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const companies = useLiveQuery(() => db.companies.orderBy('name').toArray(), []);
  const [form, setForm] = useState<ContactInput>({
    companyId,
    name: contact?.name ?? '',
    role: contact?.role ?? '',
    phone: contact?.phone ?? '',
    whatsapp: contact?.whatsapp ?? '',
    email: contact?.email ?? '',
    isPrimary: contact?.isPrimary ?? false,
    notes: contact?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ContactInput>(key: K, value: ContactInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (contact) {
        await updateContact(contact.id, form);
      } else {
        await createContact(form);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome *">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
        </Field>
        <Field label="Cargo">
          <Input value={form.role} onChange={(e) => set('role', e.target.value)} />
        </Field>
      </div>
      {contact && (
        <Field label="Empresa">
          <Select value={form.companyId} onChange={(e) => set('companyId', e.target.value)}>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {form.companyId !== contact.companyId && (
            <p className="mt-1 text-xs text-amber-600">
              As conexões de "Colegas de trabalho" com a empresa atual passarão para "Ex colega de trabalho".
            </p>
          )}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone">
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
        </Field>
      </div>
      <Field label="E-mail">
        <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={form.isPrimary} onChange={(e) => set('isPrimary', e.target.checked)} />
        Contato principal
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {contact ? 'Salvar' : 'Adicionar contato'}
        </Button>
      </div>
    </form>
  );
}
