import { useState } from 'react';
import type { Company } from '../lib/types';
import { createCompany, updateCompany, type CompanyInput } from '../services/companies';
import { Button, Field, Input, Textarea } from './ui/Primitives';

const emptyForm: CompanyInput = {
  name: '',
  cnpj: '',
  segment: '',
  url: '',
  address: '',
  phone: '',
  email: '',
  notes: '',
  tags: [],
};

export function CompanyForm({
  company,
  onSaved,
  onCancel,
}: {
  company?: Company;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CompanyInput>(
    company
      ? {
          name: company.name,
          cnpj: company.cnpj ?? '',
          segment: company.segment ?? '',
          url: company.url ?? '',
          address: company.address ?? '',
          phone: company.phone ?? '',
          email: company.email ?? '',
          notes: company.notes ?? '',
          tags: company.tags ?? [],
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (company) {
        await updateCompany(company.id, form);
        onSaved(company.id);
      } else {
        const id = await createCompany(form);
        onSaved(id);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome da empresa *">
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CNPJ">
          <Input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="Segmento">
          <Input value={form.segment} onChange={(e) => set('segment', e.target.value)} placeholder="Ex.: Eventos e Entretenimento" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Telefone">
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
      </div>
      <Field label="Site">
        <Input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Endereço">
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
      </Field>
      <Field label="Tags (separadas por vírgula)">
        <Input
          value={(form.tags ?? []).join(', ')}
          onChange={(e) =>
            set(
              'tags',
              e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
          placeholder="Ex.: Empresa Amiga, Ex-doador"
        />
      </Field>
      <Field label="Observações">
        <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {company ? 'Salvar alterações' : 'Cadastrar empresa'}
        </Button>
      </div>
    </form>
  );
}
