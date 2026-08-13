import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Contact, Opportunity } from '../lib/types';
import { createOpportunity, updateOpportunity, type OpportunityInput } from '../services/opportunities';
import { Button, Field, Input, Select, Textarea } from './ui/Primitives';
import { currentMonthKey, todayISODate } from '../lib/format';

export function OpportunityForm({
  funnelId,
  stageId,
  companyId,
  opportunity,
  onSaved,
  onCancel,
}: {
  funnelId: string;
  stageId: string;
  companyId?: string;
  opportunity?: Opportunity;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const companies = useLiveQuery(() => db.companies.orderBy('name').toArray(), []);
  const [form, setForm] = useState({
    companyId: opportunity?.companyId ?? companyId ?? '',
    contactId: opportunity?.contactId ?? '',
    name: opportunity?.name ?? '',
    proposal: opportunity?.proposal ?? '',
    value: opportunity?.value ?? 0,
    workingMonth: opportunity?.workingMonth ?? currentMonthKey(),
    expectedCloseDate: opportunity?.expectedCloseDate ?? '',
    notes: opportunity?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const contacts = useLiveQuery(
    () =>
      form.companyId
        ? db.contacts.where('companyId').equals(form.companyId).toArray()
        : Promise.resolve([] as Contact[]),
    [form.companyId],
  );

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = useMemo(() => !!form.companyId && !!form.name.trim(), [form.companyId, form.name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const input: OpportunityInput = {
        funnelId,
        stageId: opportunity?.stageId ?? stageId,
        companyId: form.companyId,
        contactId: form.contactId || undefined,
        name: form.name,
        proposal: form.proposal || undefined,
        value: form.value || undefined,
        workingMonth: form.workingMonth || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      };
      if (opportunity) {
        await updateOpportunity(opportunity.id, input);
        onSaved(opportunity.id);
      } else {
        const id = await createOpportunity(input);
        onSaved(id);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Empresa *">
          <Select
            value={form.companyId}
            onChange={(e) => {
              set('companyId', e.target.value);
              set('contactId', '');
            }}
            required
          >
            <option value="">Selecione...</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contato">
          <Select value={form.contactId} onChange={(e) => set('contactId', e.target.value)}>
            <option value="">—</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Nome da oportunidade *">
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </Field>
      <Field label="Proposta (o que foi ofertado)">
        <Textarea rows={2} value={form.proposal} onChange={(e) => set('proposal', e.target.value)} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Valor (R$)">
          <Input type="number" min={0} step="0.01" value={form.value} onChange={(e) => set('value', Number(e.target.value))} />
        </Field>
        <Field label="Mês trabalhado">
          <Input type="month" value={form.workingMonth} onChange={(e) => set('workingMonth', e.target.value)} />
        </Field>
        <Field label="Previsão de fechamento">
          <Input
            type="date"
            value={form.expectedCloseDate}
            min={todayISODate()}
            onChange={(e) => set('expectedCloseDate', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Observações">
        <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !canSubmit}>
          {opportunity ? 'Salvar alterações' : 'Criar oportunidade'}
        </Button>
      </div>
    </form>
  );
}
